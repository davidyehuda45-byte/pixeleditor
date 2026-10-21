/**
 * PixelForge Game Dev Template Library.
 * 70 comprehensive, high-fidelity 2D game asset templates across 7 essential categories.
 * All templates are generated procedurally with separated layers, animation frames,
 * tags, collision boxes, and palette maps so game creators can immediately customize,
 * swap colors, and add details.
 */
import { PixelDocument } from './document.js';
import { TEMPLATE_CATEGORIES, GAME_TEMPLATES } from './templates/catalog.js';
import { createPalettes } from './templates/helpers.js';
import { buildCharacterTemplate } from './templates/characters.js';
import { buildBuildingTemplate } from './templates/buildings.js';
import { buildWeaponTemplate } from './templates/weapons.js';
import { buildItemTemplate } from './templates/items.js';
import { buildTilesetTemplate } from './templates/tilesets.js';
import { buildFxTemplate } from './templates/fx.js';
import { buildUiTemplate } from './templates/ui.js';

export { TEMPLATE_CATEGORIES, GAME_TEMPLATES };
export {
  buildCharacterTemplate,
  buildBuildingTemplate,
  buildWeaponTemplate,
  buildItemTemplate,
  buildTilesetTemplate,
  buildFxTemplate,
  buildUiTemplate,
};

/**
 * Procedural Document Builder.
 * Returns a fully live PixelDocument configured with multiple layers for easy editing.
 */
export function buildTemplate(templateId) {
  const meta = GAME_TEMPLATES.find((t) => t.id === templateId) || GAME_TEMPLATES[0];
  const doc = PixelDocument.create({
    width: meta.w,
    height: meta.h,
    title: meta.id.replace(/-/g, '_'),
    layerName: 'Base',
  });
  doc.palette = createPalettes(meta.cat === 'ui' ? 'Pico-8' : meta.cat === 'building' ? 'Endesga 32' : 'Sweetie 16');
  doc.grid = { x: 0, y: 0, w: meta.w <= 32 ? 8 : 16, h: meta.h <= 32 ? 8 : 16 };

  // Setup frames
  doc.frames[0].duration = 120;
  for (let i = 1; i < meta.frames; i++) {
    doc.addFrame({ duration: 120 });
  }

  // Generate content by category
  if (meta.cat === 'character') buildCharacterTemplate(doc, meta.id);
  else if (meta.cat === 'building') buildBuildingTemplate(doc, meta.id);
  else if (meta.cat === 'weapon') buildWeaponTemplate(doc, meta.id);
  else if (meta.cat === 'item') buildItemTemplate(doc, meta.id);
  else if (meta.cat === 'tileset') buildTilesetTemplate(doc, meta.id);
  else if (meta.cat === 'fx') buildFxTemplate(doc, meta.id);
  else if (meta.cat === 'ui') buildUiTemplate(doc, meta.id);

  doc.modified = new Date().toISOString();
  return doc;
}

/**
 * Load a template into the store as an active session in a new tab.
 */
export function loadGameTemplate(store, templateId) {
  const doc = buildTemplate(templateId);
  const session = store.createSession(doc, { fileName: `${doc.title}.pfx`, dirty: true });
  store.setUI({ tool: 'pencil', showTimeline: doc.frames.length > 1 });
  store.toast(
    store.ui.language === 'en' ? `Template "${doc.title}" loaded.` : `Templat "${doc.title}" berhasil dimuat.`,
    'success'
  );
  return session;
}
