/* global chrome */
import { Log, LogLevel } from '../common/log.js'

const log = new Log('pin.js', LogLevel.DEBUG)
const PIN_STORAGE_KEY = '__pin'
let _pin = null
let _storage = null

export function isSet () {
  return _pin !== null
}

export function check (testPin) {
  return _pin !== null && _pin === testPin
}

export function update ({ oldPin, newPin }) {
  if (_pin !== null && !check(oldPin)) {
    return { error: 'Incorrect pin.' }
  }
  _pin = newPin
  _storage.set({ [PIN_STORAGE_KEY]: _pin }, () => {
    log.info({ method: 'update', msg: 'update pin done' })
  })
  return {}
}

export async function init (storage) {
  _storage = storage
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([PIN_STORAGE_KEY], (result) => {
      if (result && result[PIN_STORAGE_KEY]) {
        _pin = result[PIN_STORAGE_KEY]
        log.debug('loaded pin from storage using key=' + PIN_STORAGE_KEY)
        resolve()
      } else {
        const errMsg = 'could not retrieve pin'
        reject(new Error(errMsg))
      }
    })
  })
}
