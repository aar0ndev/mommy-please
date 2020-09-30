const { db } = require('./db.js')
const uuid = require('uuid')

async function register (clientId) {
  const regId = uuid.v4()
  await db.add('reg', regId, { clientId, regId })
  await db.save()
  return regId
}

module.exports = { register }
