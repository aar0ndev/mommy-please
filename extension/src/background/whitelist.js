import { getDomain } from '../common/util.js'
import { Log } from '../common/log.js'
import { LOG_LEVEL } from '../common/const.js'
import { Timer } from '../common/timer.js'

const log = new Log('whitelist.js', LOG_LEVEL)
const WHITELIST_STORAGE_KEY = '__whitelist'
let _whitelist = {}
let _storage = null
/** @type {Timer} **/
let _timer = null
let _changeListener = null
let _expiredListener = null

/**
 * Adds the given URL to the whitelist.
 * @param {string} url - URL to add to whitelist
 * @param {number} timestamp - date (in milliseconds since epoch) when entry becomes invalid
 */
export function addUrl (url, timestamp) {
  var domain = getDomain(url)
  if (domain) {
    log.info({ comment: 'whitelisting', domain, url, timestamp })
    const timerData = { domain, url, timestamp }
    const timerId = _timer.set(
      'expired',
      Math.max(0, timestamp - Date.now()),
      timerData
    )
    notifyChanged({ domain })
    _whitelist[domain] = { domain, url, timestamp, timerId }
    _storage.set({ [WHITELIST_STORAGE_KEY]: _whitelist })
    return true
  }
  return false
}

/**
 * Removes given URL from the whitelist.
 * @param {string} url - URL to remove from the whitelist
 */
export function removeUrl (url) {
  var domain = getDomain(url)
  if (domain) {
    log.info({ comment: 'un-whitelisting', domain, details: { url } })
    _timer.cancel(_whitelist[domain].timerId)
    delete _whitelist[domain]
    notifyChanged({ domain })
    _storage.set({ [WHITELIST_STORAGE_KEY]: _whitelist })
    return true
  }
  return false
}

/**
 * @typedef WhitelistCheck
 * @property {boolean} blocked - whether or not the url is blocked
 * @property {number} timeLeft - how much time remains if unblocked (milliseconds)
 */

/**
 * Check if url is in whitelist.
 * @param {string} url
 * @returns {WhitelistCheck}
 */
export function check (url) {
  var timeLeft = getTimeLeft(url)
  if (timeLeft < 0 || timeLeft > 0) {
    return { blocked: false, timeLeft }
  }
  return { blocked: true }
}

/**
 * Set handler for change events
 * @param {Function} callback
 */
export function setChangeListener (callback) {
  _changeListener = callback
}

/**
 * Set handler for change events
 * @param {Function} callback
 */
export function setExpiredListener (callback) {
  _expiredListener = callback
}

/**
 * Initialize module.
 * @param {StorageArea} storage
 */
export async function init (storage) {
  _storage = storage

  if (_timer) {
    _timer.cancelAll()
  }
  _timer = new Timer()
  _timer.on('expired', notifyExpired)
  _changeListener = null
  _expiredListener = null

  return new Promise((resolve, reject) => {
    _storage.get([WHITELIST_STORAGE_KEY], (result) => {
      if (result && result[WHITELIST_STORAGE_KEY]) {
        _whitelist = result[WHITELIST_STORAGE_KEY]
        log.debug(
          'loaded whitelist from storage using key=' + WHITELIST_STORAGE_KEY
        )

        for (const domain in _whitelist) {
          if (!_whitelist[domain].timestamp) continue
          const { timestamp } = _whitelist[domain]
          if (timestamp > Date.now()) {
            _timer.set('expired', Math.max(0, timestamp - Date.now()), {
              domain
            })
          }
        }
      } else {
        const errMsg = 'could not load whitelist from storage'
        return reject(new Error(errMsg))
      }
      resolve()
    })
  })
}

function notifyExpired ({ domain }) {
  if (_expiredListener) {
    setTimeout(() => _expiredListener({ domain }), 0)
  }
}

function notifyChanged ({ domain }) {
  if (_changeListener) {
    setTimeout(() => _changeListener({ domain }), 0)
  }
}

function getTimestamp (url) {
  var domain = getDomain(url)
  if (domain == null || _whitelist[domain] == null) return null
  return _whitelist[domain].timestamp
}

function getTimeLeft (url) {
  var timestamp = getTimestamp(url)
  if (timestamp == null) return null
  return timestamp < 0 ? -1 : Math.max(0, timestamp - Date.now())
}
