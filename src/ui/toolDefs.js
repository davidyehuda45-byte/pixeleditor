/**
 * UI-only tool metadata. Rendering and hot keys read from here so a tool can
 * be added in one place without touching the engine switch more than once.
 */
export const TOOL_GROUPS = [
  {
    id: 'paint',
    labelKey: 'tool.group.paint',
    tools: [
      { id: 'pencil', labelKey: 'tool.pencil', icon: 'pencil', shortcut: 'P' },
      { id: 'brush', labelKey: 'tool.brush', icon: 'brush', shortcut: 'B' },
      { id: 'eraser', labelKey: 'tool.eraser', icon: 'eraser', shortcut: 'E' },
      { id: 'picker', labelKey: 'tool.picker', icon: 'eyedropper', shortcut: 'I' },
      { id: 'fill', labelKey: 'tool.fill', icon: 'bucket', shortcut: 'G' },
      { id: 'gradient', labelKey: 'tool.gradient', icon: 'gradient', shortcut: 'Shift+G' },
      { id: 'shade', labelKey: 'tool.shade', icon: 'shade', shortcut: 'S' },
      { id: 'spray', labelKey: 'tool.spray', icon: 'spray', shortcut: 'Shift+S' },
    ],
  },
  {
    id: 'shape',
    labelKey: 'tool.group.shape',
    tools: [
      { id: 'line', labelKey: 'tool.line', icon: 'line', shortcut: 'L' },
      { id: 'rect', labelKey: 'tool.rect', icon: 'square', shortcut: 'R' },
      { id: 'rounded-rect', labelKey: 'tool.roundedRect', icon: 'rounded-square', shortcut: null },
      { id: 'ellipse', labelKey: 'tool.ellipse', icon: 'circle', shortcut: 'O' },
      { id: 'polygon', labelKey: 'tool.polygon', icon: 'polygon', shortcut: 'Y' },
      { id: 'curve', labelKey: 'tool.curve', icon: 'curve', shortcut: 'U' },
      { id: 'text', labelKey: 'tool.text', icon: 'type', shortcut: 'T' },
    ],
  },
  {
    id: 'select',
    labelKey: 'tool.group.select',
    tools: [
      { id: 'select-rect', labelKey: 'tool.selectRect', icon: 'marquee', shortcut: 'M' },
      { id: 'select-ellipse', labelKey: 'tool.selectEllipse', icon: 'ellipse-select', shortcut: 'Shift+M' },
      { id: 'lasso', labelKey: 'tool.lasso', icon: 'lasso', shortcut: 'Q' },
      { id: 'polygon-lasso', labelKey: 'tool.polygonLasso', icon: 'polygon-lasso', shortcut: null },
      { id: 'wand', labelKey: 'tool.wand', icon: 'wand', shortcut: 'W' },
    ],
  },
  {
    id: 'navigate',
    labelKey: 'tool.group.view',
    tools: [
      { id: 'move', labelKey: 'tool.move', icon: 'move', shortcut: 'V' },
      { id: 'hand', labelKey: 'tool.hand', icon: 'hand', shortcut: 'H' },
      { id: 'zoom', labelKey: 'tool.zoom', icon: 'zoom', shortcut: 'Z' },
    ],
  },
];

export const ALL_TOOLS = TOOL_GROUPS.flatMap((group) => group.tools);
export const TOOL_BY_ID = Object.fromEntries(ALL_TOOLS.map((tool) => [tool.id, tool]));

export const DRAW_TOOLS = new Set(['pencil', 'brush', 'eraser', 'spray', 'shade']);
export const SHAPE_TOOLS = new Set(['line', 'rect', 'rounded-rect', 'ellipse', 'polygon', 'curve']);
export const SELECTION_TOOLS = new Set(['select-rect', 'select-ellipse', 'lasso', 'polygon-lasso', 'wand']);
export const FREEHAND_TOOLS = new Set([...DRAW_TOOLS]);

export function toolLabelKey(id) {
  return TOOL_BY_ID[id]?.labelKey || 'tool.pencil';
}

export function toolShortcut(id) {
  return TOOL_BY_ID[id]?.shortcut || null;
}
