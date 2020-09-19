/* global chrome */
import { getDomain } from '../common/util.js'
import { Log, LogLevel } from '../common/log.js'

const log = new Log('block', LogLevel.DEBUG)
const elInputPassword = document.querySelector('input.password')
const elSelectDuration = document.querySelector('select.duration')
const elError = document.querySelector('p.error')
const elButtonAsk = document.querySelector('button.ask-mommy')
const elButtonUnblock = document.querySelector('button.unblock')
const elDomain = document.querySelector('.domain')

function uiSetState (val) {
  document.body.className = 'state-' + val
}

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

function uiClearError () {
  uiShowError('')
}

function unblockResponseCallback (response) {
  log.debug({ method: 'unblockResponseCallback', response })
  if (response && response.result === true) {
    uiSetState('done')
    // window.location.replace(response.url)
    // setTimeout(() => {
    //   log.debug({ comment: 'forcing url change', response })
    //   window.location.href = response.url
    // }, 2000)
  } else if (response && response.error) {
    uiSetState('confirm')
    uiShowError(response.error)
  }
}

function askMommyHandler (e) {
  log.debug({ method: 'askMommyHandler', e })
  uiSetState('confirm')
  const url = window.location.hash.substr(1)
  chrome.runtime.sendMessage(
    {
      type: 'unblock-auth-request',
      url
    }
    // unblockResponseCallback
  )
  elInputPassword.focus()
}

function unblockHandler (e) {
  log.debug({ method: 'askMommyHandler', e })
  e.preventDefault()
  uiClearError()
  var url = window.location.hash.substr(1)
  var hours = elSelectDuration.value
  var testPin = elInputPassword.value
  chrome.runtime.sendMessage(
    { type: 'try-unblock', testPin, url, hours },
    unblockResponseCallback
  )
  uiSetState('waiting')
}

;(function init () {
  const url = window.location.hash.slice(1)
  elButtonAsk.focus()
  elButtonAsk.addEventListener('click', askMommyHandler)
  elButtonUnblock.addEventListener('click', unblockHandler)
  elDomain.innerText = getDomain(url)

  // sanity check, if url is not blocked, something went wrong and we should try to redirect
  chrome.runtime.sendMessage({ type: 'check-url', url }, (response) => {
    if (response && response.result && !response.blocked) {
      chrome.runtime.sendMessage({ type: 'redirect-all', url })
    }
  })
  log.prune()
})()
