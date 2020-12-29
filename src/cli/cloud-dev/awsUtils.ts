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
export async function getEbsVolume(
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
 * Launches a new instance based on the provided launch template, identified by
 * name.
 */
export async function launch(
  ec2: AWS.EC2,
  config: {
    templateName: string
    userTag: string // a tag that can be used to distinguish this instance from others
    az: string
  },
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
          Tags: [{ Key: 'user', Value: config.userTag }],
        },
        {
          ResourceType: 'volume',
          Tags: [{ Key: 'user', Value: config.userTag }],
        },
      ],
    })
    .promise()

  if (res.Instances === undefined || res.Instances.length == 0) {
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
    const res = await ec2
      .describeInstances({ InstanceIds: [instanceId] })
      .promise()

    const reservations = res.Reservations
    if (reservations === undefined || reservations.length == 0) {
      throw new Error(`could not find instance ${instanceId}`)
    }

    const instances = reservations[0].Instances
    if (instances === undefined || instances.length == 0) {
      throw new Error(`could not find instance ${instanceId}`)
    }

    const instance = instances[0]
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
