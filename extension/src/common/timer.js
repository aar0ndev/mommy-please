export class Timer {
  constructor () {
    this._callbacks = {}
    this._pendingEvents = {}
    this._ids = {}
  }

  on (eventName, callback) {
    if (!eventName || typeof eventName !== 'string') {
      throw new Error('Invalid eventName')
    }
    this._callbacks[eventName] = this._callbacks[eventName] || []
    this._callbacks[eventName].push(callback)
  }

  off (eventName, callback) {
    if (!eventName || typeof eventName !== 'string') {
      throw new Error('Invalid eventName')
    }
    this._callbacks[eventName] = (this._callbacks[eventName] || []).filter(
      (c) => c !== callback
    )
  }

  set (eventName, delay, data) {
    if (!eventName || typeof eventName !== 'string') {
      throw new Error('Invalid eventName')
    }
    const now = Date.now()
    this._pendingEvents[eventName] = this._pendingEvents[eventName] || []

    const id = setTimeout(() => this._check(), delay)
    const evt = {
      id,
      eventName,
      timestamp: now + delay,
      data
    }
    this._ids[id] = eventName
    this._pendingEvents[eventName].push(evt)
    return id
  }

  cancel (id) {
    // check for invalid id
    if (this._ids[id] === undefined) {
      return
    }

    clearTimeout(id)

    const eventName = this._ids[id]

    this._pendingEvents[eventName] = (
      this._pendingEvents[eventName] || []
    ).filter((e) => e.id !== id)
  }

  toJson () {
    return JSON.stringify(this._pendingEvents)
  }

  fromJson (json, ignoreExpired) {
    this._pendingEvents = JSON.parse(json) || {}

    const now = Date.now()
    const events = []
    for (const evtName in this._pendingEvents) {
      const eventsToProcess = [...(this._pendingEvents[evtName] || [])]
      this._pendingEvents[evtName] = []
      for (const evt of eventsToProcess) {
        const timeout = Math.max(0, evt.timestamp - now)
        if (timeout === 0 && ignoreExpired) {
          // do nothing
        } else {
          evt.id = setTimeout(() => this._check(), timeout)
          this._pendingEvents[evtName].push(evt)
          events.push(evt)
        }
      }
    }
    return events
  }

  _check () {
    const now = Date.now()
    for (const evtName in this._pendingEvents) {
      for (const evt of this._pendingEvents[evtName]) {
        if (now >= evt.timestamp) {
          this._pendingEvents[evtName] = (
            this._pendingEvents[evtName] || []
          ).filter((e) => e !== evt)
          this._dispatch(evtName, evt)
        }
      }
    }
  }

  _dispatch (evtName, evt) {
    for (const callback of this._callbacks[evtName] || []) {
      setTimeout(() => {
        callback(evt.data)
      }, 0)
    }
  }
}
