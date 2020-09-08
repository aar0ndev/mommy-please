const LogLevel = Object.freeze({
  DEBUG: Object.freeze({ val: 0, name: 'DEBUG' }),
  INFO: Object.freeze({ val: 1, name: 'INFO' }),
  WARN: Object.freeze({ val: 2, name: 'WARN' }),
  ERROR: Object.freeze({ val: 3, name: 'ERROR' })
})

const MAX_LOG_SIZE = 100

class Log {
  constructor (name, level) {
    name = name || 'default'
    this.logKey = '_log_' + name
    level = level || LogLevel.DEBUG
    this.level = level
  }

  _log (level, data) {
    if (level.val < this.level.val) {
      return
    }
    console.debug(`[${level.name}]`, data)
    const logList = this._getAll()
    logList.push({ date: new Date(), level: level.name, data })
    this._updateAll(logList)
  }

  setLevel (level) {
    if (level in LogLevel) {
      this.level = level
    } else {
      throw new Error('LogLevel not valid')
    }
  }

  debug (data) {
    this._log(LogLevel.DEBUG, data)
  }

  info (data) {
    this._log(LogLevel.INFO, data)
  }

  warn (data) {
    this._log(LogLevel.WARN, data)
  }

  error (data) {
    this._log(LogLevel.ERROR, data)
  }

  _getAll () {
    return JSON.parse(localStorage.getItem(this.logKey) || '[]')
  }

  _updateAll (logData) {
    localStorage.setItem(this.logKey, JSON.stringify(logData))
  }

  clear () {
    localStorage.removeItem(this.logKey)
  }

  prune () {
    const logList = this._getAll()
    if (logList.length > MAX_LOG_SIZE) {
      this._updateAll(logList.slice(logList.length - MAX_LOG_SIZE))
    }
  }
}

export { Log, LogLevel }
