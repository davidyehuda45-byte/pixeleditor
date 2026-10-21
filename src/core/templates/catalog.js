export const TEMPLATE_CATEGORIES = [
  { id: 'all', labelKey: 'template.cat.all' },
  { id: 'character', labelKey: 'template.cat.character', icon: 'user' },
  { id: 'building', labelKey: 'template.cat.building', icon: 'folder' },
  { id: 'weapon', labelKey: 'template.cat.weapon', icon: 'zap' },
  { id: 'item', labelKey: 'template.cat.item', icon: 'sparkles' },
  { id: 'tileset', labelKey: 'template.cat.tileset', icon: 'grid' },
  { id: 'fx', labelKey: 'template.cat.fx', icon: 'flame' },
  { id: 'ui', labelKey: 'template.cat.ui', icon: 'layout' },
];

export const GAME_TEMPLATES = [
  // --- 1. Karakter & Monster (14) ---
  { id: 'char-knight', cat: 'character', titleKey: 'template.charKnight.title', descKey: 'template.charKnight.desc', w: 32, h: 32, frames: 4 },
  { id: 'char-mage', cat: 'character', titleKey: 'template.charMage.title', descKey: 'template.charMage.desc', w: 32, h: 32, frames: 4 },
  { id: 'char-archer', cat: 'character', titleKey: 'template.charArcher.title', descKey: 'template.charArcher.desc', w: 32, h: 32, frames: 4 },
  { id: 'char-rogue', cat: 'character', titleKey: 'template.charRogue.title', descKey: 'template.charRogue.desc', w: 32, h: 32, frames: 4 },
  { id: 'char-paladin', cat: 'character', titleKey: 'template.charPaladin.title', descKey: 'template.charPaladin.desc', w: 32, h: 32, frames: 4 },
  { id: 'char-necromancer', cat: 'character', titleKey: 'template.charNecromancer.title', descKey: 'template.charNecromancer.desc', w: 32, h: 32, frames: 4 },
  { id: 'char-skeleton', cat: 'character', titleKey: 'template.charSkeleton.title', descKey: 'template.charSkeleton.desc', w: 32, h: 32, frames: 4 },
  { id: 'char-goblin', cat: 'character', titleKey: 'template.charGoblin.title', descKey: 'template.charGoblin.desc', w: 32, h: 32, frames: 4 },
  { id: 'char-orc', cat: 'character', titleKey: 'template.charOrc.title', descKey: 'template.charOrc.desc', w: 32, h: 32, frames: 4 },
  { id: 'char-dragon', cat: 'character', titleKey: 'template.charDragon.title', descKey: 'template.charDragon.desc', w: 48, h: 48, frames: 4 },
  { id: 'char-slime', cat: 'character', titleKey: 'template.charSlime.title', descKey: 'template.charSlime.desc', w: 16, h: 16, frames: 4 },
  { id: 'char-bat', cat: 'character', titleKey: 'template.charBat.title', descKey: 'template.charBat.desc', w: 16, h: 16, frames: 4 },
  { id: 'char-ghost', cat: 'character', titleKey: 'template.charGhost.title', descKey: 'template.charGhost.desc', w: 16, h: 16, frames: 4 },
  { id: 'char-mannequin', cat: 'character', titleKey: 'template.charMannequin.title', descKey: 'template.charMannequin.desc', w: 32, h: 32, frames: 4 },

  // --- 2. Bangunan & Struktur (10) ---
  { id: 'bldg-cottage', cat: 'building', titleKey: 'template.bldgCottage.title', descKey: 'template.bldgCottage.desc', w: 64, h: 64, frames: 1 },
  { id: 'bldg-tower', cat: 'building', titleKey: 'template.bldgTower.title', descKey: 'template.bldgTower.desc', w: 64, h: 64, frames: 2 },
  { id: 'bldg-blacksmith', cat: 'building', titleKey: 'template.bldgBlacksmith.title', descKey: 'template.bldgBlacksmith.desc', w: 64, h: 64, frames: 2 },
  { id: 'bldg-tavern', cat: 'building', titleKey: 'template.bldgTavern.title', descKey: 'template.bldgTavern.desc', w: 64, h: 64, frames: 2 },
  { id: 'bldg-wizard-tower', cat: 'building', titleKey: 'template.bldgWizardTower.title', descKey: 'template.bldgWizardTower.desc', w: 64, h: 64, frames: 4 },
  { id: 'bldg-windmill', cat: 'building', titleKey: 'template.bldgWindmill.title', descKey: 'template.bldgWindmill.desc', w: 64, h: 64, frames: 4 },
  { id: 'bldg-dungeon-gate', cat: 'building', titleKey: 'template.bldgDungeonGate.title', descKey: 'template.bldgDungeonGate.desc', w: 64, h: 64, frames: 2 },
  { id: 'bldg-shrine', cat: 'building', titleKey: 'template.bldgShrine.title', descKey: 'template.bldgShrine.desc', w: 48, h: 48, frames: 1 },
  { id: 'bldg-shop', cat: 'building', titleKey: 'template.bldgShop.title', descKey: 'template.bldgShop.desc', w: 48, h: 48, frames: 1 },
  { id: 'bldg-mine-entrance', cat: 'building', titleKey: 'template.bldgMineEntrance.title', descKey: 'template.bldgMineEntrance.desc', w: 48, h: 48, frames: 1 },

  // --- 3. Senjata & Peralatan (10) ---
  { id: 'wpn-swords', cat: 'weapon', titleKey: 'template.wpnSwords.title', descKey: 'template.wpnSwords.desc', w: 24, h: 24, frames: 6 },
  { id: 'wpn-ranged', cat: 'weapon', titleKey: 'template.wpnRanged.title', descKey: 'template.wpnRanged.desc', w: 24, h: 24, frames: 4 },
  { id: 'wpn-shields', cat: 'weapon', titleKey: 'template.wpnShields.title', descKey: 'template.wpnShields.desc', w: 24, h: 24, frames: 4 },
  { id: 'wpn-magic', cat: 'weapon', titleKey: 'template.wpnMagic.title', descKey: 'template.wpnMagic.desc', w: 24, h: 24, frames: 4 },
  { id: 'wpn-heavy', cat: 'weapon', titleKey: 'template.wpnHeavy.title', descKey: 'template.wpnHeavy.desc', w: 24, h: 24, frames: 4 },
  { id: 'wpn-polearms', cat: 'weapon', titleKey: 'template.wpnPolearms.title', descKey: 'template.wpnPolearms.desc', w: 32, h: 32, frames: 4 },
  { id: 'wpn-guns', cat: 'weapon', titleKey: 'template.wpnGuns.title', descKey: 'template.wpnGuns.desc', w: 24, h: 24, frames: 4 },
  { id: 'wpn-daggers', cat: 'weapon', titleKey: 'template.wpnDaggers.title', descKey: 'template.wpnDaggers.desc', w: 24, h: 24, frames: 4 },
  { id: 'wpn-scythes', cat: 'weapon', titleKey: 'template.wpnScythes.title', descKey: 'template.wpnScythes.desc', w: 32, h: 32, frames: 4 },
  { id: 'wpn-wands', cat: 'weapon', titleKey: 'template.wpnWands.title', descKey: 'template.wpnWands.desc', w: 24, h: 24, frames: 4 },

  // --- 4. Item & Loot RPG (10) ---
  { id: 'item-potions', cat: 'item', titleKey: 'template.itemPotions.title', descKey: 'template.itemPotions.desc', w: 16, h: 16, frames: 5 },
  { id: 'item-chests', cat: 'item', titleKey: 'template.itemChests.title', descKey: 'template.itemChests.desc', w: 16, h: 16, frames: 4 },
  { id: 'item-gems', cat: 'item', titleKey: 'template.itemGems.title', descKey: 'template.itemGems.desc', w: 16, h: 16, frames: 5 },
  { id: 'item-keys', cat: 'item', titleKey: 'template.itemKeys.title', descKey: 'template.itemKeys.desc', w: 16, h: 16, frames: 4 },
  { id: 'item-food', cat: 'item', titleKey: 'template.itemFood.title', descKey: 'template.itemFood.desc', w: 16, h: 16, frames: 4 },
  { id: 'item-scrolls', cat: 'item', titleKey: 'template.itemScrolls.title', descKey: 'template.itemScrolls.desc', w: 16, h: 16, frames: 3 },
  { id: 'item-coins', cat: 'item', titleKey: 'template.itemCoins.title', descKey: 'template.itemCoins.desc', w: 16, h: 16, frames: 4 },
  { id: 'item-rings', cat: 'item', titleKey: 'template.itemRings.title', descKey: 'template.itemRings.desc', w: 16, h: 16, frames: 3 },
  { id: 'item-books', cat: 'item', titleKey: 'template.itemBooks.title', descKey: 'template.itemBooks.desc', w: 16, h: 16, frames: 3 },
  { id: 'item-shields-armor', cat: 'item', titleKey: 'template.itemShieldsArmor.title', descKey: 'template.itemShieldsArmor.desc', w: 16, h: 16, frames: 4 },

  // --- 5. Tileset & Lingkungan (10) ---
  { id: 'tile-dungeon', cat: 'tileset', titleKey: 'template.tileDungeon.title', descKey: 'template.tileDungeon.desc', w: 64, h: 16, frames: 1 },
  { id: 'tile-overworld', cat: 'tileset', titleKey: 'template.tileOverworld.title', descKey: 'template.tileOverworld.desc', w: 64, h: 64, frames: 1 },
  { id: 'tile-water', cat: 'tileset', titleKey: 'template.tileWater.title', descKey: 'template.tileWater.desc', w: 32, h: 32, frames: 3 },
  { id: 'tile-desert', cat: 'tileset', titleKey: 'template.tileDesert.title', descKey: 'template.tileDesert.desc', w: 64, h: 64, frames: 1 },
  { id: 'tile-snow', cat: 'tileset', titleKey: 'template.tileSnow.title', descKey: 'template.tileSnow.desc', w: 64, h: 64, frames: 1 },
  { id: 'tile-scifi', cat: 'tileset', titleKey: 'template.tileScifi.title', descKey: 'template.tileScifi.desc', w: 64, h: 64, frames: 1 },
  { id: 'tile-lava', cat: 'tileset', titleKey: 'template.tileLava.title', descKey: 'template.tileLava.desc', w: 32, h: 32, frames: 3 },
  { id: 'tile-forest', cat: 'tileset', titleKey: 'template.tileForest.title', descKey: 'template.tileForest.desc', w: 64, h: 64, frames: 1 },
  { id: 'tile-castle', cat: 'tileset', titleKey: 'template.tileCastle.title', descKey: 'template.tileCastle.desc', w: 64, h: 64, frames: 1 },
  { id: 'tile-graveyard', cat: 'tileset', titleKey: 'template.tileGraveyard.title', descKey: 'template.tileGraveyard.desc', w: 64, h: 64, frames: 1 },

  // --- 6. Efek Visual / FX Animasi (8) ---
  { id: 'fx-explosion', cat: 'fx', titleKey: 'template.fxExplosion.title', descKey: 'template.fxExplosion.desc', w: 32, h: 32, frames: 6 },
  { id: 'fx-slash', cat: 'fx', titleKey: 'template.fxSlash.title', descKey: 'template.fxSlash.desc', w: 32, h: 32, frames: 4 },
  { id: 'fx-fireball', cat: 'fx', titleKey: 'template.fxFireball.title', descKey: 'template.fxFireball.desc', w: 32, h: 32, frames: 4 },
  { id: 'fx-lightning', cat: 'fx', titleKey: 'template.fxLightning.title', descKey: 'template.fxLightning.desc', w: 32, h: 32, frames: 4 },
  { id: 'fx-splash', cat: 'fx', titleKey: 'template.fxSplash.title', descKey: 'template.fxSplash.desc', w: 32, h: 32, frames: 4 },
  { id: 'fx-poison', cat: 'fx', titleKey: 'template.fxPoison.title', descKey: 'template.fxPoison.desc', w: 32, h: 32, frames: 4 },
  { id: 'fx-holy', cat: 'fx', titleKey: 'template.fxHoly.title', descKey: 'template.fxHoly.desc', w: 32, h: 32, frames: 4 },
  { id: 'fx-ice', cat: 'fx', titleKey: 'template.fxIce.title', descKey: 'template.fxIce.desc', w: 32, h: 32, frames: 4 },

  // --- 7. Antarmuka / UI Retro (8) ---
  { id: 'ui-dialog', cat: 'ui', titleKey: 'template.uiDialog.title', descKey: 'template.uiDialog.desc', w: 48, h: 48, frames: 1 },
  { id: 'ui-healthbar', cat: 'ui', titleKey: 'template.uiHealthbar.title', descKey: 'template.uiHealthbar.desc', w: 64, h: 16, frames: 2 },
  { id: 'ui-inventory', cat: 'ui', titleKey: 'template.uiInventory.title', descKey: 'template.uiInventory.desc', w: 24, h: 24, frames: 3 },
  { id: 'ui-buttons', cat: 'ui', titleKey: 'template.uiButtons.title', descKey: 'template.uiButtons.desc', w: 48, h: 20, frames: 3 },
  { id: 'ui-radar', cat: 'ui', titleKey: 'template.uiRadar.title', descKey: 'template.uiRadar.desc', w: 48, h: 48, frames: 1 },
  { id: 'ui-tooltip', cat: 'ui', titleKey: 'template.uiTooltip.title', descKey: 'template.uiTooltip.desc', w: 48, h: 32, frames: 1 },
  { id: 'ui-hearts', cat: 'ui', titleKey: 'template.uiHearts.title', descKey: 'template.uiHearts.desc', w: 48, h: 16, frames: 3 },
  { id: 'ui-xp-gauge', cat: 'ui', titleKey: 'template.uiXpGauge.title', descKey: 'template.uiXpGauge.desc', w: 64, h: 16, frames: 2 },
];

