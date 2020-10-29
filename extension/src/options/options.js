/* global chrome */
import { Log, LogLevel } from '../common/log.js'
import * as msgType from '../common/msg.js'

const log = new Log('options', LogLevel.DEBUG)
const pinRegex = /^[0-9]{4}$/

const $ = (s) => document.querySelector(s)
const $$ = (s) => document.querySelectorAll(s)

const elMessages = $$('.message')
const body = $('body')

$('#btnSetPin').addEventListener('click', function setPinClick (e) {
  e.preventDefault()
  tryUpdatePin({
    oldInput: null,
    newInputs: [$('#setPin1'), $('#setPin2')]
  })
    .then((res) => res && window.close())
    .catch(log.error)
})

$('.updatePin.expand').addEventListener('click', function updatePinClick () {
  setSectionActive(true)
  $('.updatePin.section').classList.remove('hideMe')
  document.querySelector('.updatePin .message').innerText =
    'Please set the pin to something only you will know.'
  $('.updatePin .oldPin').focus()
})

$('#btnUpdatePin').addEventListener('click', function updatePinClick2 (e) {
  e.preventDefault()
  tryUpdatePin({
    oldInput: $('#updatePinOld'),
    newInputs: [$('#newPin1'), $('#newPin2')]
  })
    .then((res) => {
      res && setTimeout(() => window.location.reload(), 1000)
    })
    .catch(log.error)
})

$('.unblockAll.reset').addEventListener('click', () => {
  chrome.runtime.sendMessage(
    {
      type: msgType.MSG_UNBLOCK_ALL,
      hours: -1
    },
    function unblockAllCallback (response) {
      window.location.reload()
    }
  )
})

$('.unblockAll.expand').addEventListener('click', () => {
  setSectionActive(true)
  $('.unblockAll.section').classList.remove('hideMe')
  $('.unblockAll .prompt--input').focus()
})

$('.unblockAll form').addEventListener('submit', (e) => {
  e.preventDefault()
  const testPin = e.target.elements.pin.value
  const hours = e.target.elements.duration.value
  chrome.runtime.sendMessage(
    { type: msgType.MSG_CHECK_PIN, testPin },
    function checkPinCallback (response) {
      log.debug({ method: 'checkPinCallback', response })
      if (response && response.result === true) {
        chrome.runtime.sendMessage(
          { type: msgType.MSG_UNBLOCK_ALL, hours },
          function unblockAllCallback (response) {
            log.debug({ method: 'checkPinCallback', response })
            if (window.location.hash === '#unblockAll') {
              // from block screen
              window.close()
            } else {
              window.location.reload()
            }
          }
        )
      } else if (response && response.error) {
        const msg = $('.unblockAll .message')
        msg.innerText = response.error
        msg.classList.add('error')
        const input = $('.unblockAll .prompt--input')
        input.classList.add('error')
        input.focus()
      }
    }
  )
})

function setSectionActive (active) {
  if (active !== body.classList.contains('section-active')) {
    body.classList.toggle('section-active')
  }
}

/**
 * Show message to the user.
 * @param {string} msg
 * @param {boolean} isError
 * @param {Array<Element>} errElements
 */
function uiShowMessage ({ msg, isError, errElements }) {
  elMessages.forEach((el) => (el.innerText = msg))
  const oldErrElements = document.querySelectorAll('.error')
  oldErrElements.forEach((el) => el.classList.remove('error'))
  if (isError) {
    elMessages.forEach((el) => el.classList.add('error'))
    ;(errElements || []).forEach((el) => el && el.classList.add('error'))
  }
}

/**
 * @typedef {Object} ValidationError
 * @property {string} message
 * @property {number} inputIndex
 */

/**
 * Validate pin inputs.
 * @param {string} pin
 * @param {string} pinConfirm
 * @returns {Array<ValidationError>}
 */
function validateNewPinValues (pin, pinConfirm) {
  const errors = []
  const values = [pin, pinConfirm]
  values.forEach((value, index) => {
    if (!value.match(pinRegex)) {
      errors.push({ message: 'Pin must be 4 digits', inputIndex: index })
    }
  })

  if (pin !== pinConfirm) {
    errors.push({ message: 'Pins do not match', inputIndex: 1 })
  }

  return errors
}

async function tryUpdatePin ({
  oldInput: oldPinInput,
  newInputs: newPinInputs
}) {
  const errors = validateNewPinValues(...newPinInputs.map((e) => e.value))
  if (errors.length) {
    const error = errors[0]
    uiShowMessage({
      msg: error.message,
      isError: true,
      errElements: [newPinInputs[error.inputIndex]]
    })
    newPinInputs[error.inputIndex].focus()
    return false
  }

  var oldPin = oldPinInput && oldPinInput.value
  var newPin = newPinInputs[0].value

  try {
    await updatePin(oldPin, newPin)
    uiShowMessage({ msg: 'Pin updated successfully!' })
    setTimeout(() => window.location.reload(), 1000)
    return true
  } catch (err) {
    uiShowMessage({
      msg: err.error,
      isError: true,
      errElements: [oldPinInput]
    })
    oldPinInput.focus()
  }
  return false
}

function updatePin (oldPin, newPin) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: msgType.MSG_UPDATE_PIN, oldPin, newPin },
      (response) => {
        if (response.result) {
          resolve(response)
        } else {
          reject(response)
        }
      }
    )
  })
}

/**
 * @typedef {Object} Status
 * @property {boolean} pinSet
 */

/**
 * Retrieve status from background.
 * @returns {Status}
 */
async function getStatus () {
  return await new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: msgType.MSG_CHECK_STATUS }, function (
      response
    ) {
      if (response && response.result) {
        resolve(response)
      } else {
        reject(response)
      }
    })
  })
}

;(async function init () {
  const status = await getStatus().catch((err) => {
    log.error(err)
    uiShowMessage({
      msg: (status && status.error) || 'Internal error',
      isError: true
    })
  })

  if (!status) return

  document.body.dataset.pinSet = !!status.pinSet
  if (!status.pinSet) {
    $('#setPin1').focus()
    setSectionActive(true)
  }

  if (status.unblockAll) {
    $('.unblockAll.reset').classList.remove('hideMe')
  } else {
    $('.unblockAll.expand').classList.remove('hideMe')
  }
})()
