import cors from 'cors'
import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]

const app = express()
const httpServer = createServer(app)

app.use(cors({ origin: allowedOrigins }))

app.get('/api/health', (_request, response) => {
  response.status(200).json({ status: 'ok', service: 'syncboard-server' })
})

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
})

io.on('connection', (socket) => {
  console.log(`[socket.io] connected: ${socket.id}`)

  const relayToOtherClients = (eventName) => (payload = {}) => {
    socket.broadcast.emit(eventName, { ...payload, senderId: socket.id })
  }

  socket.on('board:stroke:start', relayToOtherClients('board:stroke:start'))
  socket.on('board:stroke:points', relayToOtherClients('board:stroke:points'))
  socket.on('board:stroke:end', relayToOtherClients('board:stroke:end'))
  socket.on('board:clear', relayToOtherClients('board:clear'))

  socket.on('disconnect', (reason) => {
    console.log(`[socket.io] disconnected: ${socket.id} (${reason})`)
  })
})

const port = Number(process.env.PORT) || 4000

httpServer.listen(port, () => {
  console.log(`SyncBoard server listening on http://localhost:${port}`)
})
