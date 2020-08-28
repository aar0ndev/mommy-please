class Log {
  constructor (logKey) {
    this.logKey = '_log_' + logKey
  }

  debug (o) {
    var logList = JSON.parse(localStorage.getItem(this.logKey) || '[]')
    logList.push({ date: new Date(), level: 'debug', data: o })
    localStorage.setItem(this.logKey, JSON.stringify(logList))
  }

  getAll () {
    return localStorage.getItem(this.logKey) || []
  }

  clear () {
    localStorage.removeItem(this.logKey)
  }
}

const log = new Log('default')

export { Log, log }
