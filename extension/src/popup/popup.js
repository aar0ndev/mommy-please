/* global chrome */

var elRemoveUnblock = document.querySelector('.remove-unblock-section')
var elSpanTimeLeft = document.querySelector('span.timeLeft')
var elSpanTimeLeftUnits = document.querySelector('span.timeLeftUnits')
var elButtonBlock = document.querySelector('button.block')

function updateTimeLeft (timeLeft) {
  elRemoveUnblock.style.display = timeLeft == null ? 'none' : 'block'
  if (timeLeft == null) return
  if (timeLeft < 0) {
    showTimeLeft(-1)
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
    showTimeLeft(hoursLeft, 'hour')
  } else if (minutesLeft) {
    showTimeLeft(minutesLeft, 'minute')
  } else {
    showTimeLeft(secondsLeft, 'second')
  }
}

function showTimeLeft (value, unit) {
  if (value < 0) {
    elSpanTimeLeft.innerText = 'forever'
    elSpanTimeLeftUnits.innerText = ''
    return
  }
  elSpanTimeLeft.innerText = 'for ' + value
  elSpanTimeLeftUnits.innerText = ' more ' + (value > 1 ? unit + 's' : unit)
}

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  var url = tabs[0].url
  chrome.runtime.sendMessage({ type: 'check-url', url }, function (response) {
    console.log(response)
    if (!(response && response.result)) return
    if (!response.blocked) {
      updateTimeLeft(response.timeLeft)
    }
  })
})

elButtonBlock.addEventListener('click', function (e) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const { id, url } = tabs[0]
    chrome.runtime.sendMessage({ type: 'block', url, tabId: id }, function (
      response
    ) {
      if (response && response.result) {
        window.close()
      } else {
        console.log('error blocking', response)
      }
    })
  })
})
