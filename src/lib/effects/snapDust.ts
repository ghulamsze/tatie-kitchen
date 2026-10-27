/**
 * SnapDust - Thanos Snap Particle Disintegration & Reconstitution Engine
 *
 * Mengubah elemen HTML apa pun menjadi desau debu abu halus sinematik
 * tanpa mengubah elemen menjadi piksel kotak (mencegah efek 8-bit / 32-bit).
 *
 * Cara Kerja Non-32-Bit:
 * 1. Elemen asli dipertahankan dalam resolusi vektor murni (tanpa dither piksel).
 * 2. Menggunakan CSS clipPath yang mengikis elemen secara dinamis dari kiri ke kanan.
 * 3. Di garis depan gelombang pengikisan, canvas overlay menghasilkan awan partikel debu halus
 *    organik yang melayang ke kanan atas dengan turbulensi angin alami.
 * 4. Efek suara desis debu sintetis (Web Audio API) dimainkan secara bersamaan.
 */

export interface SnapDustOptions {
  particleSize?: number;
  duration?: number;
  direction?: 'ltr' | 'rtl';
  wind?: { x: number; y: number };
  clipRect?: { top?: number; bottom?: number; left?: number; right?: number };
}

interface AshParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  decay: number;
  color: string;
  wobbleOffset: number;
}

interface ParticleState {
  particles: AshParticle[];
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  rect: DOMRect;
  opts: SnapDustOptions;
  animFrameId?: number;
}

/**
 * Memainkan efek suara desis debu halus sintetis (Web Audio API murni)
 */
function playDustSound(): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const duration = 0.45;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const channelData = buffer.getChannelData(0);

    let lastNoise = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastNoise = (lastNoise + 0.05 * white) / 1.05;
      const microCrackle = Math.random() > 0.985 ? (Math.random() - 0.5) * 0.3 : 0;
      channelData[i] = lastNoise * 2.0 + microCrackle;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1400, ctx.currentTime);
    bandpass.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + duration);
    bandpass.Q.setValueAtTime(1.9, ctx.currentTime);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.025);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    noiseSource.connect(bandpass);
    bandpass.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseSource.start();
    noiseSource.onended = () => {
      ctx.close().catch(() => {});
    };
  } catch {
    // Fail silently
  }
}

const elementStates = new Map<HTMLElement, ParticleState>();
const originalStyles = new Map<HTMLElement, { visibility: string; clipPath: string }>();

// Palet warna partikel abu alami bernuansa hangat Tati'e Kitchen
const ASH_COLORS = [
  'rgba(255, 255, 255, 0.95)',
  'rgba(255, 240, 225, 0.88)',
  'rgba(248, 113, 113, 0.85)',
  'rgba(251, 146, 60, 0.82)',
  'rgba(226, 232, 240, 0.75)',
  'rgba(203, 213, 225, 0.65)',
];

export class SnapDust {
  /**
   * Menghancurkan elemen HTML menjadi partikel debu halus sinematik (tanpa pixelated 32-bit)
   */
  static async disintegrate(el: HTMLElement, opts?: SnapDustOptions): Promise<void> {
    if (!el) return;

    // Hormati preferensi reduced-motion
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      return new Promise<void>((resolve) => {
        el.style.transition = 'opacity 200ms ease';
        el.style.opacity = '0';
        setTimeout(() => {
          el.style.visibility = 'hidden';
          resolve();
        }, 200);
      });
    }

    const duration = opts?.duration ?? 480;
    const direction = opts?.direction ?? 'ltr';
    const wind = opts?.wind ?? { x: 1.4, y: -0.5 };

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      el.style.visibility = 'hidden';
      return;
    }

    // Suara desau debu seketika
    playDustSound();

    const dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;

    // Simpan style asli
    if (!originalStyles.has(el)) {
      originalStyles.set(el, {
        visibility: el.style.visibility,
        clipPath: el.style.clipPath,
      });
    }

    // Canvas overlay untuk partikel debu
    const extraRight = Math.max(140, rect.width * 0.9);
    const extraTop = Math.max(70, rect.height * 0.8);
    const cWidth = rect.width + extraRight;
    const cHeight = rect.height + extraTop;

    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.width = cWidth * dpr;
    overlayCanvas.height = cHeight * dpr;
    overlayCanvas.style.position = 'fixed';
    overlayCanvas.style.left = `${rect.left}px`;
    overlayCanvas.style.top = `${rect.top - extraTop}px`;
    overlayCanvas.style.width = `${cWidth}px`;
    overlayCanvas.style.height = `${cHeight}px`;
    overlayCanvas.style.pointerEvents = 'none';
    overlayCanvas.style.zIndex = '9999';
    document.body.appendChild(overlayCanvas);

    const oCtx = overlayCanvas.getContext('2d')!;
    oCtx.scale(dpr, dpr);

    const particles: AshParticle[] = [];

    const state: ParticleState = {
      particles,
      canvas: overlayCanvas,
      ctx: oCtx,
      rect,
      opts: { particleSize: opts?.particleSize ?? 1.6, duration, direction, wind, clipRect: opts?.clipRect },
    };
    elementStates.set(el, state);

    return new Promise<void>((resolve) => {
      const startTime = performance.now();

      function render(now: number) {
        const elapsed = now - startTime;
        const p = Math.min(1, elapsed / duration);

        // 1. Kikis elemen asli dengan clipPath dinamis (teks tetap vektor murni & tajam)
        const wave = p * 118;
        const topCut = Math.min(100, Math.max(0, wave));
        const bottomCut = Math.min(100, Math.max(0, wave - 8));

        if (bottomCut >= 100 || p >= 0.88) {
          // Elemen selesai terkikis penuh tanpa menyisakan serpihan kanan (mencegah bug stuck)
          el.style.visibility = 'hidden';
          el.style.clipPath = direction === 'ltr'
            ? 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)'
            : 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)';
        } else if (direction === 'ltr') {
          // Menyusut dari kiri ke kanan dengan gelombang miring
          el.style.clipPath = `polygon(${topCut}% 0%, 100% 0%, 100% 100%, ${bottomCut}% 100%)`;
        } else {
          // Menyusut dari kanan ke kiri
          el.style.clipPath = `polygon(0% 0%, ${100 - topCut}% 0%, ${100 - bottomCut}% 100%, 0% 100%)`;
        }

        // 2. Lahirkan partikel debu baru di ujung garis pengikisan
        if (p < 0.90 && bottomCut < 100) {
          const edgeX = direction === 'ltr'
            ? (rect.width * (topCut / 100))
            : (rect.width * (1 - topCut / 100));

          // Batasi kelahiran partikel hanya dalam area elemen yang terlihat di dalam viewport clipRect
          const clipTop = opts?.clipRect?.top !== undefined ? Math.max(0, opts.clipRect.top - rect.top) : 0;
          const clipBottom = opts?.clipRect?.bottom !== undefined ? Math.min(rect.height, Math.max(0, opts.clipRect.bottom - rect.top)) : rect.height;
          const visibleHeight = Math.max(0, clipBottom - clipTop);

          if (visibleHeight > 0) {
            const particlesToSpawn = 18;
            for (let s = 0; s < particlesToSpawn; s++) {
              const spawnY = extraTop + clipTop + Math.random() * visibleHeight;
              const spawnX = edgeX + (Math.random() - 0.5) * 8;
              const colorIdx = Math.floor(Math.random() * ASH_COLORS.length);

              particles.push({
                x: spawnX,
                y: spawnY,
                vx: (wind.x * (0.9 + Math.random() * 1.5)),
                vy: (wind.y * (0.8 + Math.random() * 1.4)) + (Math.random() - 0.5) * 0.8,
                radius: 0.75 + Math.random() * 1.35,
                alpha: 0.95,
                decay: 0.024 + Math.random() * 0.02,
                color: ASH_COLORS[colorIdx],
                wobbleOffset: Math.random() * 100,
              });
            }
          }
        }

        // 3. Gambar dan perbarui partikel di canvas overlay
        oCtx.clearRect(0, 0, cWidth, cHeight);

        // Jika clipRect ditentukan (misal batas bawah kontainer scroll pesanan), terapkan clipping pada canvas
        // agar partikel debu tidak menindih kolom catatan atau tombol checkout di bawah kontainer
        const hasClip = Boolean(opts?.clipRect);
        if (hasClip && opts?.clipRect) {
          oCtx.save();
          const minClipY = opts.clipRect.top !== undefined ? Math.max(0, extraTop + (opts.clipRect.top - rect.top)) : 0;
          const maxClipY = opts.clipRect.bottom !== undefined ? Math.max(0, extraTop + (opts.clipRect.bottom - rect.top)) : cHeight;
          oCtx.beginPath();
          oCtx.rect(0, minClipY, cWidth, Math.max(0, maxClipY - minClipY));
          oCtx.clip();
        }

        for (let i = particles.length - 1; i >= 0; i--) {
          const pt = particles[i];
          pt.x += pt.vx;
          pt.y += pt.vy + Math.sin(now * 0.01 + pt.wobbleOffset) * 0.45;
          pt.alpha -= pt.decay;
          pt.radius = Math.max(0.3, pt.radius * 0.985);

          if (pt.alpha <= 0.02) {
            particles.splice(i, 1);
            continue;
          }

          oCtx.fillStyle = pt.color.replace(/[\d.]+\)$/, `${pt.alpha.toFixed(3)})`);
          oCtx.beginPath();
          oCtx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
          oCtx.fill();
        }

        if (hasClip) {
          oCtx.restore();
        }

        if (p < 1 || particles.length > 0) {
          state.animFrameId = requestAnimationFrame(render);
        } else {
          // Selesai: bersihkan
          el.style.visibility = 'hidden';
          el.style.clipPath = '';
          if (overlayCanvas.parentNode) {
            overlayCanvas.parentNode.removeChild(overlayCanvas);
          }
          state.animFrameId = undefined;
          resolve();
        }
      }

      state.animFrameId = requestAnimationFrame(render);
    });
  }

  /**
   * Menyusun ulang debu kembali menjadi elemen semula
   */
  static async restore(el: HTMLElement): Promise<void> {
    if (!el) return;

    const saved = originalStyles.get(el);
    el.style.visibility = saved?.visibility || '';
    el.style.clipPath = '';
    el.style.opacity = '1';

    const state = elementStates.get(el);
    if (state) {
      if (state.animFrameId) {
        cancelAnimationFrame(state.animFrameId);
      }
      if (state.canvas.parentNode) {
        state.canvas.parentNode.removeChild(state.canvas);
      }
      elementStates.delete(el);
    }
    originalStyles.delete(el);
  }
}
