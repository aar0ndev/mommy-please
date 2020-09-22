const LogLevel = Object.freeze({
  DEBUG: Object.freeze({ val: 0, name: 'DEBUG' }),
  INFO: Object.freeze({ val: 1, name: 'INFO' }),
  WARN: Object.freeze({ val: 2, name: 'WARN' }),
  ERROR: Object.freeze({ val: 3, name: 'ERROR' })
})

const MAX_LOG_SIZE = 100

function Log (name, level) {
  const _ = {}
  _.name = name || 'default'
  _.logKey = '_log_' + name
  setLevel(level || LogLevel.INFO)

  return { debug, info, warn, error, clear, prune, setLevel }

  function debug (data) {
    _log(LogLevel.DEBUG, data)
  }

  function info (data) {
    _log(LogLevel.INFO, data)
  }

  function warn (data) {
    _log(LogLevel.WARN, data)
  }

  function error (data) {
    _log(LogLevel.ERROR, data)
  }

  function clear () {
    localStorage.removeItem(_.logKey)
  }

  function prune () {
    const logList = _getAll()
    if (logList.length > MAX_LOG_SIZE) {
      _updateAll(logList.slice(logList.length - MAX_LOG_SIZE))
    }
  }

  function setLevel (level) {
    if (level && level.name in LogLevel) {
      _.level = LogLevel[level.name]
    } else {
      throw new Error('LogLevel not valid')
    }
  }

  function _getAll () {
    return JSON.parse(localStorage.getItem(_.logKey) || '[]')
  }

  function _updateAll (logData) {
    localStorage.setItem(_.logKey, JSON.stringify(logData))
  }

  function _log (level, data) {
    if (level.val < _.level.val) {
      return
    }
    console.debug(`[${level.name}]`, data)
    const logList = _getAll()

    // try to guess if an error was passed
    if (data.stack && data.message) {
      data = { error: data.message }
    }
    logList.push({ date: new Date(), level: level.name, data })
    _updateAll(logList)
  }
}

export { Log, LogLevel }
