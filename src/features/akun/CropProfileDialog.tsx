import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, Button } from '../../design/components/index.ts';

export interface CropProfileDialogProps {
  isOpen: boolean;
  imageSrc: string | null;
  title?: string;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => Promise<void> | void;
}

const VIEWPORT_SIZE = 240; // Ukuran kotak crop di layar (1:1)
const OUTPUT_SIZE = 512; // Resolusi tetap 512x512 px (hemat memori, ultra-tajam saat di-zoom/lightbox)

export const CropProfileDialog: React.FC<CropProfileDialogProps> = ({
  isOpen,
  imageSrc,
  title = 'Sesuaikan Foto Profil',
  onClose,
  onCropComplete,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  // Reset state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setIsProcessing(false);
    }
  }, [isOpen, imageSrc]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setNaturalSize({ width: naturalWidth, height: naturalHeight });
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Base scale agar foto menutup seluruh kotak crop 1:1 tanpa ruang kosong
  const baseScale = naturalSize
    ? Math.max(VIEWPORT_SIZE / naturalSize.width, VIEWPORT_SIZE / naturalSize.height)
    : 1;

  const currentDisplayWidth = naturalSize ? naturalSize.width * baseScale * zoom : VIEWPORT_SIZE;
  const currentDisplayHeight = naturalSize ? naturalSize.height * baseScale * zoom : VIEWPORT_SIZE;

  // Batas pan maksimal agar foto tidak keluar dari bingkai 1:1
  const maxPanX = Math.max(0, (currentDisplayWidth - VIEWPORT_SIZE) / 2);
  const maxPanY = Math.max(0, (currentDisplayHeight - VIEWPORT_SIZE) / 2);

  const clampPan = useCallback(
    (x: number, y: number) => {
      return {
        x: Math.max(-maxPanX, Math.min(maxPanX, x)),
        y: Math.max(-maxPanY, Math.min(maxPanY, y)),
      };
    },
    [maxPanX, maxPanY]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const nextPan = clampPan(panStartRef.current.x + dx, panStartRef.current.y + dy);
    setPan(nextPan);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.max(1, Math.min(3, newZoom));
    setZoom(clampedZoom);
    // Sesuaikan kembali pan jika zoom mengecil
    setPan((prev) => clampPan(prev.x, prev.y));
  };

  const handleApplyCrop = async () => {
    if (!imageSrc || !naturalSize) return;

    try {
      setIsProcessing(true);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;

      await new Promise<void>((resolve, reject) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = reject;
        }
      });

      // Hitung koordinat crop dari foto asli
      const totalScale = baseScale * zoom;
      const centerOffsetX = (VIEWPORT_SIZE - currentDisplayWidth) / 2 + pan.x;
      const centerOffsetY = (VIEWPORT_SIZE - currentDisplayHeight) / 2 + pan.y;

      const sx = Math.max(0, -centerOffsetX / totalScale);
      const sy = Math.max(0, -centerOffsetY / totalScale);
      const sWidth = Math.min(naturalSize.width - sx, VIEWPORT_SIZE / totalScale);
      const sHeight = Math.min(naturalSize.height - sy, VIEWPORT_SIZE / totalScale);

      // Render ke Canvas dengan resolusi tetap 512x512 px (1:1)
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Gagal menginisialisasi canvas');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            setIsProcessing(false);
            return;
          }
          try {
            await onCropComplete(blob);
            onClose();
          } finally {
            setIsProcessing(false);
          }
        },
        'image/jpeg',
        0.88 // Kualitas 88% menghasilkan file ~40-60 KB, sangat ringan dan tajam
      );
    } catch {
      setIsProcessing(false);
    }
  };

  const handleApplyCropRef = useRef(handleApplyCrop);
  handleApplyCropRef.current = handleApplyCrop;

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isProcessing) {
        e.preventDefault();
        e.stopPropagation();
        handleApplyCropRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isProcessing]);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={isProcessing ? undefined : onClose}
      title={title}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
        {/* Kotak Crop 1:1 (240x240 px) */}
        <div
          style={{
            width: `${VIEWPORT_SIZE}px`,
            height: `${VIEWPORT_SIZE}px`,
            borderRadius: 'var(--r-xl)',
            overflow: 'hidden',
            position: 'relative',
            background: '#090d16',
            border: '2px solid var(--accent)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
            cursor: 'grab',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onContextMenu={(e) => e.preventDefault()}
        >
          {imageSrc && (
            <img
              src={imageSrc}
              alt="Pratinjau Crop"
              onLoad={handleImageLoad}
              draggable={false}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: `${naturalSize ? naturalSize.width * baseScale : VIEWPORT_SIZE}px`,
                height: `${naturalSize ? naturalSize.height * baseScale : VIEWPORT_SIZE}px`,
                maxWidth: 'none',
                maxHeight: 'none',
                transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                pointerEvents: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
              }}
            />
          )}

          {/* Grid tipis panduan simetri 1:1 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              border: '1px dashed rgba(255, 255, 255, 0.25)',
              borderRadius: 'inherit',
            }}
          />
        </div>

        {/* Kontrol Zoom Foto */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            maxWidth: `${VIEWPORT_SIZE + 40}px`,
            padding: '4px 8px',
          }}
        >
          <button
            type="button"
            onClick={() => handleZoomChange(zoom - 0.2)}
            disabled={zoom <= 1}
            aria-label="Perkecil foto"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--ctl)',
              border: '1px solid var(--ctl-line)',
              color: 'var(--ink)',
              fontSize: '16px',
              fontWeight: 800,
              cursor: zoom <= 1 ? 'not-allowed' : 'pointer',
              display: 'grid',
              placeItems: 'center',
              opacity: zoom <= 1 ? 0.4 : 1,
            }}
          >
            -
          </button>

          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            style={{
              flex: 1,
              accentColor: 'var(--accent)',
              cursor: 'pointer',
            }}
            aria-label="Tingkat pembesaran foto"
          />

          <button
            type="button"
            onClick={() => handleZoomChange(zoom + 0.2)}
            disabled={zoom >= 3}
            aria-label="Perbesar foto"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--ctl)',
              border: '1px solid var(--ctl-line)',
              color: 'var(--ink)',
              fontSize: '16px',
              fontWeight: 800,
              cursor: zoom >= 3 ? 'not-allowed' : 'pointer',
              display: 'grid',
              placeItems: 'center',
              opacity: zoom >= 3 ? 0.4 : 1,
            }}
          >
            +
          </button>
        </div>

        {/* Tombol Aksi */}
        <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '4px' }}>
          <Button
            variant="flat"
            size="md"
            onClick={onClose}
            disabled={isProcessing}
            style={{ flex: 1, height: '44px' }}
          >
            Batal
          </Button>
          <Button
            variant="lime"
            size="md"
            onClick={handleApplyCrop}
            disabled={isProcessing}
            style={{ flex: 1, height: '44px' }}
          >
            {isProcessing ? 'Menyimpan...' : 'Gunakan Foto'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
