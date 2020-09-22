/* global chrome */
import { getDomain } from '../common/util.js'
import { Log, LogLevel } from '../common/log.js'

const log = new Log('block', LogLevel.INFO)
const elInputPassword = document.querySelector('input.password')
const elSelectDuration = document.querySelector('select.duration')
const elError = document.querySelector('p.error')
const elButtonAsk = document.querySelector('button.ask-mommy')
const elButtonUnblock = document.querySelector('button.unblock')
const elDomain = document.querySelector('.domain')

/**
 * Update the page state. Used to drive UI.
 * @param {string} state
 */
function uiSetState (state) {
  document.body.dataset.state = state
}

/**
 * Display error message to the user.
 * @param {string} error
 */
function uiShowError (error) {
  let errMsg = error
  if (error && error.includes('options')) {
    errMsg = error.replace(
      'options',
      '<a href="/options/options.html" target="options">options</a>'
    )
  }
  elError.innerHTML = errMsg
}

/**
 * Handle click events from ask unblock button.
 * @param {Event} e
 */
function onClickAsk (e) {
  log.debug({ method: 'onClickAsk', e })
  uiSetState('confirm')
  const targetUrl = window.location.hash.substr(1)
  chrome.runtime.sendMessage({
    type: 'try-unblock-auth',
    url: targetUrl
  })
  elInputPassword.focus()
}

/**
 * Handle click events from unblock button.
 * @param {Event} e
 */
function onClickUnblock (e) {
  e.preventDefault()
  log.debug({ method: 'onClickUnblock', e })
  uiShowError('') // clear error
  var url = window.location.hash.substr(1)
  var hours = elSelectDuration.value
  var testPin = elInputPassword.value
  chrome.runtime.sendMessage(
    { type: 'try-unblock-pin', testPin, url, hours },
    unblockCallback
  )
  uiSetState('waiting')
}

/**
 * Handle any errors from `try-unblock-pin` message.
 * @param {*} response
 */
function unblockCallback (response) {
  log.debug({ method: 'unblockCallback', response })
  if (response && response.result === true) {
    uiSetState('done')
  } else if (response && response.error) {
    uiSetState('confirm')
    uiShowError(response.error)
  }
}

/**
 * Handler for messages from background.
 * @param {*} message
 * @param {*} sender
 * @param {*} sendResponse
 */
function messageHandler (message, sender, sendResponse) {
  if (message.type === 'redirect') {
    const { targetUrl } = message
    try {
      log.debug({ comment: 'redirecting', targetUrl, message })
      window.location.replace(targetUrl)
    } catch (err) {
      log.error(err)
    }
  }
}

;(function init () {
  const url = window.location.hash.slice(1)
  elDomain.innerText = getDomain(url)

  elButtonAsk.focus()
  elButtonAsk.addEventListener('click', onClickAsk)
  elButtonUnblock.addEventListener('click', onClickUnblock)

  chrome.runtime.onMessage.addListener(messageHandler)

  // sanity check, if url is not blocked, something went wrong and we should try to redirect
  chrome.runtime.sendMessage({ type: 'check-url', url }, (response) => {
    if (response && response.result && !response.blocked) {
      chrome.runtime.sendMessage({ type: 'redirect-all', url })
    }
  })

  log.prune()
})()
