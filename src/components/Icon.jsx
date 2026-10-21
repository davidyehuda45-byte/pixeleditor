import React from 'react';

/**
 * Small inline SVG icon set. Everything is local, no icon font or CDN.
 * Icons are stroke-based at 24×24 and inherit `currentColor`.
 */
const P = {
  pencil: <><path d="M4 20l4.4-1 10-10a2.12 2.12 0 0 0-3-3l-10 10L4 20z" /><path d="M13.8 6.2l4 4" /></>,
  brush: <><path d="M14.5 4.5l5 5-7.2 7.2-4.8-4.8 7-7.4z" /><path d="M8.2 12.8L4 17c-.7.7-.7 1.8 0 2.5s1.8.7 2.5 0l4.2-4.2" /><path d="M4 20l2.5-.5" /></>,
  eraser: <><path d="M3.5 16.2l8.2-8.2a2.2 2.2 0 0 1 3.1 0l2.6 2.6a2.2 2.2 0 0 1 0 3.1l-5.5 5.5H6.4l-2.9-3z" /><path d="M8.2 11l5.4 5.4" /><path d="M13 20h7" /></>,
  eyedropper: <><path d="M15.2 4.2l4.6 4.6" /><path d="M13.4 6l4.6 4.6-7.2 7.2-4.2 1.1-1.1-4.2 7.9-7.7z" /><path d="M8.2 16.1L4.5 19.8" /></>,
  bucket: <><path d="M5 12l7-7 8 8-7 7-8-8z" /><path d="M5 12l-1.5 1.5a2.1 2.1 0 0 0 0 3L6 19" /><path d="M20 16.5c0 1.5 1 2.7 1 2.7s1-1.2 1-2.7a1 1 0 0 0-2 0z" /></>,
  gradient: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M3 14h18" opacity=".5" /><path d="M3 19h18" opacity=".25" /></>,
  line: <><path d="M5.2 18.8L18.8 5.2" /><circle cx="5" cy="19" r="1.4" /><circle cx="19" cy="5" r="1.4" /></>,
  square: <rect x="4" y="4" width="16" height="16" rx="1.5" />,
  'rounded-square': <rect x="4" y="4" width="16" height="16" rx="5" />,
  circle: <circle cx="12" cy="12" r="8" />,
  polygon: <path d="M12 3.5l8 5.2-3 9.3H7l-3-9.3 8-5.2z" />,
  curve: <><path d="M4 18C6 7 18 17 20 6" /><circle cx="4" cy="18" r="1.5" /><circle cx="20" cy="6" r="1.5" /><path d="M7 9l3 2M17 15l-3-2" opacity=".5" /></>,
  type: <><path d="M5 5h14M12 5v14M8.5 19h7" /></>,
  shade: <><circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none" /></>,
  spray: <><path d="M9 8h6v12H9z" /><path d="M10 8V6h4v2" /><path d="M15.5 3.5h1M19 5h1M18 9h1M19.5 12h1M16.5 13h1M14 4V3" /></>,
  marquee: <rect x="3.5" y="3.5" width="17" height="17" rx="1" strokeDasharray="3 3" />,
  'ellipse-select': <ellipse cx="12" cy="12" rx="8.5" ry="8.5" strokeDasharray="3 3" />,
  lasso: <><path d="M4 6.5c2.8-3 12.5-3.4 15.6.7 2.7 3.6-.5 8.4-5.4 9.7-4.9 1.3-9.3.2-10.4-2.6-.9-2.3 0-5.3 2.2-7.2" /><path d="M6.5 16.5c-1.4 1.7-1.1 4.6 1.2 4.9" /></>,
  'polygon-lasso': <><path d="M5 6.5l6-2.5 7 3 1 7-5 5-7-1-2-6 0-5.5z" strokeDasharray="3 3" /><circle cx="18.5" cy="19" r="1.5" /></>,
  wand: <><path d="M4 20L14 10" /><path d="M13 3l1.2 2.8L17 7l-2.8 1.2L13 11l-1.2-2.8L9 7l2.8-1.2L13 3z" /><path d="M19 13l.8 1.7 1.7.8-1.7.8L19 18l-.8-1.7-1.7-.8 1.7-.8L19 13z" /></>,
  move: <><path d="M12 3v18M3 12h18" /><path d="M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3" /></>,
  hand: <><path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11" /><path d="M11 10V5.5a1.5 1.5 0 0 1 3 0V11" /><path d="M14 10V7a1.5 1.5 0 0 1 3 0v6" /><path d="M8 11l-1.4-1.4a1.6 1.6 0 0 0-2.3 2.3L9 18.5A5 5 0 0 0 13 21h2a5 5 0 0 0 5-5v-2" /></>,
  zoom: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21M7.5 10.5h6M10.5 7.5v6" /></>,
  'zoom-in': <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21M10.5 7.5v6M7.5 10.5h6" /></>,
  'zoom-out': <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21M7.5 10.5h6" /></>,
  fit: <><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /><rect x="8" y="8" width="8" height="8" rx="1" opacity=".5" /></>,
  maximize: <><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></>,
  save: <><path d="M5 3h11l4 4v14H5z" /><path d="M8 3v6h8V3M8 21v-7h8v7" /></>,
  'save-as': <><path d="M5 3h10l4 4v7M5 21h9" /><path d="M17 21l4-4-2.5-2.5-4 4V21z" /></>,
  'file-plus': <><path d="M6 3h8l5 5v13H6z" /><path d="M14 3v5h5M12 12v6M9 15h6" /></>,
  file: <><path d="M6 3h8l5 5v13H6z" /><path d="M14 3v5h5" /></>,
  'folder-open': <><path d="M3 7h7l2 2h8v10H3z" /><path d="M3 9h18l-2 10H3z" opacity=".6" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="M5 18l5-5 3 3 2-2 4 4" /></>,
  palette: <><path d="M12 3a9 9 0 0 0 0 18h1.3a1.7 1.7 0 0 0 1.2-2.9 1.7 1.7 0 0 1 1.2-2.9h2.1A3.2 3.2 0 0 0 21 12a9 9 0 0 0-9-9z" /><circle cx="7.5" cy="10" r="1" fill="currentColor" stroke="none" /><circle cx="10" cy="6.8" r="1" fill="currentColor" stroke="none" /><circle cx="14.5" cy="6.8" r="1" fill="currentColor" stroke="none" /><circle cx="17" cy="10.5" r="1" fill="currentColor" stroke="none" /></>,
  export: <><path d="M12 3v12M7 8l5-5 5 5" /><path d="M5 14v7h14v-7" /></>,
  download: <><path d="M12 3v12M7 10l5 5 5-5" /><path d="M4 19h16" /></>,
  upload: <><path d="M12 15V3M7 8l5-5 5 5" /><path d="M4 19h16" /></>,
  undo: <><path d="M8 7H4V3" /><path d="M4 7c5-5 14-2 16 4 1.8 5.4-2 10-7 10-3 0-5.5-1.5-7-3.5" /></>,
  redo: <><path d="M16 7h4V3" /><path d="M20 7c-5-5-14-2-16 4-1.8 5.4 2 10 7 10 3 0 5.5-1.5 7-3.5" /></>,
  play: <path d="M8 5l11 7-11 7z" fill="currentColor" stroke="none" />,
  pause: <><rect x="7" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none" /><rect x="13.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none" /></>,
  stop: <rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" stroke="none" />,
  'skip-back': <><path d="M18 6l-8 6 8 6z" fill="currentColor" stroke="none" /><path d="M6 5v14" /></>,
  'skip-forward': <><path d="M6 6l8 6-8 6z" fill="currentColor" stroke="none" /><path d="M18 5v14" /></>,
  repeat: <><path d="M17 3l4 4-4 4" /><path d="M3 11V9a2 2 0 0 1 2-2h16" /><path d="M7 21l-4-4 4-4" /><path d="M21 13v2a2 2 0 0 1-2 2H3" /></>,
  pingpong: <><path d="M4 7h11a4 4 0 0 1 0 8H9" /><path d="M7 4L4 7l3 3M17 20l3-3-3-3" /></>,
  onboarding: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1.3-1.5 2.5M12 17.5v.1" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1.3-1.5 2.5M12 17.5v.1" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.1" /></>,
  warning: <><path d="M12 3L2.5 20h19L12 3z" /><path d="M12 9v5M12 17.2v.1" /></>,
  success: <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.5 2.5L16 9.5" /></>,
  error: <><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v4h-.1a1.7 1.7 0 0 0-1.6 1z" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />,
  contrast: <><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor" stroke="none" /></>,
  grid: <><rect x="3.5" y="3.5" width="17" height="17" rx="1" /><path d="M9 3.5v17M15 3.5v17M3.5 9h17M3.5 15h17" opacity=".6" /></>,
  'grid-3x3': <><rect x="3.5" y="3.5" width="17" height="17" rx="1" /><path d="M9.2 3.5v17M14.8 3.5v17M3.5 9.2h17M3.5 14.8h17" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  'eye-off': <><path d="M3 3l18 18" /><path d="M10.6 6.1A9.8 9.8 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3 3.7M6.2 6.8A17.3 17.3 0 0 0 2.5 12S6 18 12 18c1.4 0 2.7-.3 3.8-.8" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  unlock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 7.4-2" /></>,
  layers: <><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 12l9 5 9-5M3 16l9 5 9-5" /></>,
  folder: <path d="M3 6h7l2 2h9v12H3z" />,
  'folder-plus': <><path d="M3 6h7l2 2h9v12H3z" /><path d="M12 11v6M9 14h6" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6" /></>,
  merge: <><path d="M7 4v6c0 3 2 5 5 5h5" /><path d="M14 12l3 3-3 3" /><path d="M7 20v-4" /></>,
  flatten: <><path d="M4 4h16M6 9h12M8 14h8M10 19h4" /></>,
  'arrow-up': <path d="M12 20V5M6 11l6-6 6 6" />,
  'arrow-down': <path d="M12 4v15M6 13l6 6 6-6" />,
  'arrow-left': <path d="M20 12H5M11 6l-6 6 6 6" />,
  'arrow-right': <path d="M4 12h15M13 6l6 6-6 6" />,
  'chevron-down': <path d="M6 9l6 6 6-6" />,
  'chevron-up': <path d="M6 15l6-6 6 6" />,
  'chevron-left': <path d="M15 6l-6 6 6 6" />,
  'chevron-right': <path d="M9 6l6 6-6 6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="M4 12.5l5 5L20 6.5" />,
  link: <><path d="M9.5 14.5l5-5" /><path d="M7 17a4 4 0 0 1 0-5.7l2.3-2.3a4 4 0 0 1 5.7 0" /><path d="M17 7a4 4 0 0 1 0 5.7l-2.3 2.3a4 4 0 0 1-5.7 0" /></>,
  tag: <><path d="M3 12V4h8l10 10-8 8L3 12z" /><circle cx="7.5" cy="7.5" r="1.5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
  keyboard: <><rect x="2.5" y="6" width="19" height="12" rx="2" /><path d="M6 10h.1M9 10h.1M12 10h.1M15 10h.1M18 10h.1M6 14h.1M9 14h.1M12 14h.1M15 14h.1M18 14h.1" /></>,
  command: <path d="M8 3a3 3 0 1 1-3 3v12a3 3 0 1 1 3-3h8a3 3 0 1 1 3 3V6a3 3 0 1 1-3 3H8z" />,
  contrastTheme: <><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor" stroke="none" /></>,
  'rotate-cw': <><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></>,
  'rotate-ccw': <><path d="M4 11a8 8 0 1 1 2.3 5.7" /><path d="M4 4v7h7" /></>,
  'flip-h': <><path d="M12 3v18" strokeDasharray="2 2" /><path d="M9 7L4 12l5 5V7zM15 7l5 5-5 5V7z" /></>,
  'flip-v': <><path d="M3 12h18" strokeDasharray="2 2" /><path d="M7 9L12 4l5 5H7zM7 15l5 5 5-5H7z" /></>,
  crop: <><path d="M6 3v13a2 2 0 0 0 2 2h13" /><path d="M3 6h13a2 2 0 0 1 2 2v13" /></>,
  resize: <><path d="M4 9V4h5M20 15v5h-5" /><path d="M4 4l6 6M20 20l-6-6" /></>,
  sparkles: <><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" /><path d="M19 15l.8 1.7L21.5 17.5l-1.7.8L19 20l-.8-1.7-1.7-.8 1.7-.8L19 15z" /></>,
  'panel-right': <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M15 4v16" /></>,
  'panel-bottom': <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 15h18" /></>,
  film: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="M12 1v3M12 20v3M1 12h3M20 12h3" /></>,
  anchor: <><circle cx="12" cy="5" r="2.5" /><path d="M12 8v13M5 13H3a9 9 0 0 0 18 0h-2" /><path d="M8 13h8" /></>,
  box: <><path d="M4 7l8-4 8 4v10l-8 4-8-4V7z" /><path d="M4 7l8 4 8-4M12 11v10" /></>,
  'circle-dot': <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" /></>,
  code: <path d="M8 6l-6 6 6 6M16 6l6 6-6 6" />,
  book: <><path d="M4 4h7a3 3 0 0 1 3 3v14a3 3 0 0 0-3-3H4V4z" /><path d="M20 4h-3a3 3 0 0 0-3 3v14a3 3 0 0 1 3-3h3V4z" /></>,
  shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" /></>,
  database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6.1 8a7 7 0 0 1 11.5-1L20 12M4 12l2.4 5a7 7 0 0 0 11.5-1" /></>,
  external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M20 14v6H4V4h6" /></>,
  dots: <><circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  list: <><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" /></>,
  columns: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M12 4v16" /></>,
  rows: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 12h18" /></>,
  'free-transform': <><rect x="6" y="6" width="12" height="12" /><rect x="3" y="3" width="3" height="3" fill="currentColor" stroke="none" /><rect x="18" y="3" width="3" height="3" fill="currentColor" stroke="none" /><rect x="3" y="18" width="3" height="3" fill="currentColor" stroke="none" /><rect x="18" y="18" width="3" height="3" fill="currentColor" stroke="none" /></>,
  'align-left': <><path d="M3 4h18M3 9h10M3 14h18M3 19h10" /></>,
  'align-center': <><path d="M3 4h18M7 9h10M3 14h18M7 19h10" /></>,
  'align-right': <><path d="M3 4h18M11 9h10M3 14h18M11 19h10" /></>,
  'bring-forward': <><rect x="3" y="8" width="12" height="12" rx="1" /><path d="M9 3h12v12" /></>,
  'send-backward': <><rect x="9" y="3" width="12" height="12" rx="1" /><path d="M3 9v12h12" /></>,
  droplet: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />,
  swatch: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 16l8-8" /></>,
  'color-wheel': <><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 1 9 9h-9V3z" fill="currentColor" stroke="none" opacity=".4" /><path d="M12 12l6.4 6.4" /></>,
  'panel-left': <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></>,
  targetFrame: <><path d="M4 4h5v5H4zM15 4h5v5h-5zM4 15h5v5H4zM15 15h5v5h-5z" /><path d="M9 6.5h6M6.5 9v6M17.5 9v6M9 17.5h6" /></>,
  pauseCircle: <><circle cx="12" cy="12" r="9" /><path d="M10 8v8M14 8v8" /></>,
  playCircle: <><circle cx="12" cy="12" r="9" /><path d="M10 8l6 4-6 4V8z" fill="currentColor" stroke="none" /></>,
};

export function Icon({ name, size = 16, className = '', strokeWidth = 1.7, title = null }) {
  const content = P[name] || P.square;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`icon ${className}`.trim()}
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {content}
    </svg>
  );
}

/** Brand mark drawn as actual pixels so it stays crisp at any size. */
export function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <rect width="16" height="16" rx="3" fill="var(--logo-bg, #7c5cff)" />
      <path fill="#fff" d="M4 4h3v3H4zM9 4h3v3H9zM4 9h3v3H4zM9 9h3v3H9z" opacity=".95" />
      <path fill="#15151f" d="M9 9h3v3H9z" opacity=".45" />
    </svg>
  );
}

export default Icon;
