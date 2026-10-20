import { useCallback, useEffect, useRef } from 'react'
import socket from '../lib/socket.js'

function drawStroke(context, stroke, width, height) {
  const points = stroke.points
  if (!points.length) return

  context.save()
  context.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over'
  context.strokeStyle = stroke.color
  context.fillStyle = stroke.color
  context.lineWidth = stroke.size
  context.lineCap = 'round'
  context.lineJoin = 'round'

  const first = points[0]
  if (points.length === 1) {
    context.beginPath()
    context.arc(first.x * width, first.y * height, stroke.size / 2, 0, Math.PI * 2)
    context.fill()
  } else {
    context.beginPath()
    context.moveTo(first.x * width, first.y * height)
    for (let index = 1; index < points.length; index += 1) {
      context.lineTo(points[index].x * width, points[index].y * height)
    }
    context.stroke()
  }
  context.restore()
}

function CanvasBoard({ tool, color, size, clearVersion }) {
  const canvasRef = useRef(null)
  const strokesRef = useRef([])
  const activeStrokeRef = useRef(null)
  const strokeSequenceRef = useRef(0)
  const previousClearVersionRef = useRef(clearVersion)
  const settingsRef = useRef({ tool, color, size })
  const renderRef = useRef(() => {})

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const bounds = canvas.getBoundingClientRect()
    const context = canvas.getContext('2d')
    if (!context || !bounds.width || !bounds.height) return

    const ratio = window.devicePixelRatio || 1
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    strokesRef.current.forEach((stroke) => drawStroke(context, stroke, bounds.width, bounds.height))
  }, [])

  useEffect(() => {
    settingsRef.current = { tool, color, size }
  }, [tool, color, size])

  useEffect(() => {
    renderRef.current = render
  }, [render])

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return undefined

    const resizeCanvas = () => {
      const bounds = parent.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
      canvas.width = Math.round(bounds.width * ratio)
      canvas.height = Math.round(bounds.height * ratio)
      renderRef.current()
    }

    const observer = new ResizeObserver(resizeCanvas)
    observer.observe(parent)
    resizeCanvas()
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (previousClearVersionRef.current === clearVersion) return
    previousClearVersionRef.current = clearVersion
    strokesRef.current = []
    activeStrokeRef.current = null
    renderRef.current()
    if (socket.connected) socket.emit('board:clear')
  }, [clearVersion])

  useEffect(() => {
    function handleRemoteStrokeStart(message) {
      if (!message || message.senderId === socket.id || !message.id) return
      if (!['pen', 'eraser'].includes(message.tool) || !Array.isArray(message.points)) return
      if (strokesRef.current.some((stroke) => stroke.id === message.id)) return

      const { senderId: _senderId, ...stroke } = message
      strokesRef.current.push({ ...stroke, points: [...stroke.points] })
      renderRef.current()
    }

    function handleRemoteStrokePoints(message) {
      if (!message || message.senderId === socket.id || !Array.isArray(message.points)) return
      const stroke = strokesRef.current.find((item) => item.id === message.id)
      if (!stroke) return
      stroke.points.push(...message.points)
      renderRef.current()
    }

    function handleRemoteStrokeEnd(message) {
      if (!message || message.senderId === socket.id) return
      const stroke = strokesRef.current.find((item) => item.id === message.id)
      if (stroke) stroke.complete = true
    }

    function handleRemoteClear(message) {
      if (message?.senderId === socket.id) return
      strokesRef.current = []
      activeStrokeRef.current = null
      renderRef.current()
    }

    socket.on('board:stroke:start', handleRemoteStrokeStart)
    socket.on('board:stroke:points', handleRemoteStrokePoints)
    socket.on('board:stroke:end', handleRemoteStrokeEnd)
    socket.on('board:clear', handleRemoteClear)

    return () => {
      socket.off('board:stroke:start', handleRemoteStrokeStart)
      socket.off('board:stroke:points', handleRemoteStrokePoints)
      socket.off('board:stroke:end', handleRemoteStrokeEnd)
      socket.off('board:clear', handleRemoteClear)
    }
  }, [])

  function getPoint(event) {
    const bounds = canvasRef.current.getBoundingClientRect()
    return {
      x: Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)),
      y: Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height)),
    }
  }

  function startStroke(event) {
    if (event.button !== 0) return
    event.preventDefault()
    const settings = settingsRef.current
    const point = getPoint(event)
    const stroke = {
      id: `${socket.id ?? 'offline'}-${++strokeSequenceRef.current}`,
      tool: settings.tool,
      color: settings.color,
      size: settings.size,
      points: [point],
      synced: socket.connected,
    }
    strokesRef.current.push(stroke)
    activeStrokeRef.current = stroke
    canvasRef.current.setPointerCapture(event.pointerId)
    if (stroke.synced) {
      socket.emit('board:stroke:start', {
        id: stroke.id,
        tool: stroke.tool,
        color: stroke.color,
        size: stroke.size,
        points: [point],
      })
    }
    renderRef.current()
  }

  function continueStroke(event) {
    const stroke = activeStrokeRef.current
    if (!stroke) return
    const point = getPoint(event)
    stroke.points.push(point)
    if (stroke.synced && socket.connected) {
      socket.emit('board:stroke:points', { id: stroke.id, points: [point] })
    }
    renderRef.current()
  }

  function finishStroke(event) {
    const stroke = activeStrokeRef.current
    if (!stroke) return
    activeStrokeRef.current = null
    stroke.complete = true
    if (stroke.synced && socket.connected) {
      socket.emit('board:stroke:end', { id: stroke.id })
    }
    if (canvasRef.current.hasPointerCapture(event.pointerId)) {
      canvasRef.current.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className={`drawing-canvas ${tool === 'eraser' ? 'eraser-cursor' : 'pen-cursor'}`}
      aria-label="Drawing canvas"
      onPointerDown={startStroke}
      onPointerMove={continueStroke}
      onPointerUp={finishStroke}
      onPointerCancel={finishStroke}
      onLostPointerCapture={() => { activeStrokeRef.current = null }}
    />
  )
}

export default CanvasBoard
