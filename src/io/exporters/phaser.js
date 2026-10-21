/**
 * Phaser 3 Texture Atlas Exporter
 * Produces standard Phaser 3 compatible JSON hash/array atlas format
 * and copy-pasteable JavaScript loader boilerplate.
 */

export function buildPhaserAtlas(sheetMeta, imageFileName, opts = {}) {
  const name = opts.baseName || sheetMeta.name || 'sprite';
  const tags = opts.tags || sheetMeta.tags || [];
  const frames = {};
  const animations = [];

  for (const item of sheetMeta.frames) {
    frames[item.name || `frame_${item.index}`] = {
      frame: { x: item.x, y: item.y, w: item.w, h: item.h },
      rotated: false,
      trimmed: !!item.trimmed,
      spriteSourceSize: {
        x: item.sourceX || 0,
        y: item.sourceY || 0,
        w: item.sourceW || item.w,
        h: item.sourceH || item.h,
      },
      sourceSize: {
        w: item.sourceW || item.w,
        h: item.sourceH || item.h,
      },
    };
  }

  if (tags && tags.length > 0) {
    for (const tag of tags) {
      animations.push({
        key: tag.name,
        frames: sheetMeta.frames
          .slice(tag.from, tag.to + 1)
          .map(f => ({ key: imageFileName, frame: f.name || `frame_${f.index}` })),
        frameRate: Math.round(1000 / Math.max(10, tag.duration || 100)),
        repeat: tag.repeat === 0 ? -1 : (tag.repeat || -1),
      });
    }
  }

  const jsonContent = JSON.stringify({
    textures: [
      {
        image: imageFileName,
        format: 'RGBA8888',
        size: { w: sheetMeta.width, h: sheetMeta.height },
        scale: sheetMeta.scale || 1,
        frames: Object.values(frames),
      }
    ],
    meta: {
      app: 'PixelForge',
      version: '1.0',
      image: imageFileName,
      format: 'RGBA8888',
      size: { w: sheetMeta.width, h: sheetMeta.height },
      scale: String(sheetMeta.scale || 1),
    },
    anims: animations,
  }, null, 2);

  const loaderSnippet = `// Phaser 3 Scene Preload Boilerplate:
this.load.atlas('${name}', '${imageFileName}', '${imageFileName.replace(/\.png$/i, '')}_phaser.json');

// Play animation:
// const player = this.add.sprite(100, 100, '${name}').play('${tags[0]?.name || 'idle'}');
`;

  return { jsonContent, loaderSnippet };
}

