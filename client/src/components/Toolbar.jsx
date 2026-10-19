import Icon from './Icon.jsx'

const swatches = ['#4f46e5', '#111827', '#e5484d', '#f59e0b', '#0f9f75']

function Toolbar({ tool, onToolChange, color, onColorChange, size, onSizeChange, onClear }) {
  return (
    <aside className="toolbar" aria-label="Drawing tools">
      <div className="tool-group" role="group" aria-label="Select tool">
        <button className={`tool-button ${tool === 'pen' ? 'is-active' : ''}`} type="button" aria-label="Pen tool" aria-pressed={tool === 'pen'} title="Pen" onClick={() => onToolChange('pen')}>
          <Icon name="pen" />
        </button>
        <button className={`tool-button ${tool === 'eraser' ? 'is-active' : ''}`} type="button" aria-label="Eraser tool" aria-pressed={tool === 'eraser'} title="Eraser" onClick={() => onToolChange('eraser')}>
          <Icon name="eraser" />
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="color-control">
        <span className="control-label">COLOR</span>
        <div className="swatches" role="group" aria-label="Quick colors">
          {swatches.map((swatch) => (
            <button
              className={`color-swatch ${color === swatch ? 'is-selected' : ''}`}
              key={swatch}
              type="button"
              aria-label={`Use ${swatch} color`}
              aria-pressed={color === swatch}
              style={{ '--swatch-color': swatch }}
              onClick={() => onColorChange(swatch)}
            />
          ))}
          <label className={`custom-color ${!swatches.includes(color) ? 'is-selected' : ''}`} title="Choose a custom color">
            <input type="color" aria-label="Choose drawing color" value={color} onChange={(event) => onColorChange(event.target.value)} />
            <span>+</span>
          </label>
        </div>
      </div>

      <div className="toolbar-divider" />

      <label className="size-control">
        <span className="size-label-row"><span className="control-label">SIZE</span><span className="size-value">{size}<span>px</span></span></span>
        <input type="range" min="1" max="24" step="1" value={size} aria-label="Brush size" onChange={(event) => onSizeChange(Number(event.target.value))} />
        <span className="size-preview" aria-hidden="true"><span style={{ width: `${Math.max(4, size)}px`, height: `${Math.max(4, size)}px` }} /></span>
      </label>

      <div className="toolbar-divider" />

      <button className="clear-button" type="button" onClick={onClear}>
        <span className="clear-icon"><Icon name="trash" size={17} /></span>
        <span>Clear board</span>
      </button>
    </aside>
  )
}

export default Toolbar
