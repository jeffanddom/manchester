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

#### VSCode

- Add the [Remote SSH extension](https://code.visualstudio.com/docs/remote/ssh).
- From the command palette, choose "Remote-SSH: Settings". Under "Default Extensions", add `dbaeumer.vscode-eslint`. You may be asked to reconfirm whether ESLint can be used to format text in the workspace.

### Usage

#### Provisioning the instance

From your local manchester repo, run `bin/cloud-dev`.

This will provision a new EC2 instance, and update your local SSH config so you can access the instance using the `jeffanddom-cloud-dev` SSH alias. Example:

```
% bin/cloud-dev
launching new instance of template jeffanddom-cloud-dev-template-1...
instance i-033ba945bfcbf8a74 created, waiting for public hostname...
updating /Users/jeff/.ssh/config...
cloud-dev is ready!
* Remote hostname: ec2-54-219-222-91.us-west-1.compute.amazonaws.com
* SSH alias: jeffanddom-cloud-dev
  * Connect via: ssh -A jeffanddom-cloud-dev
  * Local port 3000 will be fowarded to 3000
* Press CTRL+C to terminate instance
```

Keep this program running! It will terminate the EC2 instance when closed.

#### Connecting with VSCode

Next, open the VSCode command palette and choose `Remote-SSH: Connect to Host...`. It should show `jeffanddom-cloud-dev` as an option. Once connected, choose "Open folder". Changes you make will update the cloud server's manchester repository, not the local one.

The manchester repo will likely be out-of-date, so you'll want to fetch latest changes (see [Git](#Git) below for instructions) and re-run `yarn`.

To run the game server, use the VSCode terminal and run `yarn dev`. You can access the the server via the web using the hostname emitted by `bin/cloud-dev`.

#### Connecting to the game server

If you're running the game server on the cloud dev host, you can connect to it by accessing `http://localhost:3000`. Web requests will be forwarded via SSH to the cloud host.

#### Git

SSH agent forwarding seems to be broken in VSCode, so fetch/push actions in the cloud dev server require a separate SSH session from a new terminal. To connect to the server, run:

```
ssh -A jeffanddom-cloud-dev
```

Use this terminal session to perform fetches and pushes.

Note that additional SSH connections will print the following warning, which can be safely ignored:

```
bind [127.0.0.1]:3000: Address already in use
channel_setup_fwd_listener_tcpip: cannot listen to port: 3000
Could not request local forwarding.
```

#### TODO

- When closing `bin/cloud-dev`, stop, rather than terminate, the EC2 instance. This will prevent changes in the cloud dev repo from getting lost. We may need to introduce a user-based tagging system so that multiple people can have their own dev servers.
- Wait for upstream to [fix SSH agent forwarding](https://github.com/microsoft/vscode-remote-release/issues/4183), so we can do git fetch/push on the cloud dev's repo via VSCode, rather than having to open a separate terminal.

## Ops stuff

### Building the base launch image

Launch an EC2 instance with the following:

- AMI: Ubuntu 20.04 HVM LTS (`ami-00831fc7c1e3ddc60`)
- Instance type: t3.xlarge (4 vCPUs, bursty)
- Security group: `jeffanddom-cloud-dev-sg-2`, which opens ingress ports 22, 43, 80, and 3000
- SSH key: `jeffanddom-cloud-dev-1`

Note that most of our AWS objects follow the namescheme `jeffanddom-cloud-dev-{object type}-{version number}`.

Next, perform the following on-host config:

- `sudo apt install yarn npm`
- Clone manchester, then run `yarn` to install deps

The `jeffanddom-cloud-dev-template-1` launch template includes an AMI that includes all of the above.

### IAM policies for local development

`bin/cloud-dev` needs to be able to:

- list EC2 instances
- launch EC2 instances via a launch template
- create EC2 tags
- terminate EC2 instances
- decode STS encoded error messages (just to debug EC2 error messages)

These policies are currently stored in `jeffanddom-cloud-dev-policy-1`.
