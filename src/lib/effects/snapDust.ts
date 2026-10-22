/**
 * SnapDust - Thanos Snap Particle Disintegration & Reconstitution Engine
 *
 * Mengubah elemen HTML apa pun menjadi partikel debu halus (Float32Array)
 * dengan gelombang pemecahan kiri-ke-kanan, hembusan angin, turbulensi acak,
 * dan animasi balik (restore).
 *
 * Memenuhi spesifikasi:
 * - Particle size 3px (Float32Array, maksimal 20.000 partikel)
 * - Lewati piksel transparan
 * - Sembunyikan elemen asli, tampilkan canvas overlay
 * - Animasi requestAnimationFrame 60 fps
 * - Opsi: particleSize 3, duration 2200, direction "ltr", wind {x: 1.2, y: -0.6}
 * - Hormati prefers-reduced-motion (fallback fade)
 * - Tanpa memory leak (membersihkan canvas, rAF, WeakMap/Map)
 */

export interface SnapDustOptions {
  particleSize?: number;
  duration?: number;
  direction?: 'ltr' | 'rtl';
  wind?: { x: number; y: number };
}

interface ParticleState {
  count: number;
  startX: Float32Array;
  startY: Float32Array;
  currX: Float32Array;
  currY: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  delay: Float32Array;
  r: Uint8Array;
  g: Uint8Array;
  b: Uint8Array;
  a: Float32Array;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  rect: DOMRect;
  opts: Required<SnapDustOptions>;
  animFrameId?: number;
}

declare global {
  interface Window {
    html2canvas?: (element: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
  }
}

// Memuat html2canvas secara aman dari CDN atau window global
function loadHtml2Canvas(): Promise<(element: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>> {
  if (typeof window !== 'undefined' && window.html2canvas) {
    return Promise.resolve(window.html2canvas);
  }
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      return reject(new Error('HTML2Canvas requires DOM environment'));
    }
    const existing = document.querySelector('script[src*="html2canvas"]');
    if (existing) {
      if (window.html2canvas) return resolve(window.html2canvas);
      existing.addEventListener('load', () => {
        if (window.html2canvas) resolve(window.html2canvas);
        else reject(new Error('html2canvas failed to initialize'));
      });
      existing.addEventListener('error', (err) => reject(err));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (window.html2canvas) resolve(window.html2canvas);
      else reject(new Error('html2canvas loaded but window.html2canvas not found'));
    };
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}

const elementStates = new Map<HTMLElement, ParticleState>();
const originalVisibility = new Map<HTMLElement, string>();

export class SnapDust {
  /**
   * Menghancurkan elemen HTML menjadi partikel debu melayang (Thanos Snap)
   */
  static async disintegrate(el: HTMLElement, opts?: SnapDustOptions): Promise<void> {
    if (!el) return;

    // Hormati preferensi reduced-motion: fallback fade sederhana
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      return new Promise<void>((resolve) => {
        if (!originalVisibility.has(el)) {
          originalVisibility.set(el, el.style.visibility);
        }
        el.style.transition = 'opacity 300ms ease, filter 300ms ease';
        el.style.opacity = '0';
        el.style.filter = 'blur(4px)';
        setTimeout(() => {
          el.style.visibility = 'hidden';
          resolve();
        }, 300);
      });
    }

    const particleSize = opts?.particleSize ?? 3;
    const duration = opts?.duration ?? 2200;
    const direction = opts?.direction ?? 'ltr';
    const wind = opts?.wind ?? { x: 1.2, y: -0.6 };

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      el.style.visibility = 'hidden';
      return;
    }

    // 1. Render elemen ke canvas menggunakan html2canvas
    let sourceCanvas: HTMLCanvasElement;
    try {
      const html2canvas = await loadHtml2Canvas();
      sourceCanvas = await html2canvas(el, {
        backgroundColor: null,
        scale: 1,
        logging: false,
        useCORS: true,
      });
    } catch {
      // Fallback jika html2canvas tidak dapat dimuat: sembunyikan elemen secara halus
      el.style.visibility = 'hidden';
      return;
    }

    const sWidth = sourceCanvas.width;
    const sHeight = sourceCanvas.height;
    const sCtx = sourceCanvas.getContext('2d');
    if (!sCtx) {
      el.style.visibility = 'hidden';
      return;
    }

    const imgData = sCtx.getImageData(0, 0, sWidth, sHeight);
    const data = imgData.data;

    // 2. Pecah jadi partikel 3 px (Float32Array, maksimal 20.000), lewati piksel transparan
    const maxParticles = 20000;
    let pCount = 0;
    for (let y = 0; y < sHeight; y += particleSize) {
      for (let x = 0; x < sWidth; x += particleSize) {
        const idx = (y * sWidth + x) * 4;
        if (data[idx + 3] > 15) {
          pCount++;
          if (pCount >= maxParticles) break;
        }
      }
      if (pCount >= maxParticles) break;
    }

    if (pCount === 0) {
      el.style.visibility = 'hidden';
      return;
    }

    const startX = new Float32Array(pCount);
    const startY = new Float32Array(pCount);
    const currX = new Float32Array(pCount);
    const currY = new Float32Array(pCount);
    const vx = new Float32Array(pCount);
    const vy = new Float32Array(pCount);
    const delay = new Float32Array(pCount);
    const rArr = new Uint8Array(pCount);
    const gArr = new Uint8Array(pCount);
    const bArr = new Uint8Array(pCount);
    const aArr = new Float32Array(pCount);

    let i = 0;
    for (let y = 0; y < sHeight && i < pCount; y += particleSize) {
      for (let x = 0; x < sWidth && i < pCount; x += particleSize) {
        const idx = (y * sWidth + x) * 4;
        const alpha = data[idx + 3];
        if (alpha > 15) {
          startX[i] = x;
          startY[i] = y;
          currX[i] = x;
          currY[i] = y;
          rArr[i] = data[idx];
          gArr[i] = data[idx + 1];
          bArr[i] = data[idx + 2];
          aArr[i] = alpha / 255;

          // Gelombang pemecahan bergelombang dari kiri ke kanan (ltr) atau kanan ke kiri (rtl)
          const normX = direction === 'ltr' ? (x / sWidth) : (1 - x / sWidth);
          delay[i] = Math.max(0, Math.min(0.55, normX * 0.45 + (Math.random() - 0.5) * 0.08));

          // Arah angin + turbulensi acak
          vx[i] = (wind.x * 0.8) + (Math.random() * 0.8 - 0.2);
          vy[i] = (wind.y * 0.8) - (Math.random() * 0.6);

          i++;
        }
      }
    }

    // 3. Tampilkan canvas overlay di posisi persis elemen
    const overlayCanvas = document.createElement('canvas');
    const extraRight = Math.max(100, rect.width * 0.7);
    const extraTop = Math.max(100, rect.height * 0.7);
    const cWidth = rect.width + extraRight;
    const cHeight = rect.height + extraTop;

    overlayCanvas.width = cWidth;
    overlayCanvas.height = cHeight;
    overlayCanvas.style.position = 'fixed';
    overlayCanvas.style.left = `${rect.left}px`;
    overlayCanvas.style.top = `${rect.top - extraTop}px`;
    overlayCanvas.style.width = `${cWidth}px`;
    overlayCanvas.style.height = `${cHeight}px`;
    overlayCanvas.style.pointerEvents = 'none';
    overlayCanvas.style.zIndex = '9999';
    document.body.appendChild(overlayCanvas);

    const oCtx = overlayCanvas.getContext('2d')!;

    // Simpan visibilitas asli dan sembunyikan elemen
    if (!originalVisibility.has(el)) {
      originalVisibility.set(el, el.style.visibility);
    }
    el.style.visibility = 'hidden';

    // 4. Animasi requestAnimationFrame 60 fps
    const state: ParticleState = {
      count: i,
      startX,
      startY,
      currX,
      currY,
      vx,
      vy,
      delay,
      r: rArr,
      g: gArr,
      b: bArr,
      a: aArr,
      canvas: overlayCanvas,
      ctx: oCtx,
      rect,
      opts: { particleSize, duration, direction, wind },
    };
    elementStates.set(el, state);

    return new Promise<void>((resolve) => {
      const startTime = performance.now();

      function renderFrame(now: number) {
        const elapsed = now - startTime;
        const globalP = Math.min(1, elapsed / duration);

        oCtx.clearRect(0, 0, cWidth, cHeight);

        let activeCount = 0;
        for (let p = 0; p < state.count; p++) {
          const pDelay = state.delay[p];
          if (globalP < pDelay) {
            // Belum hancur: partikel diam di posisi awal
            oCtx.fillStyle = `rgba(${state.r[p]},${state.g[p]},${state.b[p]},${state.a[p]})`;
            oCtx.fillRect(state.startX[p], state.startY[p] + extraTop, particleSize, particleSize);
            activeCount++;
          } else {
            // Sedang berdebu: melayang ke kanan atas dengan turbulensi acak dan memudar
            const localP = (globalP - pDelay) / (1 - pDelay);
            const pLife = Math.min(1, Math.max(0, localP));

            const turbulenceX = Math.sin(pLife * 12 + p) * 16 * pLife;
            const turbulenceY = Math.cos(pLife * 10 + p) * 12 * pLife;

            const moveDist = pLife * 140;
            const px = state.startX[p] + state.vx[p] * moveDist + turbulenceX;
            const py = state.startY[p] + extraTop + state.vy[p] * moveDist + turbulenceY;

            const alpha = state.a[p] * Math.max(0, 1 - Math.pow(pLife, 1.4));
            if (alpha > 0.01) {
              state.currX[p] = px;
              state.currY[p] = py;
              oCtx.fillStyle = `rgba(${state.r[p]},${state.g[p]},${state.b[p]},${alpha})`;
              const sz = Math.max(1, particleSize * (1 - pLife * 0.3));
              oCtx.fillRect(px, py, sz, sz);
              activeCount++;
            }
          }
        }

        if (globalP < 1 && activeCount > 0) {
          state.animFrameId = requestAnimationFrame(renderFrame);
        } else {
          // 5. Bersihkan canvas dan resolve Promise setelah selesai
          if (overlayCanvas.parentNode) {
            overlayCanvas.parentNode.removeChild(overlayCanvas);
          }
          state.animFrameId = undefined;
          resolve();
        }
      }

      state.animFrameId = requestAnimationFrame(renderFrame);
    });
  }

  /**
   * Menyusun ulang debu kembali menjadi elemen utuh semula
   */
  static async restore(el: HTMLElement): Promise<void> {
    if (!el) return;

    // Fallback reduced motion
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      el.style.opacity = '1';
      el.style.filter = 'none';
      el.style.visibility = originalVisibility.get(el) || '';
      originalVisibility.delete(el);
      return;
    }

    const state = elementStates.get(el);
    if (!state) {
      el.style.visibility = originalVisibility.get(el) || '';
      el.style.opacity = '1';
      el.style.filter = 'none';
      originalVisibility.delete(el);
      return;
    }

    const pState = state;

    // Batalkan animasi disintegrasi yang sedang berlangsung jika ada
    if (pState.animFrameId) {
      cancelAnimationFrame(pState.animFrameId);
    }

    // Sambungkan kembali canvas jika sudah dilepas
    if (!pState.canvas.parentNode) {
      document.body.appendChild(pState.canvas);
    }

    const extraTop = Math.max(100, pState.rect.height * 0.7);
    const duration = 1100;
    const startTime = performance.now();
    const cWidth = pState.canvas.width;
    const cHeight = pState.canvas.height;
    const oCtx = pState.ctx;

    // Snapshot posisi partikel yang sedang berhamburan
    const scatterX = new Float32Array(pState.currX);
    const scatterY = new Float32Array(pState.currY);

    return new Promise<void>((resolve) => {
      function renderRestore(now: number) {
        const elapsed = now - startTime;
        const p = Math.min(1, elapsed / duration);
        // Ease-out cubic yang cepat di awal dan lembut di akhir
        const ease = 1 - Math.pow(1 - p, 3);

        oCtx.clearRect(0, 0, cWidth, cHeight);

        for (let i = 0; i < pState.count; i++) {
          const destX = pState.startX[i];
          const destY = pState.startY[i] + extraTop;

          const curX = scatterX[i] + (destX - scatterX[i]) * ease;
          const curY = scatterY[i] + (destY - scatterY[i]) * ease;

          const alpha = Math.min(pState.a[i], 0.2 + ease * 0.8 * pState.a[i]);
          oCtx.fillStyle = `rgba(${pState.r[i]},${pState.g[i]},${pState.b[i]},${alpha})`;
          oCtx.fillRect(curX, curY, pState.opts.particleSize, pState.opts.particleSize);
        }

        if (p < 1) {
          requestAnimationFrame(renderRestore);
        } else {
          // Bersihkan canvas dan kembalikan visibilitas elemen
          if (pState.canvas.parentNode) {
            pState.canvas.parentNode.removeChild(pState.canvas);
          }
          el.style.visibility = originalVisibility.get(el) || '';
          el.style.opacity = '1';
          el.style.filter = 'none';
          elementStates.delete(el);
          originalVisibility.delete(el);
          resolve();
        }
      }

      requestAnimationFrame(renderRestore);
    });
  }
}
