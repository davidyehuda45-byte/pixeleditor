/**
 * Godot 4 SpriteFrames (.tres) generator. Format follows the official
 * SpriteFrames/AtlasTexture resource shape (format=3, load_steps).
 * Frame duration is relative; animation speed is FPS, per Godot's
 * absolute_duration = duration / (fps * playing_speed) formula.
 */

function sanitizeId(value, fallback = 'x') {
  return String(value).replace(/[^A-Za-z0-9_]/g, '_') || fallback;
}

function q(s) {
  return `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function tagSequence(tag, count) {
  const from = Math.max(0, Math.min(tag.from, count - 1));
  const to = Math.max(from, Math.min(tag.to, count - 1));
  let range = [];
  for (let i = from; i <= to; i++) range.push(i);
  if (tag.direction === 'reverse') range.reverse();
  if (tag.direction === 'pingpong') {
    range = [...range, ...range.slice(1, -1).reverse()];
  }
  return range;
}

/**
 * @param {object} sheet result of buildSpriteSheet
 * @param {import('../../core/document.js').PixelDocument} doc
 * @param {object} opts
 * @returns {string} .tres text
 */
export function buildGodotSpriteFrames(sheet, doc, opts = {}) {
  const {
    imagePath = 'res://hero.png',
    baseName = 'hero',
    frameTags = doc.tags,
    fps = null,
  } = opts;
  const frames = sheet.frames;
  if (!frames.length) throw new Error('Sprite sheet kosong.');
  const count = frames.length;
  const uniqueFrames = new Map();
  for (const frame of frames) {
    const target = frame.dedupedTo ?? frame.index;
    if (!uniqueFrames.has(target)) uniqueFrames.set(target, frames[frame.index]);
  }
  const sortedUnique = [...uniqueFrames.entries()].sort((a, b) => a[0] - b[0]);
  const subId = new Map();
  sortedUnique.forEach(([index], i) => subId.set(index, `AtlasTexture_${i + 1}`));

  const durations = frames.map((f) => Math.max(10, f.duration || 100));
  const avg = durations.reduce((s, d) => s + d, 0) / durations.length;
  const speed = fps || Math.max(0.01, 1000 / avg);

  const tags = (frameTags || []).filter((t) => t.from <= count - 1 && t.to >= 0);
  const animations = [];
  if (!tags.length) {
    animations.push({
      name: 'default',
      indices: [...Array(count).keys()],
      loop: true,
    });
  } else {
    for (const tag of tags) {
      const seq = tagSequence(tag, count);
      const repeat = Math.max(0, Math.min(20, tag.repeat || 0));
      let indices = seq;
      if (repeat > 1) indices = Array.from({ length: repeat }, () => seq).flat();
      animations.push({ name: tag.name, indices, loop: repeat <= 1, tag });
    }
  }

  const lines = [];
  lines.push(`[gd_resource type="SpriteFrames" load_steps=${sortedUnique.length + 2} format=3]`);
  lines.push('');
  lines.push(`[ext_resource type="Texture2D" path=${q(imagePath)} id="1_texture"]`);
  lines.push('');
  for (const [index, frame] of sortedUnique) {
    lines.push(`[sub_resource type="AtlasTexture" id="${subId.get(index)}"]`);
    lines.push(`atlas = ExtResource("1_texture")`);
    lines.push(`region = Rect2(${frame.x}, ${frame.y}, ${frame.w}, ${frame.h})`);
    lines.push('');
  }
  const animBlocks = animations.map((anim) => {
    const frameEntries = anim.indices.map((i) => {
      const sheetFrame = frames[i];
      const unique = sheetFrame.dedupedTo ?? sheetFrame.index;
      const duration = Math.max(0.01, durations[i] / avg);
      return `{\n"duration": ${Number(duration.toFixed(4))},\n"texture": SubResource(${q(subId.get(unique))})\n}`;
    });
    return `{
"frames": [${frameEntries.join(', ')}],
"loop": ${anim.loop ? 'true' : 'false'},
"name": &${q(anim.name)},
"speed": ${Number(speed.toFixed(4))}
}`;
  });
  lines.push('[resource]');
  lines.push(`animations = [${animBlocks.join(', ')}]`);
  lines.push('');
  return lines.join('\n');
}

/** Godot 4 TileSet resource from a tile atlas. */
export function buildGodotTileSet(tileSheet, opts = {}) {
  const { imagePath = 'res://tiles.png', tileWidth = 16, tileHeight = 16, columns = null } = opts;
  const cols = columns || Math.max(1, Math.floor(tileSheet.width / tileWidth));
  const rows = Math.max(1, Math.floor(tileSheet.height / tileHeight));
  const count = tileSheet.frames?.length || cols * rows;
  const subId = 'TileSetAtlasSource_1';
  return `[gd_resource type="TileSet" load_steps=3 format=3]

[ext_resource type="Texture2D" path=${q(imagePath)} id="1_texture"]

[sub_resource type="TileSetAtlasSource" id="${subId}"]
texture = ExtResource("1_texture")
texture_region_size = Vector2i(${tileWidth}, ${tileHeight})
${Array.from({ length: count }, (_, i) => `${i % cols}:${Math.floor(i / cols)}/0 = 0`).join('\n')}

[resource]
tile_size = Vector2i(${tileWidth}, ${tileHeight})
sources/0 = SubResource("${subId}")
`;
}
