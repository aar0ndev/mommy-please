/* global chrome */
import { Log, LogLevel } from './log.js'
const domainRegex = /^(?:https?:?\/\/)([^/?]*)/i
const baseUrl = chrome.runtime.getURL('/')
const whitelist = {}

var pin = null

const log = new Log('background', LogLevel.DEBUG)

function isValidCode (code) {
  return pin !== null && pin === code
}

function updatePin ({ oldPin, newPin }) {
  if (pin !== null && !isValidCode(oldPin)) {
    return 'Incorrect pin.'
  }
  pin = newPin
  chrome.storage.local.set({ pin })
}

// return error message if fails
function unblock ({ url, code, timestamp }) {
  if (checkWhitelist(url)) return true
  if (isValidCode(code)) {
    whitelistUrl({ url, timestamp })
  } else {
    if (pin == null) {
      return 'Pin not set, please set in extension options before using.'
    }
    return 'Incorrect pin.'
  }
}

function whitelistUrl ({ url, timestamp }) {
  var domain = getDomain(url)
  if (domain) {
    log.info({ comment: 'whitelisting', domain, details: { url, timestamp } })
    whitelist[domain] = timestamp
    chrome.storage.local.set({ whitelist })
    return true
  }
  return false
}

function unWhitelistUrl (url) {
  var domain = getDomain(url)
  if (domain) {
    log.info({ comment: 'un-whitelisting', domain, details: { url } })
    delete whitelist[domain]
    chrome.storage.local.set({ whitelist })
    return true
  }
  return false
}

function getDomain (url) {
  if (url == null || url.match == null) return null
  var domainMatch = url.match(domainRegex)
  var domain = null
  if (domainMatch && domainMatch.length) {
    domain = domainMatch[1]
  }
  return domain
}

function checkWhitelist (url) {
  var timeLeft = getTimeLeft(url)
  if (timeLeft < 0 || timeLeft > 0) {
    return true
  }
  return false
}

function getTimeLeft (url) {
  var timestamp = getTimestamp(url)
  if (timestamp == null) return null
  return timestamp < 0 ? -1 : Math.max(0, timestamp - Date.now())
}

function getTimestamp (url) {
  var domain = getDomain(url)
  if (domain == null || whitelist[domain] == null) return null
  return whitelist[domain]
}

function onInstalled (info) {
  if (info && info.reason === 'update') {
    log.clear()
  }
  log.debug({ method: 'onInstalled', info })
  if (info && info.reason === 'install') {
    chrome.runtime.openOptionsPage()
  }
}

function onMessage (msg, sender, sendResponse) {
  let error
  let res = { result: false }
  if (msg && msg.type) {
    if (msg.type === 'block') {
      res = { result: unWhitelistUrl(msg.url) }
    }
    if (msg.type === 'unblock') {
      var timestamp = Date.now() + 1000
      if (msg.hours !== undefined) {
        if (msg.hours < 0) {
          timestamp = -1
        } else {
          timestamp += Math.round(msg.hours * 3600 * 1000)
        }
      }
      error = unblock({ url: msg.url, code: msg.code, timestamp })
      res = { result: !error, url: msg.url, error }
    }
    if (msg.type === 'check-url') {
      res = {
        result: true,
        url: msg.url,
        blocked: !checkWhitelist(msg.url),
        timestamp: getTimestamp(msg.url)
      }
    }
    if (msg.type === 'update-pin') {
      error = updatePin({ oldPin: msg.oldPin, newPin: msg.newPin })
      res = { result: !error, error }
    }
    if (msg.type === 'check-status') {
      res = { result: true, pinSet: pin != null }
    }
  }
  log.debug({ method: 'onMessage', msg, res })
  sendResponse(res)
  log.prune()
}

function onBeforeRequest (details) {
  if (details.url.startsWith(baseUrl)) {
    return
  }

  // ignore anything that is not a web page
  if (details.type !== 'main_frame') {
    log.debug({
      method: 'onBeforeRequest',
      comment: 'not a main_frame, ignoring',
      details
    })
    return
  }

  // filter requests based on whitelist
  if (!checkWhitelist(details.url)) {
    log.info({
      method: 'onBeforeRequest',
      url: details.url,
      comment: 'not in whitelist, blocking!'
    })
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL('/block/block.html#' + details.url)
    })
    log.prune()
    return
  }
  log.debug({
    method: 'onBeforeRequest',
    comment: 'ok',
    details
  })
}

function addListeners () {
  var filter = { urls: ['<all_urls>'] }
  var optExtraInfoSpec = ['blocking']

  chrome.webRequest.onBeforeRequest.addListener(
    onBeforeRequest,
    filter,
    optExtraInfoSpec
  )
  chrome.runtime.onMessage.addListener(onMessage)
  chrome.runtime.onInstalled.addListener(onInstalled)
}

;(function init () {
  log.debug({ method: 'init' })
  addListeners()
  // populate whitelist from storage

  chrome.storage.local.get(['whitelist'], function (result) {
    log.debug({ method: 'init', data: { ctx: 'after get whitelist', result } })
    if (!result.whitelist) return
    for (var k of Object.keys(result.whitelist)) {
      whitelist[k] = result.whitelist[k]
    }
  })

  chrome.storage.local.get(['pin'], function (result) {
    log.debug({ method: 'init', data: { ctx: 'after get pin', result } })
    if (result.pin == null) return
    pin = result.pin
  })

  log.prune()
})()
