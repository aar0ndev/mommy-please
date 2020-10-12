import { Log } from '../common/log.js'
import { LOG_LEVEL } from '../common/const.js'

const log = new Log('pin.js', LOG_LEVEL)
const PIN_STORAGE_KEY = '__pin'
let _pin = null
let _storage = null

/**
 * Check if pin has been set.
 * @returns {boolean}
 */
export function isSet () {
  return _pin !== null
}

/**
 * Check if `pin` matches stored pin.
 * @param {string} pin
 */
export function check (pin) {
  return _pin !== null && _pin === pin
}

/**
 * Update pin to `newPin`, but only if `oldPin` matches stored pin.
 * @param {string} oldPin
 * @param {string} newPin
 */
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

/**
 * Initialize module.
 * @param {StorageArea} storage
 */
export async function init (storage) {
  _storage = storage
  return new Promise((resolve, reject) => {
    _storage.get([PIN_STORAGE_KEY], (result) => {
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
