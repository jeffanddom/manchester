import * as AWS from 'aws-sdk'

import * as util from '../util'

/**
 * Returns the authenticated IAM user.
 */
export async function getUser(): Promise<AWS.IAM.User> {
  const iam = new AWS.IAM()
  return (await iam.getUser().promise()).User
}

/**
 * Returns the first EBS volume matching the provided tags.
 */
export async function getEbsVolumeByTag(
  ec2: AWS.EC2,
  tags: Map<string, string>,
): Promise<AWS.EC2.Volume> {
  const filters: AWS.EC2.FilterList = []
  for (const [k, v] of tags) {
    filters.push({
      Name: `tag:${k}`,
      Values: [v],
    })
  }

  const res = await ec2.describeVolumes({ Filters: filters }).promise()
  const volumes = res.Volumes
  if (volumes === undefined || volumes.length === 0) {
    throw new Error(`no volumes discovered matching tags`)
  }
  if (volumes.length > 1) {
    throw new Error(`more than one matching volume discovered`)
  }

  return volumes[0]
}

/**
 * Returns the first EBS volume matching the provided tags.
 */
export async function getEbsVolumeById(
  ec2: AWS.EC2,
  volumeId: string,
): Promise<AWS.EC2.Volume | undefined> {
  const res = await ec2
    .describeVolumes({
      VolumeIds: [volumeId],
    })
    .promise()
  const volumes = res.Volumes
  if (volumes === undefined || volumes.length === 0) {
    return undefined
  }
  if (volumes.length > 1) {
    throw new Error(
      `more than one matching volume discovered matching id ${volumeId}`,
    )
  }

  return volumes[0]
}

/**
 * Attaches the provided instance and volume.
 */
export async function attachVolume(
  ec2: AWS.EC2,
  instanceId: string,
  volumeId: string,
): Promise<void> {
  await ec2
    .attachVolume({
      Device: '/dev/sdf',
      InstanceId: instanceId,
      VolumeId: volumeId,
    })
    .promise()
}

/**
 * Returns a new or existing EC2 instance for the provided volume.
 *
 * - If the volume is detached, a new instance will be launched.
 * - If the volume is attached to an instance, and the instance is not
 *   terminating or terminated, the existing instance will be returned.
 * - Otherwise, we will wait a short timeout and then retry.
 *
 * This function returns an EC2 instance, plus a boolean indicating whether the
 * volume is already attached to the instance. This function will throw an
 * exception after a fixed number of retries, or if it encoutners an unusual
 * situation, such as multiple attachments to the same volume.
 */
export async function getInstanceForVolume(
  ec2: AWS.EC2,
  volume: AWS.EC2.Volume,
  config: {
    instance: {
      templateName: string
      userTag: string // a tag that can be used to distinguish this instance from others
      appTag: string // a tag that can be used to distinguish this instance from others
      az: string
    }
    retries?: number
    retryDelay?: number
  },
): Promise<[AWS.EC2.Instance, boolean]> {
  const volumeId = volume.VolumeId
  if (volumeId === undefined) {
    throw `volume has undefined ID`
  }

  if (volume.Attachments === undefined || volume.Attachments.length === 0) {
    return [await launch(ec2, config.instance), false]
  }

  if (volume.Attachments.length !== 1) {
    throw `volume has unusual number of attachments: ${volume.Attachments.length}`
  }

  const attachment = volume.Attachments[0]
  if (attachment.State === undefined) {
    throw `volume attachment has undefined state`
  }

  const tryAgain = async () => {
    const retries = config.retries ?? 5
    if (retries === 0) {
      throw `too many retries attempting to get instance for volume`
    }

    const retryDelay = config.retryDelay ?? 3000
    await util.sleep(retryDelay)

    const volume = await getEbsVolumeById(ec2, volumeId)
    if (volume === undefined) {
      throw `volume not found with ID ${volumeId}`
    }

    return await getInstanceForVolume(ec2, volume, {
      ...config,
      retries: retries - 1,
      retryDelay: retryDelay * 2,
    })
  }

  switch (attachment.State) {
    case 'detached':
      return [
        await launch(ec2, config.instance),
        false, // volume is not attached to the instance
      ]

    case 'attached':
    case 'attaching': {
      const instanceId = attachment.InstanceId
      if (instanceId === undefined) {
        throw `volume in attached or attaching state, but InstanceId is undefined`
      }

      const instance = await getInstanceById(ec2, instanceId)
      if (instance === undefined) {
        return await tryAgain()
      }

      const state = instance.State?.Name
      if (state === undefined) {
        throw `could not read state for instance ${instanceId}`
      }

      if (state === 'pending' || state === 'running') {
        return [
          instance,
          true, // volume is attached to the instance
        ]
      }

      // If we got this far, the instance is being torn down, so let's wait.
      return await tryAgain()
    }

    default:
      return await tryAgain()
  }
}

export interface InstanceConfig {
  templateName: string
  userTag: string // a tag that can be used to distinguish this instance from others
  appTag: string // a tag for grouping instances by application name
  az: string
}

/**
 * Launches a new instance based on the provided launch template, identified by
 * name.
 */
export async function launch(
  ec2: AWS.EC2,
  config: InstanceConfig,
): Promise<AWS.EC2.Instance> {
  const res = await ec2
    .runInstances({
      MinCount: 1,
      MaxCount: 1,
      LaunchTemplate: { LaunchTemplateName: config.templateName },
      Placement: {
        AvailabilityZone: config.az,
      },
      TagSpecifications: [
        {
          ResourceType: 'instance',
          Tags: [
            { Key: 'user', Value: config.userTag },
            { Key: 'app', Value: config.appTag },
          ],
        },
        {
          ResourceType: 'volume',
          Tags: [{ Key: 'user', Value: config.userTag }],
        },
      ],
    })
    .promise()

  if (res.Instances === undefined || res.Instances.length === 0) {
    throw new Error('no instances returned')
  }

  return res.Instances[0]
}

/**
 * It takes a little while for PublicDnsName to become available for newly-
 * launched EC2 instances. This function will poll with backoff until the
 * hostname is available, or until reaching the max number of attempts.
 */
export async function waitForPublicDnsName(
  ec2: AWS.EC2,
  instanceId: string,
): Promise<{ name: string; ip: string }> {
  const maxAttempts = 5
  let wait = 1500
  for (let i = 0; i < maxAttempts; i++) {
    const instance = await getInstanceById(ec2, instanceId)
    if (instance === undefined) {
      throw `no instance with ID ${instanceId}`
    }

    if (
      instance.PublicDnsName !== undefined &&
      instance.PublicDnsName.length > 0 &&
      instance.PublicIpAddress !== undefined &&
      instance.PublicIpAddress.length > 0
    ) {
      return { name: instance.PublicDnsName, ip: instance.PublicIpAddress }
    }

    await util.sleep(wait)
    wait *= 2
  }

  throw new Error(
    `unable to read public hostname of ${instanceId} after ${maxAttempts} attempts`,
  )
}

export async function terminate(
  ec2: AWS.EC2,
  instanceId: string,
): Promise<void> {
  await ec2.terminateInstances({ InstanceIds: [instanceId] }).promise()
}

export async function getInstanceById(
  ec2: AWS.EC2,
  instanceId: string,
): Promise<AWS.EC2.Instance | undefined> {
  const res = await ec2
    .describeInstances({ InstanceIds: [instanceId] })
    .promise()

  const reservations = res.Reservations
  if (reservations === undefined || reservations.length === 0) {
    return undefined
  }

  const instances = reservations[0].Instances
  if (instances === undefined || instances.length === 0) {
    return undefined
  }

  return instances[0]
}
