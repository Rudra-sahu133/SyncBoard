import { useCallback, useEffect, useRef } from 'react'

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
    strokesRef.current = []
    activeStrokeRef.current = null
    renderRef.current()
  }, [clearVersion])

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
    const stroke = {
      tool: settings.tool,
      color: settings.color,
      size: settings.size,
      points: [getPoint(event)],
    }
    strokesRef.current.push(stroke)
    activeStrokeRef.current = stroke
    canvasRef.current.setPointerCapture(event.pointerId)
    renderRef.current()
  }

  function continueStroke(event) {
    const stroke = activeStrokeRef.current
    if (!stroke) return
    stroke.points.push(getPoint(event))
    renderRef.current()
  }

  function finishStroke(event) {
    if (!activeStrokeRef.current) return
    activeStrokeRef.current = null
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
