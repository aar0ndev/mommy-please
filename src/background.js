/* global chrome */

const domainRegex = /^(?:https?:?\/\/)([^/?]*)/i
const baseUrl = chrome.runtime.getURL('/')
const whitelist = {}

var pin = null

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
  console.log('whitelisting ' + domain + '...')
  if (domain) {
    whitelist[domain] = timestamp
    chrome.storage.local.set({ whitelist })
    return true
  }
  return false
}

function unWhitelistUrl (url) {
  var domain = getDomain(url)
  console.log('removing ' + domain + ' from whitelist...')
  if (domain) {
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

function onMessageCallback (msg, sender, sendResponse) {
  var error
  if (msg && msg.type) {
    if (msg.type === 'block') {
      return sendResponse({ result: unWhitelistUrl(msg.url) })
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
      sendResponse({ result: !error, url: msg.url, error })
    }
    if (msg.type === 'check-url') {
      return sendResponse({
        result: true,
        url: msg.url,
        blocked: !checkWhitelist(msg.url),
        timestamp: getTimestamp(msg.url)
      })
    }
    if (msg.type === 'update-pin') {
      error = updatePin({ oldPin: msg.oldPin, newPin: msg.newPin })
      return sendResponse({ result: !error, error })
    }
    if (msg.type === 'check-status') {
      return sendResponse({ result: true, pinSet: pin != null })
    }
  }
  sendResponse({ result: false })
}

// filter requests based on whitelist
function onBeforeRequestCallback (details) {
  if (details.url.startsWith(baseUrl)) {
    return
  }

  if (details.type !== 'main_frame') {
    return
  }

  if (!checkWhitelist(details.url)) {
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL('/block/block.html#' + details.url)
    })
  }
}

chrome.runtime.onInstalled.addListener(function () {
  // populate whitelist from storage
  chrome.storage.local.get(['whitelist'], function (result) {
    if (!result.whitelist) return
    for (var k of Object.keys(result.whitelist)) {
      whitelist[k] = result.whitelist[k]
    }
  })

  chrome.storage.local.get(['pin'], function (result) {
    if (result.pin == null) return
    pin = result.pin
  })

  var filter = { urls: ['<all_urls>'] }
  var optExtraInfoSpec = ['blocking']

  chrome.runtime.onMessage.addListener(onMessageCallback)
  chrome.webRequest.onBeforeRequest.addListener(
    onBeforeRequestCallback,
    filter,
    optExtraInfoSpec
  )
})
