import { getDomain } from '../common/util.js'
import { Log, LogLevel } from '../common/log.js'

const log = new Log('whitelist.js', LogLevel.DEBUG)
const WHITELIST_STORAGE_KEY = '__whitelist'
let _whitelist = {}
let _storage = null

export function addUrl ({ url, timestamp }) {
  var domain = getDomain(url)
  if (domain) {
    log.info({ comment: 'whitelisting', domain, details: { url, timestamp } })
    _whitelist[domain] = timestamp
    _storage.set({ [WHITELIST_STORAGE_KEY]: _whitelist })
    return true
  }
  return false
}

export function removeUrl ({ url }) {
  var domain = getDomain(url)
  if (domain) {
    log.info({ comment: 'un-whitelisting', domain, details: { url } })
    delete _whitelist[domain]
    _storage.set({ [WHITELIST_STORAGE_KEY]: _whitelist })
    return true
  }
  return false
}

export function check (url) {
  var timeLeft = getTimeLeft(url)
  if (timeLeft < 0 || timeLeft > 0) {
    return { blocked: false, timeLeft }
  }
  return { blocked: true }
}

export async function init (storage) {
  _storage = storage
  return new Promise((resolve, reject) => {
    _storage.get([WHITELIST_STORAGE_KEY], (result) => {
      if (result && result[WHITELIST_STORAGE_KEY]) {
        _whitelist = result[WHITELIST_STORAGE_KEY]
        log.debug(
          'loaded whitelist from storage using key=' + WHITELIST_STORAGE_KEY
        )
      } else {
        const errMsg = 'could not load whitelist from storage'
        return reject(new Error(errMsg))
      }
      resolve()
    })
  })
}

function getTimestamp (url) {
  var domain = getDomain(url)
  if (domain == null || _whitelist[domain] == null) return null
  return _whitelist[domain]
}

function getTimeLeft (url) {
  var timestamp = getTimestamp(url)
  if (timestamp == null) return null
  return timestamp < 0 ? -1 : Math.max(0, timestamp - Date.now())
}
