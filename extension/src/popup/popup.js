/* global chrome */
import { Log, LogLevel } from '../common/log.js'
import * as msgType from '../common/msg.js'

const log = new Log('popup', LogLevel.INFO)

var elRemoveUnblock = document.querySelector('.remove-unblock-section')
var elSpanTimeLeft = document.querySelector('span.timeLeft')
var elSpanTimeLeftUnits = document.querySelector('span.timeLeftUnits')
var elButtonBlock = document.querySelector('button.block')

/**
 * Updates UI.
 * @param {number} timeLeft - how long (in milliseconds) page remains unblocked
 */
function uiUpdate (timeLeft) {
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
function onClickBlock (e) {
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
            const { blocked, timeLeft } = response
            return resolve({ blocked, timeLeft })
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
  elButtonBlock.addEventListener('click', onClickBlock)

  const info = await getInfo().catch(log.error)
  if (info && !info.blocked) {
    uiUpdate(info.timeLeft)
  }

  log.prune()
})()
