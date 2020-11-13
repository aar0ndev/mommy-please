/* eslint-disable accessor-pairs */
const STORAGE_KEY = '__unblock_all'

/**
 * Create global unblock object.
 */
export default function UnblockAll () {
  let _active = false
  let _callback = null
  let _timeoutId = null
  let _storage = null

  return {
    /** Status of global unblock.
     * @type {boolean}
     */
    get active () {
      return _active
    },

    /**
     * Set callback for expired events.
     * @param {ExpiredCallback} cb Callback to handle the event.
     */
    set onExpired (cb) {
      _callback = cb
    },

    /**
     * Activate global unblock for specified time. If `hours` <= 0, it is disabled.
     * @param {Number} hours
     */
    set (hours) {
      _active = hours > 0
      if (_active) {
        const timeout = hours * 60 * 60 * 1000
        const timestamp = timeout + Date.now()
        _storage.set({ [STORAGE_KEY]: { active: true, timestamp } })
        _timeoutId = setTimeout(() => _callback(), timeout)
      } else if (_timeoutId !== null) {
        clearTimeout(_timeoutId)
        _storage.set({ [STORAGE_KEY]: { active: false, timestamp: 0 } })
        _timeoutId = null
      }
    },
    /**
     * Initialize global unblock with specified storage.
     * @param {ExtensionStorage} storage
     * @returns {Promise<Void>}
     */
    init (storage) {
      _storage = storage
      return new Promise((resolve, reject) => {
        _storage.get([STORAGE_KEY], function (res) {
          if (res && res[STORAGE_KEY]) {
            const { active, timestamp } = res[STORAGE_KEY]
            if (active) {
              const timeout = Math.max(0, timestamp - Date.now())
              if (timeout > 0) {
                _active = true
                setTimeout(() => _callback(), timeout)
              }
            }
            return resolve()
          }
          _storage.set({ [STORAGE_KEY]: { active: false, timestamp: 0 } })
          reject(
            new Error(`problem retrieving from storage with key ${STORAGE_KEY}`)
          )
        })
      })
    }
  }
}

/**
 * @callback ExpiredCallback
 * @returns {Void}
 */

/**
 * @typedef ExtensionStorage
 */
