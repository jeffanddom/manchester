import fetch from 'node-fetch'

export async function postMessage(params: {
  message: string
  channel: string
  token: string
}): Promise<void> {
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${params.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: params.message,
      channel: params.channel,
    }),
  })

  const resBody = await res.json()
  if (!('ok' in resBody) || resBody['ok'] !== true) {
    throw `error posting message: ${resBody['error'] ?? 'no error specified'}`
  }
}
