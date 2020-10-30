/* message types */
export const MSG_BLOCK = 'block'
export const MSG_UNBLOCK_PIN = 'try-unblock-pin'
export const MSG_UNBLOCK_AUTH = 'try-unblock-auth'
export const MSG_CHECK_URL = 'check-url'
export const MSG_UPDATE_PIN = 'update-pin'
export const MSG_CHECK_PIN = 'check-pin'
export const MSG_CHECK_STATUS = 'check-status'
export const MSG_REDIRECT_ALL = 'redirect-all'
export const MSG_UNBLOCK_ALL = 'unblock-all'

export const checkStatus = (data) => msgWrap(MSG_CHECK_STATUS, data)
export const checkPin = (data) => msgWrap(MSG_CHECK_PIN, data)
export const unblockAll = (data) => msgWrap(MSG_UNBLOCK_ALL, data)
export const updatePin = (data) => msgWrap(MSG_UPDATE_PIN, data)

/* custom error */
export const ERROR_NAME = 'MessageError'
class MessageError extends Error {
  constructor (message, msgType, response) {
    super(message)
    this.name = ERROR_NAME
    this.msgType = msgType
    this.response = response
  }
}

/* global chrome */
/* promisfied messages */
const msgWrap = (msgType, data) =>
  new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ ...data, type: msgType }, (response) => {
      if (response && response.result) {
        return resolve(response)
      } else if (response && response.error) {
        reject(new MessageError(response.error, msgType, response))
      } else {
        reject(new MessageError('unknown error', msgType, response))
      }
    })
  })
