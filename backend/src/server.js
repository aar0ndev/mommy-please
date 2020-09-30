const express = require('express')
const helmet = require('helmet')
const bodyParser = require('body-parser')
const uuid = require('uuid')
const registrar = require('./registrar.js')
const { db } = require('./db.js')
const { NotifyService } = require('./notify.js')
const { PubSubService } = require('./pubsub.js')

const app = express()
app.use(helmet())
app.use(bodyParser.json())

const unblockService = new PubSubService()

/**
 * Backend status check.
 */
app.get('/', async (req, res) => {
  res.send({ status: 'ok' })
})

/**
 * Called from authorizing client after accepting notifications.
 */
app.post('/register', async (req, res) => {
  // todo: check if clientId is valid
  const clientId = req.body.clientId
  if (!clientId) {
    return res.status(501).send({ status: 'error', error: 'invalid clientId' })
  }
  try {
    // todo: inject db into registrar
    const regId = await registrar.register(clientId)
    res.send({ regId })
  } catch (ex) {
    console.log(ex)
    res
      .status(500)
      .send({ status: 'error', error: 'Error during registration' })
  }
})

/**
 * Called from extension to notify authorized devices it wants something
 */
app.post('/unblock', async (req, res) => {
  // todo: check if clientId is valid
  const clientId = req.body.clientId
  const message = req.body.message
  if (!clientId) {
    console.log('bad clientId: ' + clientId)
    return res
      .status(501)
      .send({ status: 'error', error: 'invalid clientId', clientId })
  }
  const requestId = uuid.v4()
  try {
    return res.json({ status: 'ok', reqId: requestId })
    // todo: inject db into registrar
    const authIds = await registrar.getAuthorizedApps({ clientId })
    if (!(authIds && authIds.length)) {
      return res
        .status(404)
        .send({ status: 'error', error: 'No registrants found' })
    }
    // todo: setup notify service
    const notifyService = new NotifyService(db)
    authIds.forEach((authId) =>
      notifyService.send({ clientId, requestId, authId, message })
    )
    // todo: setup event source for requestI
    const clientEventService = { add: () => {} }
    clientEventService.add({ clientId, requestId })
    res.send({ status: 'ok', clientId, requestId })
  } catch (ex) {
    console.log(ex)
    res.status(500).send('Error requesting notify')
  }
})

app.get('/unblock/listen/:regId', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const sseHandler = ({ event, message }) => {
    try {
      if (res.finished) return
      if (event) {
        res.write(`event: ${event}\n`)
      }
      if (message) {
        const data = JSON.stringify(message)
        res.write(`data: ${data}\n\n`)
      }
      if (event === 'close') {
        res.end()
      }
    } catch (err) {
      console.log(err)
    }
  }

  const channel = req.params.regId
  unblockService.sub(channel, sseHandler)

  // hack to test the functionality, need to replace with event from auth device
  setTimeout(() => {
    unblockService.pub(channel, {
      event: '',
      message: { status: 'ok' }
    })
  }, 3000)
})

// app.get('/unblock/:reqId', async (req, res) => {
//   // todo: check if clientId is valid
//   const requestId = req.params.reqId
//   try {
//     // hack for testing
//     res.json({ status: 'ok' })
//     return
//     // todo: inject db into registrar
//     const authIds = await registrar.getAuthorizedApps({ clientId })
//     if (!(authIds && authIds.length)) {
//       return res
//         .status(404)
//         .send({ status: 'error', error: 'No registrants found' })
//     }
//     // todo: setup notify service
//     const notifyService = new NotifyService(db)
//     authIds.forEach((authId) =>
//       notifyService.send({ clientId, requestId, authId, message })
//     )
//     // todo: setup event source for requestI
//     const clientEventService = { add: () => {} }
//     clientEventService.add({ clientId, requestId })
//     res.send({ status: 'ok', clientId, requestId })
//   } catch (ex) {
//     console.log(ex)
//     res.status(500).send('Error requesting notify')
//   }
// })

/**
 * Called from authorizing client to approve an unblock request.
 */
app.post('/respond', async (req, res) => {
  // todo: check if clientId is valid
  const clientId = req.body.clientId
  const authId = req.body.authId
  const reqId = req.body.reqId
  const rawMessage = req.body.message
  if (!clientId) {
    return res.status(501).send({ status: 'error', error: 'invalid clientId' })
  }
  if (!authId) {
    return res.status(501).send({ status: 'error', error: 'invalid authId' })
  }
  if (!reqId) {
    return res.status(501).send({ status: 'error', error: 'invalid reqId' })
  }
  if (!rawMessage) {
    return res.status(501).send({ status: 'error', error: 'invalid message' })
  }
  try {
    const message = JSON.parse(rawMessage)
    // todo: send event to client
    const clientEventService = { send: () => {}, close: () => {} }
    clientEventService.send({ clientId, reqId, authId, message })
    if (message.done) {
      clientEventService.close({ clientId, reqId })
    }
    res.send({ status: 'ok' })
  } catch (ex) {
    console.log(ex)
    res.status(500).send('Error requesting unblock')
  }
})

const port = 3030

;(async function init (port) {
  await db.load()
  app.listen(port, () => {
    console.log(`listening at http://localhost:${port}`)
  })
})(port)
