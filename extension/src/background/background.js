/* global chrome */
import { Log, LogLevel } from '../common/log.js'
import { getTimestampFromHours } from '../common/util.js'
import { authUnblock } from './auth.js'
import * as pin from './pin.js'
import * as whitelist from './whitelist.js'

const log = new Log('background', LogLevel.DEBUG)
const extensionBaseUrl = chrome.runtime.getURL('/')

/**
 * Try to unblock url with pin, return error if it fails.
 * @param {*} param0
 */
function unblock ({ url, testPin, timestamp }) {
  const { blocked } = whitelist.check(url)
  if (!blocked) {
    // unblock all
    redirectAll()
    return {}
  }
  if (pin.check(testPin)) {
    if (whitelist.addUrl({ url, timestamp })) {
      redirectAll()
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
 * Blocks any tabs with matching url.
 */
function block ({ url }) {
  whitelist.removeUrl({ url })
  redirectAll()
  return {}
}

/**
 * Redirect tabs to reflect current state of whitelist.
 */
function redirectAll () {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(({ id, url }) => {
      const isExtUrl = url.startsWith(extensionBaseUrl)
      if (!url.startsWith('http') && !isExtUrl) return
      const normalUrl = isExtUrl ? url.split('#')[1] : url
      const { blocked } = whitelist.check(normalUrl)
      if (isExtUrl && !blocked) {
        chrome.tabs.update(id, { url: normalUrl })
      } else if (!isExtUrl && blocked) {
        const redirectUrl = chrome.runtime.getURL('/block/block.html#' + url)
        chrome.tabs.update(id, { url: redirectUrl })
      }
    })
  })
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
      if (msg.type === 'block') {
        const { url, tabId } = msg
        const { error } = block({ url, tabId })
        res = { result: !error, error }
      } else if (msg.type === 'try-unblock') {
        const { testPin, url, hours } = msg
        const timestamp = getTimestampFromHours(hours)
        const { error } = unblock({ url, testPin, timestamp })
        res = { result: !error, url: msg.url, error }
      } else if (msg.type === 'unblock-auth-request') {
        authUnblock({ url: msg.url, sender })
        res = { result: true }
      } else if (msg.type === 'check-url') {
        const { blocked, timeLeft } = whitelist.check(msg.url)
        res = { result: true, url: msg.url, blocked, timeLeft }
      } else if (msg.type === 'update-pin') {
        const { newPin, oldPin } = msg
        const { error } = pin.update({ oldPin, newPin })
        res = { result: !error, error }
      } else if (msg.type === 'check-pin') {
        const { testPin } = msg
        error = pin.check(testPin)
        res = { result: !error, error }
      } else if (msg.type === 'check-status') {
        res = { result: true, pinSet: pin.isSet() }
      } else if (msg.type === 'redirect-all') {
        redirectAll()
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
  const { type, url, tabId } = details
  // ignore requests for extension assets or special protocols
  if (!url.startsWith('http')) {
    return
  }

  // ignore anything that is not a web page
  if (type !== 'main_frame') {
    log.debug({
      method: 'onBeforeRequest',
      comment: 'not a main_frame, ignoring',
      details
    })
    return
  }

  // filter requests based on whitelist
  if (whitelist.check(url).blocked) {
    log.info({
      method: 'onBeforeRequest',
      url,
      comment: 'not in whitelist, blocking!'
    })
    const redirectUrl = chrome.runtime.getURL('/block/block.html#' + url)
    chrome.tabs.update(tabId, { url: redirectUrl })
    log.prune()
    return
  }
  log.debug({
    method: 'onBeforeRequest',
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
  await whitelist.init(chrome.storage.sync).catch((err) => log.warn(err))
  await pin.init(chrome.storage.sync).catch((err) => log.warn(err))
  log.prune()
})()
