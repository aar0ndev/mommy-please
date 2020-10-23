// mock the chrome.storage.local/sync api
export function fakeStorage (initialData) {
  let data = initialData || {}
  return {
    get (keys, callback) {
      if (keys === null) {
        callback(data)
        return
      }
      const result = {}
      if (typeof keys === 'string') {
        result[keys] = data[keys]
      } else {
        keys.forEach((k) => {
          result[k] = data[k]
        })
      }
      callback(result)
    },
    set (values, callback) {
      for (const k in values) {
        data[k] = values[k]
      }
      callback && callback()
    },
    remove (keys, callback) {
      if (typeof keys === 'string') {
        delete data[keys]
      } else {
        for (const key of keys) {
          delete data[key]
        }
      }
      callback && callback()
    },
    clear (callback) {
      data = {}
      callback()
    },
    onChanged: {
      addListener (callback) {
        throw new Error('not implemented')
      }
    }
  }
}
