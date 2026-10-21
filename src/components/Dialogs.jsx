import React from 'react';
import { useStore } from '../ui/hooks.jsx';
import {
  NewDialog, OpenDialog, RecoveryDialog, ExportDialog, WelcomeDialog, AboutDialog,
  UnsavedDialog, ImportDialog,
} from './dialogs/FileDialogs.jsx';
import { QuickGuideDialog } from './dialogs/QuickGuideDialog.jsx';
import { SettingsDialog, ShortcutsDialog } from './dialogs/SettingsDialogs.jsx';
import {
  RenameDialog, FrameDurationDialog, FpsDialog, TagsDialog, ResizeDialog, EffectsDialog,
  GridDialog, GuidesDialog, HistoryDialog, GrowSelectionDialog,
} from './dialogs/DocumentDialogs.jsx';
import { PaletteDialog, ExtractPaletteDialog, MetadataDialog } from './dialogs/PaletteDialogs.jsx';
import { TextDialog } from './dialogs/TextDialog.jsx';
import { BiomeDialog } from './dialogs/BiomeDialog.jsx';
import { PlaytestDialog } from './dialogs/PlaytestDialog.jsx';

/** Renders the single active modal. The store owns the dialog descriptor. */
export function DialogHost() {
  const store = useStore();
  const dialog = store.dialog;
  if (!dialog) return null;
  const close = () => store.setDialog(null);

  switch (dialog.type) {
    case 'new':
      return <NewDialog onClose={close} />;
    case 'open':
      return <OpenDialog onClose={close} />;
    case 'recovery':
      return <RecoveryDialog records={dialog.records || []} onClose={close} />;
    case 'export':
      return <ExportDialog onClose={close} />;
    case 'welcome':
      return <WelcomeDialog onClose={close} />;
    case 'guide':
      return <QuickGuideDialog onClose={close} />;
    case 'about':
      return <AboutDialog onClose={close} />;
    case 'unsaved':
      return <UnsavedDialog sessionId={dialog.sessionId} title={dialog.title} onClose={close} />;
    case 'importImage':
      return <ImportDialog onClose={close} />;
    case 'settings':
      return <SettingsDialog onClose={close} />;
    case 'shortcuts':
      return <ShortcutsDialog onClose={close} />;
    case 'renameDocument':
    case 'renameLayer':
      return <RenameDialog type={dialog.type} layerId={dialog.layerId} onClose={close} />;
    case 'frameDuration':
      return <FrameDurationDialog onClose={close} />;
    case 'fps':
      return <FpsDialog onClose={close} />;
    case 'tags':
      return <TagsDialog onClose={close} />;
    case 'resize':
      return <ResizeDialog onClose={close} />;
    case 'effects':
      return <EffectsDialog initial={dialog.initial} onClose={close} />;
    case 'grid':
      return <GridDialog onClose={close} />;
    case 'guides':
      return <GuidesDialog onClose={close} />;
    case 'history':
      return <HistoryDialog onClose={close} />;
    case 'growSelection':
      return <GrowSelectionDialog onClose={close} />;
    case 'palette':
      return <PaletteDialog onClose={close} />;
    case 'extractPalette':
      return <ExtractPaletteDialog onClose={close} />;
    case 'metadata':
      return <MetadataDialog onClose={close} />;
    case 'text':
      return <TextDialog x={dialog.x} y={dialog.y} layerId={dialog.layerId} onClose={close} />;
    case 'biome':
      return <BiomeDialog onClose={close} />;
    case 'playtest':
      return <PlaytestDialog onClose={close} />;
    default:
      return null;
  }
}
