# cloud-dev-monitor

Slack alerts for long-lived cloud-dev instances. Runs from CLI or a Lambda function.

## Configuration

### AWS permissions

`cloud-dev-monitor` requires ambient AWS credentials for calling `DescribeInstances`. Use `aws configure` for local dev, or a host-level IAM role when executing from EC2 or Lambda.

### Slack configuration

`cloud-dev-monitor` needs a Slack API token for posting alerts. This can be configured by setting the following envvars:

- `SLACK_API_TOKEN`: a token with `chat:write` scope and access to the channel below
- `SLACK_CHANNEL`: a channel in which to post alert notifications

Alternately, define `~/.cloud-dev` with the following format:

```
{
  "slackApiToken": "xoxb-...",
  "slackChannel": "#cloud-dev"
}
```

## Running locally

```
npx ts-node src/cli/cloud-dev/monitor/main.ts
```

## AWS Lambda config

- You can build a source .zip file by calling `npx ts-node src/cli/cloud-dev/monitor/build.ts`.
- Make sure to set the envvars described above.
- IAM role: assign a role to the Lambda function with the following policies:
    - EC2: `DescribeInstances`
    - `AWSLambdaBasicExecutionRole`, an AWS-managed policy for bare-bones Lambda execution (writing logs to CloudWatch, etc.)
- The function can be called periodically by setting up an EventBridge event. A top-of-the-hour scan uses the following cron expression: `cron(0 * * * ? *)`.
