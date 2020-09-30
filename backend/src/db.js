const fs = require('fs')

class JSONDatabase {
  constructor (path) {
    this._path = path
    this._db = null
  }

  async load () {
    this._db = {}
    return new Promise((resolve, reject) => {
      fs.readFile(this._path, (err, data) => {
        if (err) {
          if (err.code === 'ENOENT') {
            // file does not exist
            this._db = {}
            return this.save()
          }
          return reject(err)
        }
        this._db = JSON.parse(data)
        resolve()
      })
    })
  }

  async save () {
    return new Promise((resolve, reject) => {
      fs.writeFile(this._path, JSON.stringify(this._db), (err) => {
        if (err) return reject(err)
        resolve()
      })
    })
  }

  async update (type, key, data) {
    console.log('db.update::', type, key, data)
    const db = this._db
    db[type] = db[type] || {}
    db[type][key] = data
  }

  async add (type, key, data) {
    console.log('db.add::', type, key, data)
    const db = this._db
    db[type] = db[type] || {}
    if (db[type][key]) {
      throw new Error('key exists')
    }
    db[type][key] = data
  }

  async delete (type, key) {
    console.log('db.delete::', type, key)
    const db = this._db
    db[type] = db[type] || {}
    if (db[type][key]) {
      delete db[type][key]
    }
  }
}

const db = new JSONDatabase('../db.json')

module.exports = { db }
