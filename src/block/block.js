/* global chrome */

var input = document.querySelector('input.password')
var duration = document.querySelector('select.duration')
var errorContainer = document.querySelector('p.error')

function uiSetState (val) {
  document.body.className = 'state-' + val
}

function uiShowError (msg) {
  errorContainer.innerText = msg
}

function uiClearError () {
  uiShowError('')
}

function unblockResponseCallback (response) {
  if (response.result === true) {
    uiSetState('done')
    window.location.replace(response.url)
  } else if (response.error) {
    uiSetState('confirm')
    uiShowError(response.error)
  }
}

function askMommyHandler (e) {
  uiSetState('confirm')
  input.focus()
}

function unblockHandler (e) {
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

document
  .querySelector('button.ask-mommy')
  .addEventListener('click', askMommyHandler)
document
  .querySelector('button.unblock')
  .addEventListener('click', unblockHandler)
