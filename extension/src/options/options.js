/* global chrome */
import { Log, LogLevel } from '../common/log.js'
import * as msgType from '../common/msg.js'

const log = new Log('options', LogLevel.DEBUG)
const pinRegex = /[0-9]{4}/

const elMessage = document.querySelector('#message')

const elSectionSetPin = document.querySelector('#setPinSection')
const elInputSetPin1 = document.querySelector('#setPin1')
const elInputSetPin2 = document.querySelector('#setPin2')
const elButtonSetPin = document.querySelector('#btnSetPin')

const elSectionUpdatePin = document.querySelector('#updatePinSection')
const elButtonUpdatePin1 = document.querySelector('#btnUpdatePinStart')
const elOldPin = document.querySelector('#updatePin0')
const elNewPin1 = document.querySelector('#updatePin1')
const elNewPin2 = document.querySelector('#updatePin2')
const elButtonUpdatePin2 = document.querySelector('#btnUpdatePin')

/**
 * Show message to the user.
 * @param {string} msg
 * @param {boolean} isError
 * @param {Array<Element>} errElements
 */
function uiShowMessage ({ msg, isError, errElements }) {
  elMessage.innerText = msg
  const oldErrElements = document.querySelectorAll('.error')
  oldErrElements.forEach((el) => el.classList.remove('error'))
  if (isError) {
    elMessage.classList.add('error')
    ;(errElements || []).forEach((el) => el.classList.add('error'))
  }
}

function uiSetState (state) {
  document.body.dataset.state = state
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

function tryUpdatePin ({ oldInput, newInputs, section }, callback) {
  const errors = validateNewPinValues(...newInputs.map((e) => e.value))
  if (errors.length) {
    const error = errors[0]
    uiShowMessage({
      msg: error.message,
      isError: true,
      errElements: [newInputs[error.inputIndex]]
    })
    newInputs[error.inputIndex].focus()
    return
  }

  var oldPin = oldInput && oldInput.value
  var newPin = newInputs[0].value

  chrome.runtime.sendMessage(
    { type: msgType.MSG_UPDATE_PIN, oldPin, newPin },
    (response) => {
      if (response.result) {
        section.style.display = 'None'
        uiShowMessage({ msg: 'Success!' })
        callback && callback(null)
      } else if (response.error) {
        uiShowMessage({
          msg: response.error,
          isError: true,
          errElements: [oldInput]
        })
        callback && callback(response.error)
      }
    }
  )
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
        const { pinSet } = response
        resolve({ pinSet })
      } else {
        reject(response)
      }
    })
  })
}

function onButtonSetPin (e) {
  e.preventDefault()
  tryUpdatePin(
    {
      oldInput: null,
      newInputs: [elInputSetPin1, elInputSetPin2],
      section: elSectionSetPin
    },
    function (err) {
      if (!err) {
        window.close()
      }
    }
  )
}

function onClickButtonUpdate1 (e) {
  e.preventDefault()
  elSectionUpdatePin.classList.add('active')
}

function onClickButtonUpdate2 (e) {
  e.preventDefault()
  tryUpdatePin({
    oldInput: elOldPin,
    newInputs: [elNewPin1, elNewPin2],
    section: elSectionUpdatePin
  })
}

;(async function init () {
  const status = await getStatus().catch((err) => {
    log.error(err)
    uiShowMessage({
      msg: (status && status.error) || 'Internal error',
      isError: true,
      errElements: []
    })
  })

  if (!status) return

  if (status.pinSet) {
    uiSetState('hasPin')
  } else {
    uiSetState('noPin')
  }

  elButtonUpdatePin2.addEventListener('click', onClickButtonUpdate2)
  elButtonUpdatePin1.addEventListener('click', onClickButtonUpdate1)
  elButtonSetPin.addEventListener('click', onButtonSetPin)
})()
