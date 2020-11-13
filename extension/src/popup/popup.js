/* global chrome */
import { Log, LogLevel } from '../common/log.js'
import * as msgType from '../common/msg.js'

const log = new Log('popup', LogLevel.INFO)

const $ = (s) => document.querySelector(s)

var elRemoveUnblock = $('.remove-unblock-section')
var elRemoveUnblockAll = $('.remove-unblock-all-section')
var elSpanTimeLeft = $('span.timeLeft')
var elSpanTimeLeftUnits = $('span.timeLeftUnits')
var elButtonBlock = $('button.block')
var elButtonBlockAll = $('button.blockAll')

/**
 * Updates UI.
 * @param {number} timeLeft - how long (in milliseconds) page remains unblocked
 * @param {boolean} unblockAll - global unblock status
 */
function uiShowRemoveUnblockSite (timeLeft) {
  elRemoveUnblock.style.display = timeLeft == null ? 'none' : 'block'
  if (timeLeft == null) return
  if (timeLeft < 0) {
    uiShowTimeLeft(-1)
    return
  }
  var secondsLeft = Math.round(Math.max(0, timeLeft) / 1000.0)
  var minutesLeft = Math.round(secondsLeft / 60)
  var hoursLeft = Math.round(minutesLeft / 60)

  if (secondsLeft === 0) {
    timeLeft = null
    return
  }

  if (hoursLeft) {
    uiShowTimeLeft(hoursLeft, 'hour')
  } else if (minutesLeft) {
    uiShowTimeLeft(minutesLeft, 'minute')
  } else {
    uiShowTimeLeft(secondsLeft, 'second')
  }
}

function uiShowRemoveUnblockAll () {
  elRemoveUnblockAll.style.display = 'block'
}

/**
 * Shows the amount of time page remains unblocked.
 * @param {number} value
 * @param {string} unit
 */
function uiShowTimeLeft (value, unit) {
  if (value < 0) {
    elSpanTimeLeft.innerText = 'forever'
    elSpanTimeLeftUnits.innerText = ''
    return
  }
  elSpanTimeLeft.innerText = 'for ' + value
  elSpanTimeLeftUnits.innerText = ' more ' + (value > 1 ? unit + 's' : unit)
}

/**
 * Click handler for block button.
 * @param {Event} e
 */
function onClickRemoveUnblockSite (e) {
  e.preventDefault()
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const { url } = tabs[0]
    chrome.runtime.sendMessage({ type: msgType.MSG_BLOCK, url }, function (
      response
    ) {
      if (response && response.result) {
        window.close()
      } else {
        log.error({ comment: 'error blocking', response })
      }
    })
  })
}

/**
 * Click handler for block all button.
 * @param {Event} e
 */
async function onClickRemoveUnblockAll (e) {
  e.preventDefault()
  const response = await msgType
    .unblockAll({ hours: -1 })
    .catch((err) => log.error(err))
  if (response && response.result) {
    window.close()
  }
}

/**
 * @typedef {Object} PageBlockInfo
 * @property {boolean} blocked
 * @property {number} timeLeft
 */

/**
 * Retrieve info about active tab.
 * @returns {Promise<PageBlockInfo>}
 */
function getInfo () {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var url = tabs[0].url
      chrome.runtime.sendMessage(
        { type: msgType.MSG_CHECK_URL, url },
        function (response) {
          if (response && response.result) {
            return resolve(response)
          }
          reject(response)
        }
      )
    })
  })
}

/**
 * Initialize page.
 */
;(async function init () {
  elButtonBlock.addEventListener('click', onClickRemoveUnblockSite)
  elButtonBlockAll.addEventListener('click', onClickRemoveUnblockAll)

  const info = await getInfo().catch(log.error)
  if (info && info.unblockAll) {
    uiShowRemoveUnblockAll()
  } else if (info && !info.blocked) {
    uiShowRemoveUnblockSite(info.timeLeft, info.unblockAll)
  }

  log.prune()
})()
