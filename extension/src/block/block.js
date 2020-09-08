/* global chrome */
import { getDomain } from '../util.js'
import { Log, LogLevel } from '../log.js'

const log = new Log('block', LogLevel.DEBUG)

var input = document.querySelector('input.password')
var duration = document.querySelector('select.duration')
var errorContainer = document.querySelector('p.error')

function uiSetState (val) {
  document.body.className = 'state-' + val
}

function uiShowError (msg) {
  if (msg.includes('options')) {
    msg = msg.replace(
      'options',
      '<a href="/options/options.html" target="options">options</a>'
    )
  }
  errorContainer.innerHTML = msg
}

function uiClearError () {
  uiShowError('')
}

function unblockResponseCallback (response) {
  log.debug({ method: 'unblockResponseCallback', response })
  if (response.result === true) {
    uiSetState('done')
    window.location.replace(response.url)
    setTimeout(() => {
      log.debug({ comment: 'forcing url change', response })
      window.location.href = response.url
    }, 2000)
  } else if (response.error) {
    uiSetState('confirm')
    uiShowError(response.error)
  }
}

function askMommyHandler (e) {
  log.debug({ method: 'askMommyHandler', e })
  uiSetState('confirm')
  input.focus()
}

function unblockHandler (e) {
  log.debug({ method: 'askMommyHandler', e })
  e.preventDefault()
  uiClearError()
  var url = window.location.hash.substr(1)
  var hours = duration.value
  var code = input.value
  chrome.runtime.sendMessage(
    { type: 'unblock', code, url, hours },
    unblockResponseCallback
  )
  uiSetState('waiting')
}

const btnAsk = document.querySelector('button.ask-mommy')
btnAsk.addEventListener('click', askMommyHandler)
btnAsk.focus()
document
  .querySelector('button.unblock')
  .addEventListener('click', unblockHandler)

document.querySelector('.domain').innerText = getDomain(
  window.location.hash.slice(1)
)

log.prune()
