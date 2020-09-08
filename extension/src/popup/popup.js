/* global chrome */

var removeUnblockSection = document.querySelector('.remove-unblock-section')
var timeLeftSpan = document.querySelector('span.timeLeft')
var timeLeftUnitsSpan = document.querySelector('span.timeLeftUnits')
var blockButton = document.querySelector('button.block')

var timestamp = null
function updateTimeLeft () {
  removeUnblockSection.style.display = timestamp == null ? 'none' : 'block'
  if (timestamp == null) return
  if (timestamp < 0) {
    showTimeLeft(-1)
    return
  }
  var secondsLeft = Math.round(Math.max(0, timestamp - Date.now()) / 1000.0)
  var minutesLeft = Math.round(secondsLeft / 60)
  var hoursLeft = Math.round(minutesLeft / 60)

  if (secondsLeft === 0) {
    timestamp = null
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
    timeLeftSpan.innerText = 'forever'
    timeLeftUnitsSpan.innerText = ''
    return
  }
  timeLeftSpan.innerText = 'for ' + value
  timeLeftUnitsSpan.innerText = ' more ' + (value > 1 ? unit + 's' : unit)
}

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  var url = tabs[0].url
  chrome.runtime.sendMessage({ type: 'check-url', url }, function (response) {
    console.log(response)
    if (!(response && response.result)) return
    if (!response.blocked) {
      timestamp = response.timestamp
      setInterval(updateTimeLeft, 1000)
    }
  })
})

blockButton.addEventListener('click', function (e) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var url = tabs[0].url
    chrome.runtime.sendMessage({ type: 'block', url }, function (response) {
      if (response.result) {
        chrome.tabs.reload(tabs[0].id)
        window.close()
      } else {
        console.log('error blocking', response)
      }
    })
  })
})
