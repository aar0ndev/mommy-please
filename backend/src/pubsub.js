// defines an unblock pub/sub service
class PubSubService {
  constructor () {
    this._handlers = {}
  }

  sub (channelId, handler) {
    this._handlers[channelId] = this._handlers[channelId] || []
    this._handlers[channelId].push(handler)
  }

  pub (channelId, { event, message }) {
    if (this._handlers[channelId]) {
      for (const handler of this._handlers[channelId]) {
        if (handler) {
          handler({ event, message })
        }
      }
    }
  }
}

module.exports = { PubSubService }
