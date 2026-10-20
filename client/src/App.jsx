import { useEffect, useState } from 'react'
import CanvasBoard from './components/CanvasBoard.jsx'
import Toolbar from './components/Toolbar.jsx'
import Icon from './components/Icon.jsx'
import socket from './lib/socket.js'
import './App.css'

function App() {
  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState('#4f46e5')
  const [size, setSize] = useState(4)
  const [clearVersion, setClearVersion] = useState(0)
  const [notice, setNotice] = useState('')
  const [connectionStatus, setConnectionStatus] = useState(socket.connected ? 'connected' : 'connecting')

  useEffect(() => {
    const handleConnect = () => setConnectionStatus('connected')
    const handleDisconnect = () => setConnectionStatus('disconnected')
    const handleConnectError = () => setConnectionStatus('disconnected')

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)

    if (socket.connected) handleConnect()
    else socket.connect()

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
      socket.disconnect()
    }
  }, [])

  function showShareNotice() {
    setNotice('Sharing will be available when collaboration is added.')
    window.setTimeout(() => setNotice(''), 2800)
  }

  return (
    <main className="syncboard-app">
      <header className="topbar">
        <a className="brand" href="#board" aria-label="SyncBoard home">
          <span className="brand-mark" aria-hidden="true"><Icon name="board" /></span>
          <span>sync<span className="brand-strong">board</span></span>
        </a>

        <div className="board-heading">
          <span className="board-kicker">YOUR WORKSPACE <span className="breadcrumb-slash">/</span> CANVAS</span>
          <h1>Untitled board <span className="edit-hint" aria-hidden="true"><Icon name="edit" /></span></h1>
        </div>

        <div className="topbar-actions">
          <span className={`saved-indicator connection-${connectionStatus}`} role="status">
            <span className="saved-dot" />{connectionStatus === 'connected' ? 'Live' : connectionStatus === 'connecting' ? 'Connecting' : 'Offline'}
          </span>
          <button className="share-button" type="button" onClick={showShareNotice}>
            <Icon name="share" /> <span>Share</span>
          </button>
        </div>
      </header>

      <section className="board-workspace" id="board" aria-label="Whiteboard workspace">
        <div className="board-caption">
          <div className="caption-icon"><Icon name="spark" /></div>
          <div><strong>A fresh canvas</strong><span>Ideas start with a single stroke.</span></div>
        </div>

        <Toolbar
          tool={tool}
          onToolChange={setTool}
          color={color}
          onColorChange={setColor}
          size={size}
          onSizeChange={setSize}
          onClear={() => setClearVersion((version) => version + 1)}
        />

        <div className="canvas-frame">
          <CanvasBoard tool={tool} color={color} size={size} clearVersion={clearVersion} />
          <div className="canvas-coordinates" aria-hidden="true"><span>BOARD 01</span><span>100%</span></div>
        </div>

        <div className="workspace-footer">
          <span className="footer-tip"><kbd>⌘</kbd><kbd>+</kbd><kbd>↵</kbd> Draw something wonderful</span>
          <span className="footer-status"><span className="status-sparkle">✳</span> Your ideas, in progress</span>
        </div>

        {notice && <div className="toast" role="status">{notice}</div>}
      </section>
    </main>
  )
}

export default App
