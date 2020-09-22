/* global chrome */
import { Log, LogLevel } from '../common/log.js'
import * as msgType from '../common/msg.js'

const log = new Log('options', LogLevel.DEBUG)
const pinRegex = /^[0-9]{4}$/

const elMessages = document.querySelectorAll('.message')

// const elSectionSetPin = document.querySelector('#setPinSection')
const elInputSetPin1 = document.querySelector('#setPin1')
const elInputSetPin2 = document.querySelector('#setPin2')
const elButtonSetPin = document.querySelector('#btnSetPin')

const elSectionUpdatePin = document.querySelector('#updatePinSection')
const elButtonUpdatePin1 = document.querySelector('#btnUpdatePinStart')
const elInputOldPin = document.querySelector('#updatePinOld')
const elInputNewPin1 = document.querySelector('#newPin1')
const elInputNewPin2 = document.querySelector('#newPin2')
const elButtonUpdatePin2 = document.querySelector('#btnUpdatePin')

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

async function tryUpdatePin ({ oldInput, newInputs }) {
  const errors = validateNewPinValues(...newInputs.map((e) => e.value))
  if (errors.length) {
    const error = errors[0]
    uiShowMessage({
      msg: error.message,
      isError: true,
      errElements: [newInputs[error.inputIndex]]
    })
    newInputs[error.inputIndex].focus()
    return false
  }

  var oldPin = oldInput && oldInput.value
  var newPin = newInputs[0].value

  try {
    await updatePin(oldPin, newPin)
    uiShowMessage({ msg: 'Success!' })
    return true
  } catch (err) {
    uiShowMessage({
      msg: err.error,
      isError: true,
      errElements: [oldInput]
    })
    oldInput.focus()
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
        const { pinSet } = response
        resolve({ pinSet })
      } else {
        reject(response)
      }
    })
  })
}

async function onClickButtonSetPin (e) {
  e.preventDefault()
  const res = await tryUpdatePin({
    oldInput: null,
    newInputs: [elInputSetPin1, elInputSetPin2]
  }).catch(log.error)
  if (res) {
    window.close()
  }
}

function onClickButtonUpdate1 (e) {
  e.preventDefault()
  elSectionUpdatePin.classList.add('active')
  document.querySelector('.message.hasPin').innerText =
    'Please set the pin to something only you will know.'
  elInputOldPin.focus()
}

async function onClickButtonUpdate2 (e) {
  e.preventDefault()
  const res = await tryUpdatePin({
    oldInput: elInputOldPin,
    newInputs: [elInputNewPin1, elInputNewPin2]
  }).catch(log.error)
  if (res) {
    document.querySelectorAll('input').forEach((el) => (el.value = ''))
    elSectionUpdatePin.classList.remove('active')
  }
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
  if (!status.pinSet) elInputSetPin1.focus()

  elButtonUpdatePin2.addEventListener('click', onClickButtonUpdate2)
  elButtonUpdatePin1.addEventListener('click', onClickButtonUpdate1)
  elButtonSetPin.addEventListener('click', onClickButtonSetPin)
})()
