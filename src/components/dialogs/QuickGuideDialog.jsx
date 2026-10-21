import React, { useState } from 'react';
import { useStore, useI18n } from '../../ui/hooks.jsx';
import { Modal, DialogTabs, DialogSection, InfoNote } from './Modal.jsx';
import { Button } from '../../ui/controls.jsx';
import { Icon } from '../Icon.jsx';

export function QuickGuideDialog({ onClose }) {
  const store = useStore();
  const { t } = useI18n();
  const [tab, setTab] = useState('basics');

  const tabs = [
    { value: 'basics', label: t('guide.tab.basics'), icon: 'pencil' },
    { value: 'layers', label: t('guide.tab.layers'), icon: 'layers' },
    { value: 'animation', label: t('guide.tab.animation'), icon: 'play' },
    { value: 'export', label: t('guide.tab.export'), icon: 'folder-open' },
  ];

  return (
    <Modal
      title={t('guide.title')}
      subtitle={t('guide.subtitle')}
      icon="sparkles"
      onClose={onClose}
      size="lg"
      className="quick-guide-modal"
      footer={(
        <>
          <Button variant="ghost" onClick={() => store.setDialog({ type: 'welcome' })} icon="onboarding">
            {t('welcome.example')}
          </Button>
          <span className="modal-footer-spacer" />
          <Button variant="primary" onClick={onClose} icon="check">
            {t('common.close')}
          </Button>
        </>
      )}
    >
      <DialogTabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === 'basics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 10 }}>
          <InfoNote icon="pencil" tone="info">
            <strong>Pixel art adalah seni menggambar tiap piksel secara sadar dan presisi.</strong> Di PixelForge, semua garis tetap tajam tanpa blur atau anti-aliasing.
          </InfoNote>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 8, background: 'var(--bg-2)' }}>
              <h4 style={{ margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <Icon name="pencil" size={16} /> 1. Pensil & Penghapus
              </h4>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', lineHeight: 1.45 }}>
                Tekan <code>P</code> untuk Pensil dan <code>E</code> untuk Penghapus. Tahan tombol <code>Shift</code> sambil menggeser mouse untuk membuat garis lurus instan.
              </p>
            </div>
            <div style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 8, background: 'var(--bg-2)' }}>
              <h4 style={{ margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <Icon name="palette" size={16} /> 2. Warna Primer & Sekunder
              </h4>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', lineHeight: 1.45 }}>
                Klik kiri di kanvas menggunakan warna primer (atas), dan klik kanan menggunakan warna sekunder (bawah). Tekan <code>X</code> untuk menukar kedua warna dengan cepat.
              </p>
            </div>
            <div style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 8, background: 'var(--bg-2)' }}>
              <h4 style={{ margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <Icon name="zoom" size={16} /> 3. Zoom & Menggeser Kanvas
              </h4>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', lineHeight: 1.45 }}>
                Putar roda scroll mouse untuk memperbesar/memperkecil kanvas berpusat pada kursor. Tahan tombol <code>Spasi</code> atau tombol tengah mouse untuk menggeser (*pan*) kanvas.
              </p>
            </div>
            <div style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 8, background: 'var(--bg-2)' }}>
              <h4 style={{ margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <Icon name="wand" size={16} /> 4. Seleksi & Transformasi
              </h4>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', lineHeight: 1.45 }}>
                Gunakan Marquee (<code>M</code>) atau Tongkat Ajaib untuk memilih area. Tekan panah keyboard untuk menggeser piksel seleksi 1px demi 1px.
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === 'layers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 10 }}>
          <InfoNote icon="layers" tone="info">
            <strong>Layer bekerja seperti tumpukan lembaran plastik transparan.</strong> Anda dapat menggambar tubuh karakter di layer bawah, dan senjata/baju di layer atas tanpa merusak gambar di bawahnya.
          </InfoNote>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
            <div style={{ padding: 10, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 6 }}>
              <strong style={{ color: 'var(--text)' }}>• Visibilitas (Ikon Mata):</strong> Menyembunyikan sementara layer tertentu agar Anda dapat fokus menggambar detail lainnya.
            </div>
            <div style={{ padding: 10, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 6 }}>
              <strong style={{ color: 'var(--text)' }}>• Kunci Alpha (Lock Alpha):</strong> Hanya mengubah piksel yang sudah terisi warna, mencegah warna keluar dari garis outline yang sudah dibuat.
            </div>
            <div style={{ padding: 10, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 6 }}>
              <strong style={{ color: 'var(--text)' }}>• Layer Referensi:</strong> Gambar panduan sketsa atau referensi yang Anda jiplak tidak akan ikut diekspor ke dalam sprite sheet game.
            </div>
          </div>
        </div>
      )}

      {tab === 'animation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 10 }}>
          <InfoNote icon="play" tone="info">
            <strong>Animasi di PixelForge dibuat dengan menyusun frame berurutan di timeline bawah.</strong>
          </InfoNote>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 8, background: 'var(--bg-2)' }}>
              <h4 style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--text)' }}>• Tambah & Gandakan Frame</h4>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', lineHeight: 1.45 }}>
                Gunakan tombol <code>+</code> di panel timeline untuk membuat frame kosong, atau tombol duplikat untuk melanjutkan goresan dari frame sebelumnya.
              </p>
            </div>
            <div style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 8, background: 'var(--bg-2)' }}>
              <h4 style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--text)' }}>• Onion Skinning</h4>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', lineHeight: 1.45 }}>
                Aktifkan tombol <em>Onion skin</em> untuk melihat bayangan merah (frame sebelumnya) dan biru (frame sesudahnya) sehingga gerakan transisi lebih halus.
              </p>
            </div>
            <div style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 8, background: 'var(--bg-2)' }}>
              <h4 style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--text)' }}>• Putar Animasi</h4>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', lineHeight: 1.45 }}>
                Tekan <code>Enter</code> untuk memutar atau menjeda animasi langsung di kanvas. Anda juga dapat melihat pratinjau bergerak di panel kanan.
              </p>
            </div>
            <div style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 8, background: 'var(--bg-2)' }}>
              <h4 style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--text)' }}>• Cel Terhubung (Linked Cel)</h4>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', lineHeight: 1.45 }}>
                Tahan <code>Alt</code> lalu klik cel untuk menghubungkannya. Mengubah gambar di satu frame akan otomatis mengubah cel yang terhubung di frame lainnya!
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === 'export' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 10 }}>
          <InfoNote icon="download" tone="info">
            <strong>Tekan <code>Ctrl+E</code> untuk membuka dialog ekspor yang siap pakai untuk game engine.</strong>
          </InfoNote>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
            <div style={{ padding: 10, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 6 }}>
              <strong style={{ color: 'var(--text)' }}>• Godot 4.x (.tres + Sheet):</strong> Menghasilkan sprite sheet PNG bersama resource <code>SpriteFrames</code> Godot yang langsung bisa diseret ke node <code>AnimatedSprite2D</code>.
            </div>
            <div style={{ padding: 10, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 6 }}>
              <strong style={{ color: 'var(--text)' }}>• Unity (Sprite Sheet + JSON):</strong> Menghasilkan metadata slicing dan 9-slice border untuk UI panel.
            </div>
            <div style={{ padding: 10, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 6 }}>
              <strong style={{ color: 'var(--text)' }}>• Ekspor GIF Animasi:</strong> Simpan animasi berulang yang dapat langsung dibagikan ke media sosial.
            </div>
            <div style={{ padding: 10, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 6 }}>
              <strong style={{ color: 'var(--text)' }}>• Simpan Proyek (.pfx):</strong> Tekan <code>Ctrl+S</code> untuk menyimpan berkas master proyek yang menyimpan seluruh layer, frame, dan palet utuh tanpa kompresi rusak.
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
