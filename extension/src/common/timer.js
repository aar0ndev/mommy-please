export class Timer {
  constructor () {
    this._callbacks = {}
    this._pendingEvents = {}
    this._ids = {}
  }

  on (name, callback) {
    if (!name || typeof name !== 'string') {
      throw new Error('Invalid name')
    }
    this._callbacks[name] = this._callbacks[name] || []
    this._callbacks[name].push(callback)
  }

  off (name, callback) {
    if (!name || typeof name !== 'string') {
      throw new Error('Invalid name')
    }
    this._callbacks[name] = (this._callbacks[name] || []).filter(
      (c) => c !== callback
    )
  }

  set (name, delay, data) {
    if (!name || typeof name !== 'string') {
      throw new Error('Invalid name')
    }
    const now = Date.now()

    this._pendingEvents[name] = this._pendingEvents[name] || []

    const event = {
      name,
      timestamp: now + delay,
      data
    }
    const id = setTimeout(() => this._dispatch(event), delay)
    event.id = id
    this._ids[id] = name
    this._pendingEvents[name].push(event)
    return id
  }

  cancel (id) {
    // check for invalid id
    if (this._ids[id] === undefined) {
      return
    }

    clearTimeout(id)

    const name = this._ids[id]
    delete this._ids[id]

    this._pendingEvents[name] = (this._pendingEvents[name] || []).filter(
      (e) => e.id !== id
    )
  }

  cancelAll () {
    for (const id of this._ids) {
      this.cancel(id)
    }
  }

  toJson () {
    return JSON.stringify(this._pendingEvents)
  }

  fromJson (json, ignoreExpired) {
    this._pendingEvents = JSON.parse(json) || {}

    const now = Date.now()
    const events = []
    for (const name in this._pendingEvents) {
      const eventsToProcess = [...(this._pendingEvents[name] || [])]
      this._pendingEvents[name] = []
      for (const event of eventsToProcess) {
        const timeout = Math.max(0, event.timestamp - now)
        if (timeout === 0 && ignoreExpired) {
          // do nothing
        } else {
          event.id = setTimeout(() => this._dispatch(event), timeout)
          this._ids[event.name] = event.id
          this._pendingEvents[name].push(event)
          events.push(event)
        }
      }
    }
    return events
  }

  _dispatch (event) {
    const name = event.name
    if (this._callbacks[name] === undefined) {
      console.warn('no callbacks registered for ' + name)
    }
    const callbacks = this._callbacks[name] || []
    for (const callback of callbacks) {
      setTimeout(() => {
        callback(event.data)
      }, 0)
    }
  }
}
