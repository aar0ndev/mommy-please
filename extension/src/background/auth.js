import { Log } from '../common/log.js'
import { LOG_LEVEL } from '../common/const.js'
const DEFAULT_TIMEOUT = 60 * 10 * 1000
const DEFAULT_UNBLOCK_HOURS = 1
const log = new Log('auth.js', LOG_LEVEL)

/**
 * @typedef {Object} UnblockAuthResponse
 * @property {string} status
 * @property {number} hours
 * @property {url} string
 */

/**
 * Ask server for unblock authorization.
 * @param {string} url
 * @param {number} [timeout] - time to wait (in milliseconds)
 * @returns {Promise<UnblockAuthResponse>}
 */
export async function unblock (url, timeout) {
  const response = await createUnblockRequest(url).catch(log.error)
  if (response && response.status === 'ok') {
    const waitResponse = await waitUnblockAuth(
      response.reqId,
      timeout || DEFAULT_TIMEOUT
    ).catch(log.error)
    if (waitResponse && waitResponse.status === 'ok') {
      const { status, hours } = waitResponse
      return {
        status,
        hours: hours || DEFAULT_UNBLOCK_HOURS,
        url
      }
    }
  }
  return { status: 'error' }
}

/**
 * Create unblock request.
 * @param {string} url
 */
async function createUnblockRequest (url) {
  const clientId = 1234
  const data = { type: 'unblock request', url, clientId }
  try {
    const res = await fetch(`${API_URL}/unblock`, {
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
    return { err }
  }
}

/**
 * Wait for unblock authorization for specified time period.
 * @param {string} reqId request id
 * @param {number} timeout time to wait before throwing error (ms)
 */
async function waitUnblockAuth (reqId, timeout) {
  try {
    const data = await new Promise((resolve, reject) => {
      const evtSource = new EventSource(`${API_URL}/unblock/listen/${reqId}`)
      evtSource.onmessage = (e) => {
        evtSource.close()
        resolve(e.data)
      }
      evtSource.onerror = (e) => {
        evtSource.close()
        reject(e)
      }
      setTimeout(() => {
        evtSource.close()
        fetch(`${API_URL}/unblock/${reqId}`, {
          method: 'DELETE'
        })
        reject(new Error('timeout expired'))
      }, timeout)
    })

    if (data) {
      return JSON.parse(data)
    }
  } catch (err) {
    log.error(err)
  }
}
