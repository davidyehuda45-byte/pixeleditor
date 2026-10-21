/**
 * Aseprite-compatible JSON (array and hash variants).
 * Extra PixelForge metadata is namespaced under meta.pixelforge so other
 * tools can still parse the file.
 */

function frameNamesFor(sheet, baseName) {
  return sheet.frames.map((f, i) => `${baseName}_${String(i).padStart(3, '0')}`);
}

function slicesFor(doc) {
  if (!doc.slices?.length) return [];
  return doc.slices.map((slice) => ({
    name: slice.name,
    color: slice.color || '#7c6cf5',
    keys: (slice.frames || []).map((k) => ({
      frame: k.frame,
      bounds: Array.isArray(k.rect)
        ? { x: k.rect[0], y: k.rect[1], w: k.rect[2], h: k.rect[3] }
        : k.rect,
      center: k.center
        ? (Array.isArray(k.center) ? { x: k.center[0], y: k.center[1], w: k.center[2], h: k.center[3] } : k.center)
        : null,
      pivot: k.pivot ? { x: k.pivot[0], y: k.pivot[1] } : { x: 0.5, y: 1 },
    })),
  }));
}

export function buildAsepriteJSON(sheet, doc, opts = {}) {
  const {
    imageName = 'sprite.png',
    baseName = 'frame',
    variant = 'array',
    scale = 1,
    frameTags = doc.tags,
    includePixelforge = true,
  } = opts;
  const names = frameNamesFor(sheet, baseName);
  const meta = {
    app: 'PixelForge',
    version: '1.0.0',
    image: imageName,
    format: 'RGBA8888',
    size: { w: sheet.width, h: sheet.height },
    scale: String(scale),
    frameTags: (frameTags || []).map((tag) => ({
      name: tag.name,
      from: tag.from,
      to: tag.to,
      direction: tag.direction || 'forward',
      repeat: tag.repeat ?? 0,
      color: tag.color || '#7c6cf5',
      data: tag.userData || '',
    })),
    layers: doc.layers.map((l) => ({
      name: l.name,
      opacity: l.opacity,
      blendMode: l.blend,
      group: l.type === 'group' ? l.name : undefined,
    })),
    slices: slicesFor(doc),
  };
  if (includePixelforge) {
    meta.pixelforge = {
      hitboxes: doc.hitboxes || [],
      anchors: doc.anchors || [],
      pivots: doc.frames.map((f) => ({ frame: f.id, pivot: f.userData?.pivot || null })),
      userData: doc.userData || null,
      tags: doc.tags,
    };
  }

  const frameRecords = sheet.frames.map((frame, i) => {
    const rec = {
      filename: `${names[i]}.png`,
      frame: { x: frame.x, y: frame.y, w: frame.w, h: frame.h },
      rotated: false,
      trimmed: !!frame.trimmed,
      spriteSourceSize: {
        x: frame.trimX,
        y: frame.trimY,
        w: frame.w,
        h: frame.h,
      },
      sourceSize: { w: frame.sourceWidth, h: frame.sourceHeight },
      duration: frame.duration,
    };
    if (frame.dedupedTo !== null) rec.dedupedTo = frame.dedupedTo;
    return rec;
  });

  if (variant === 'hash') {
    const frames = {};
    for (let i = 0; i < frameRecords.length; i++) {
      frames[frameRecords[i].filename] = { ...frameRecords[i], filename: undefined };
    }
    return { frames, meta };
  }
  return { frames: frameRecords, meta };
}

export function buildTexturePackerJSON(sheet, doc, opts = {}) {
  const {
    imageName = 'sprite.png', baseName = 'frame', scale = 1, frameTags = doc.tags,
  } = opts;
  const names = frameNamesFor(sheet, baseName);
  const frames = {};
  const animations = {};
  sheet.frames.forEach((frame, i) => {
    frames[names[i]] = {
      frame: { x: frame.x, y: frame.y, w: frame.w, h: frame.h },
      rotated: false,
      trimmed: !!frame.trimmed,
      spriteSourceSize: { x: frame.trimX, y: frame.trimY, w: frame.w, h: frame.h },
      sourceSize: { w: frame.sourceWidth, h: frame.sourceHeight },
    };
  });
  for (const tag of frameTags || []) {
    animations[tag.name] = [];
    for (let i = tag.from; i <= tag.to; i++) if (names[i]) animations[tag.name].push(names[i]);
  }
  return {
    frames,
    animations,
    meta: {
      app: 'PixelForge',
      version: '1.0.0',
      image: imageName,
      format: 'RGBA8888',
      size: { w: sheet.width, h: sheet.height },
      scale: String(scale),
      frameTags: (frameTags || []).map((t) => ({ name: t.name, from: t.from, to: t.to, direction: t.direction || 'forward' })),
      slices: slicesFor(doc),
      pixelforge: { hitboxes: doc.hitboxes || [], anchors: doc.anchors || [] },
    },
  };
}

/** Unity slicing JSON (import with the included editor guide). */
export function buildUnitySlices(sheet, doc, opts = {}) {
  const { imageName = 'sprite.png', ppu = 16, baseName = 'frame' } = opts;
  const sprites = sheet.frames.map((f, i) => {
    const slice = doc.slices?.[0];
    const border = slice?.frames?.find((k) => k.frame === i)?.center;
    const b = Array.isArray(border) ? border : null;
    return {
      name: `${baseName}_${i}`,
      rect: { x: f.x, y: doc.height - (f.y + f.h), width: f.w, height: f.h },
      pivot: { x: 0.5, y: 0 },
      pixelsPerUnit: ppu,
      border: b ? { left: b[0], bottom: b[3], right: b[2], top: b[1] } : { left: 0, bottom: 0, right: 0, top: 0 },
      alignment: 'Custom',
    };
  });
  return {
    texture: imageName,
    filterMode: 'Point',
    compression: 'None',
    pixelsPerUnit: ppu,
    alphaIsTransparency: true,
    sprites,
    note: 'Gunakan docs/UNITY.md untuk menerapkan data ini ke importer Unity.',
  };
}
