/* global chrome */
import { Log } from '../common/log.js'
import { LOG_LEVEL } from '../common/const.js'
import { getTimestampFromHours } from '../common/util.js'
import * as auth from './auth.js'
import * as msgType from '../common/msg.js'
import * as pin from './pin.js'
import * as whitelist from './whitelist.js'

const log = new Log('background', LOG_LEVEL)
const extensionBaseUrl = chrome.runtime.getURL('/')

/**
 * Try to unblock `url` with pin passed as`testPin`.
 * @param {string} url
 * @param {string} testPin - pin to try
 * @param {number} timestamp - when unblock expires
 */
function tryUnblockPin (url, testPin, timestamp) {
  const { blocked } = whitelist.check(url)
  if (!blocked) {
    // unblock all
    redirectTabs()
    return {}
  }
  if (pin.check(testPin)) {
    if (whitelist.addUrl(url, timestamp)) {
      redirectTabs()
    } else {
      log.error('problem adding url to whitelist, did not unblock any tabs')
    }
  } else {
    if (!pin.isSet()) {
      return {
        error: 'Pin not set, please set in extension options before using.'
      }
    }
    return { error: 'Incorrect pin.' }
  }
  return {}
}

/**
 * Request unblock from authorized devices.
 */
function tryUnblockAuth (url) {
  auth.unblock(url).then(({ status, hours, url }) => {
    log.debug({ comment: 'auth.unblock returned', status, url, hours })
    if (status === 'ok') {
      const timestamp = getTimestampFromHours(hours)
      if (!whitelist.addUrl(url, timestamp)) {
        log.warn({
          comment: 'url already in whitelist',
          method: 'tryUnblockAuth'
        })
      }
      redirectTabs()
    }
  })
}

/**
 * Redirect any tabs as needed according to whitelist.
 */
function redirectTabs () {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(({ id, url }) => {
      const isExtensionTab = url.startsWith(extensionBaseUrl)
      if (isExtensionTab) {
        const targetUrl = url.slice(url.indexOf('?') + 1)
        const { blocked } = whitelist.check(targetUrl)
        if (!blocked) {
          redirectUnblockTab(id, targetUrl)
        }
      } else {
        if (!url.startsWith('http')) {
          // ignore non http(s) urls
          return
        }
        const { blocked } = whitelist.check(url)
        if (blocked) {
          redirectBlockTab(id, url)
        }
      }
    })
  })
}

/**
 * Block a single tab.
 * @param {*} tabId
 * @param {*} targetUrl
 */
function redirectBlockTab (tabId, targetUrl) {
  const url = chrome.runtime.getURL('/block/block.html?' + targetUrl)
  // get tab before calling update in case it does not exist
  chrome.tabs.get(tabId, (tab) => tab && chrome.tabs.update(tab.id, { url }))
}

/**
 * Unblock a single tab.
 * @param {*} tabId
 * @param {*} targetUrl
 */
function redirectUnblockTab (tabId, targetUrl) {
  chrome.tabs.sendMessage(tabId, { type: 'redirect', targetUrl })
}

/**
 * Handler for extension installed event.
 * @param {*} info
 */
function onInstalled (info) {
  if (info && info.reason === 'update') {
    log.clear()
  }
  log.debug({ method: 'onInstalled', info })
  if (info && info.reason === 'install') {
    chrome.runtime.openOptionsPage()
  }
}

/**
 * Message handler for background script.
 * @param {*} msg
 * @param {*} sender
 * @param {*} sendResponse
 */
function onMessage (msg, sender, sendResponse) {
  let error
  let res = { result: false }
  try {
    if (msg && msg.type) {
      if (msg.type === msgType.MSG_BLOCK) {
        const { url } = msg
        const whitelistUpdated = whitelist.removeUrl(url)
        redirectTabs()
        const error = !whitelistUpdated && 'could not remove from whitelist'
        res = { result: !error, error }
      } else if (msg.type === msgType.MSG_UNBLOCK_PIN) {
        const { testPin, url, hours } = msg
        const timestamp = getTimestampFromHours(hours)
        const { error } = tryUnblockPin(url, testPin, timestamp)
        res = { result: !error, url, error }
      } else if (msg.type === msgType.MSG_UNBLOCK_AUTH) {
        const { url } = msg
        tryUnblockAuth(url)
        res = { result: true }
      } else if (msg.type === msgType.MSG_CHECK_URL) {
        const { blocked, timeLeft } = whitelist.check(msg.url)
        res = { result: true, url: msg.url, blocked, timeLeft }
      } else if (msg.type === msgType.MSG_UPDATE_PIN) {
        const { newPin, oldPin } = msg
        const { error } = pin.update({ oldPin, newPin })
        res = { result: !error, error }
      } else if (msg.type === msgType.MSG_CHECK_PIN) {
        const { testPin } = msg
        error = pin.check(testPin)
        res = { result: !error, error }
      } else if (msg.type === msgType.MSG_CHECK_STATUS) {
        res = { result: true, pinSet: pin.isSet() }
      } else if (msg.type === msgType.MSG_REDIRECT_ALL) {
        redirectTabs()
        res = { result: true }
      }
    }
  } catch (err) {
    log.error(err)
    res._error = err.message
  }
  log.debug({ method: 'onMessage', msg, res })
  sendResponse(res)
  log.prune()
}

/**
 * Extension request handler.
 * @param {*} details
 */
function onBeforeRequest (details) {
  const method = 'onBeforeRequest'
  const { type, url, tabId } = details
  // ignore requests for extension assets or special protocols
  if (!url.startsWith('http')) {
    return
  }

  // ignore anything that is not a web page
  if (type !== 'main_frame') {
    log.debug({
      method,
      comment: 'not a main_frame, ignoring',
      details
    })
    return
  }

  // filter requests based on whitelist
  if (whitelist.check(url).blocked) {
    log.info({
      method,
      url,
      comment: 'not in whitelist, blocking!'
    })
    // const redirectUrl = chrome.runtime.getURL('/block/block.html#' + url)
    // chrome.tabs.update(tabId, { url: redirectUrl })
    redirectBlockTab(tabId, url)
    log.prune()
    return
  }
  log.debug({
    method,
    comment: 'ok',
    details
  })
}

/**
 * Attach listeners for requests and messages.
 */
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

/**
 * Initialize extension by retrieving information from storage.
 */
;(async function init () {
  log.debug({ method: 'init' })
  addListeners()
  await whitelist.init(chrome.storage.local).catch((err) => log.warn(err))
  await pin.init(chrome.storage.sync).catch((err) => log.warn(err))
  log.prune()
})()
