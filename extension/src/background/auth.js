import { Log, LogLevel } from '../common/log.js'
import { getTimestampFromHours } from '../common/util.js'

const log = new Log('auth.js', LogLevel.INFO)

export async function authUnblock ({ url, sender }) {
  const authLookupResponse = await authLookup({ url }).catch(log.error)
  if (authLookupResponse.status === 'ok') {
    const waitResponse = await waitUnblock({
      url,
      reqId: authLookupResponse.reqId
    }).catch(log.error)
    if (waitResponse.status === 'ok') {
      return { status: 'ok', timestamp: getTimestampFromHours(1), url }
    }
  }
  return { status: 'error' }
}

async function authLookup ({ url }) {
  const clientId = 1234
  const data = { type: 'unblock request', url, clientId }
  try {
    const res = await fetch('http://localhost:3030/unblock', {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
      body: JSON.stringify(data)
    })

    return res.json()
  } catch (err) {
    log.error(err)
    return {}
  }
}

async function waitUnblock ({ url, reqId }) {
  const res = await fetch('http://localhost:3030/unblock/' + reqId)
  return res.json()
}
