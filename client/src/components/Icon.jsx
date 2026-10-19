const paths = {
  board: <><rect x="3.5" y="4" width="17" height="14" rx="3" /><path d="M8 21h8M12 18v3M8 9h8M8 13h5" /></>,
  edit: <><path d="m14 5 5 5M4 20l4.2-.9L19 8.3a2.1 2.1 0 0 0-3-3L5.2 16.1 4 20Z" /><path d="M13 6 18 11" /></>,
  share: <><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" /><path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" /></>,
  pen: <><path d="m14 5 5 5M4 20l4.2-.9L19 8.3a2.1 2.1 0 0 0-3-3L5.2 16.1 4 20Z" /><path d="m13 6 5 5" /></>,
  eraser: <><path d="m7.5 4.8 11.7 11.7a2 2 0 0 1 0 2.8l-.7.7H9l-5.5-5.5a2 2 0 0 1 0-2.8l4-4a2 2 0 0 1 2.8 0Z" /><path d="m8 18 7-7" /></>,
  trash: <><path d="M4 7h16M10 11v6m4-6v6M5.5 7l1 13h11l1-13M9 7V4h6v3" /></>,
  spark: <><path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" /><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" /></>,
}

function Icon({ name, size = 18, strokeWidth = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

export default Icon
