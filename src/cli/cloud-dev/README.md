# Cloud development server

##  Local dev

### Setup

#### AWS credentials

Get an IAM access key for your user account via the AWS console. Make sure the user account has the `jeffanddom-cloud-dev-policy-1` attached to it. This will allow you to use local tools that make AWS API calls.

#### SSH

- Get the `jeffanddom-cloud-dev-1.pem` SSH key from 1Password. This key is used to provide SSH authentication to the EC2 development server.
- From your local terminal, `ssh-add` the following SSH keys:
    - `jeffanddom-cloud-dev-1.pem`
    - The key you use for Github access, usually `~/.ssh/id_rsa`

#### Slack

For Slack notifications, add a file called `.cloud-dev` to your home directory with the following structure:

```
{
  "slackApiToken": "token-goes-here",
  "slackChannel": "#cloud-dev"
}
```

The token should have `chat:write` scope, and be capable of posting messages to the channel specified by the `slackChannel` property.

A token for the `jeffanddom` workspace is available [here](https://api.slack.com/apps/A01U093KANR/install-on-team).

#### VSCode

- Add the [Remote SSH extension](https://code.visualstudio.com/docs/remote/ssh).
- From the command palette, choose "Remote-SSH: Settings". Under "Default Extensions", add `dbaeumer.vscode-eslint`. You may be asked to reconfirm whether ESLint can be used to format text in the workspace.

### Usage

#### Provisioning the instance

From your local manchester repo, run `bin/cloud-dev`.

This will provision a new EC2 instance, and update your local SSH config so you can access the instance using the `jeffanddom-cloud-dev` SSH alias. Example:

```
% bin/cloud-dev
fetching IAM username...
user: jeff
locating EBS volume...
volume: vol-03071059b0eeb17e7
launching new instance of template jeffanddom-cloud-dev-template-1 for user jeff...
instance: i-07d436b8954575685
waiting for public hostname...
attaching EBS volume...
updating /Users/jeff/.ssh/config...
waiting for SSH availability...
The authenticity of host 'ec2-18-144-30-187.us-west-1.compute.amazonaws.com (18.144.30.187)' can't be established.
ECDSA key fingerprint is SHA256:qJjz9J6jT43oU61FixXyhjsjtTzV1XR03v5JquijQ4k.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
mounting volume...
---
cloud-dev is ready!
* Remote hostname: ec2-18-144-30-187.us-west-1.compute.amazonaws.com
* SSH alias: jeffanddom-cloud-dev
  * Connect via: ssh jeffanddom-cloud-dev
  * Local port 3000 will be fowarded to remote port 3000
* Press CTRL+C to stop instance
---
```

Keep this program running! It will terminate the EC2 instance when closed. The EBS volume will be preserved, so don't worry too much about losing data. But as always, commit early and often, and don't forget to push!

#### Connecting with VSCode

Open the VSCode command palette and choose `Remote-SSH: Connect to Host...`. It should show `jeffanddom-cloud-dev` as an option. Once connected, choose "Open folder". Changes you make will update the cloud server's manchester repository, not the local one.

The manchester repo will likely be out-of-date, so you'll want to fetch latest changes (see [Git](#Git) below for instructions) and re-run `yarn`.

To run the game server, use the VSCode terminal and run `yarn dev`. You can access the the server via the web using the hostname emitted by `bin/cloud-dev`.

#### Connecting to the game server

If you're running the game server on the cloud dev host, you can connect to it by accessing `http://localhost:3000`. Web requests will be forwarded via SSH to the cloud host.

#### SSH

Note that additional SSH connections past the first one will print the following warning, which can be safely ignored:

```
bind [127.0.0.1]:3000: Address already in use
channel_setup_fwd_listener_tcpip: cannot listen to port: 3000
Could not request local forwarding.
```

## Ops stuff

### Building the base launch image

Launch an EC2 instance with the following:

- AMI: Ubuntu 20.04 HVM LTS (`ami-00831fc7c1e3ddc60`)
- Instance type: c5.xlarge (4 vCPUs, 8GM RAM)
- Spot request (one-time)
- Security group: `jeffanddom-cloud-dev-sg-2`, which opens ingress ports 22, 43, 80, and 3000
- SSH key: `jeffanddom-cloud-dev-1`
- Tags: `app=jeffanddom-cloud-dev`
- Metadata access: enabled

Note that most of our AWS objects follow the namescheme `jeffanddom-cloud-dev-{object type}-{version number}`.

Next, perform the following on-host config:

```
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt update
sudo apt install yarn npm
```

This can be snapshotted and used for a launch template.

The `jeffanddom-cloud-dev-template-1` launch template includes an AMI that includes all of the above.

### EBS volumes

- Config: gp3, 16GB, baseline IOPS & bandwidth
- Tags: `app=jeffanddom-cloud-dev`, `user=<IAM username>`

Modern `c5.xlarge` uses the "Nitro" system, which [exposes the new volume](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs-using-volumes.html) at `/dev/nvme1n1`.

Create the filesystem:

```
sudo mkfs -t ext4 /dev/nvme1n1
sudo mkdir /home/ubuntu/data
sudo mount /dev/nvme1n1 /home/ubuntu/data
sudo chown ubuntu:ubuntu /home/ubuntu/data
```

### IAM policies for local development

`bin/cloud-dev` needs to be able to:

- EC2 instances
  - describe
  - terminate
  - create tags
  - launch (requires access to many resources)
- EC2 volumes
  - describe
  - attach
- IAM
  - get user info
- STS
  - decode error messages (for API call errors)

These policies are currently stored in `jeffanddom-cloud-dev-policy-1`.
