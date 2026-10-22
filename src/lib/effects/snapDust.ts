/**
 * SnapDust - Thanos Snap Particle Disintegration & Reconstitution Engine
 *
 * Mengubah elemen HTML apa pun menjadi partikel debu halus sinematik (Float32Array)
 * dengan gelombang pemecahan kiri-ke-kanan, hembusan angin, turbulensi acak,
 * efek suara debu (Web Audio API), dan animasi balik (restore).
 *
 * Dioptimalkan untuk tablet & layar HiDPI:
 * - Anti 8-bit: Menggunakan subpixel antialiasing, canvas DPR scaling, dan partikel sirkular (bukan kotak piksel)
 * - Durasi ringkas & responsif (~700ms)
 * - Sound effect desis debu halus sintetis tanpa file eksternal
 * - Hormati prefers-reduced-motion
 * - Tanpa memory leak
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
  radius: Float32Array;
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

/**
 * Memainkan efek suara desis debu halus (crumbling ash whoosh) sintetis
 * menggunakan Web Audio API murni tanpa perlu mengunduh file eksternal.
 */
function playDustSound(): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const duration = 0.52;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const channelData = buffer.getChannelData(0);

    // Sintesis noise debu lembut (pink/brown noise + sedikit butiran mikro)
    let lastNoise = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastNoise = (lastNoise + 0.06 * white) / 1.06;
      // Butiran mikro debu sesekali
      const microCrackle = Math.random() > 0.98 ? (Math.random() - 0.5) * 0.35 : 0;
      channelData[i] = lastNoise * 2.2 + microCrackle;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    // Filter bandpass menyapu turun (simulasi desau debu beterbangan ditiup angin)
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1600, ctx.currentTime);
    bandpass.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + duration);
    bandpass.Q.setValueAtTime(1.8, ctx.currentTime);

    // Envelope volume: attack cepat, decay eksponensial lembut
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    noiseSource.connect(bandpass);
    bandpass.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseSource.start();
    noiseSource.onended = () => {
      ctx.close().catch(() => {});
    };
  } catch {
    // Abaikan jika audio tidak diizinkan atau terblokir kebijakan browser
  }
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
        el.style.transition = 'opacity 250ms ease, filter 250ms ease';
        el.style.opacity = '0';
        el.style.filter = 'blur(4px)';
        setTimeout(() => {
          el.style.visibility = 'hidden';
          resolve();
        }, 250);
      });
    }

    // Durasi cepat & partikel halus non 8-bit
    const particleSize = opts?.particleSize ?? 1.8;
    const duration = opts?.duration ?? 720;
    const direction = opts?.direction ?? 'ltr';
    const wind = opts?.wind ?? { x: 1.3, y: -0.5 };

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      el.style.visibility = 'hidden';
      return;
    }

    // Mainkan sound effect debu halus secara instan
    playDustSound();

    const dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;

    // 1. Render elemen ke canvas resolusi tajam
    let sourceCanvas: HTMLCanvasElement;
    try {
      const html2canvas = await loadHtml2Canvas();
      sourceCanvas = await html2canvas(el, {
        backgroundColor: null,
        scale: dpr,
        logging: false,
        useCORS: true,
      });
    } catch {
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

    // 2. Sampling partikel halus non 8-bit (densitas tinggi, maksimal 22.000 partikel)
    const sampleStep = Math.max(1, Math.round(particleSize * dpr));
    const maxParticles = 22000;
    let pCount = 0;

    for (let y = 0; y < sHeight; y += sampleStep) {
      for (let x = 0; x < sWidth; x += sampleStep) {
        const idx = (y * sWidth + x) * 4;
        if (data[idx + 3] > 18) {
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
    const radius = new Float32Array(pCount);
    const vx = new Float32Array(pCount);
    const vy = new Float32Array(pCount);
    const delay = new Float32Array(pCount);
    const rArr = new Uint8Array(pCount);
    const gArr = new Uint8Array(pCount);
    const bArr = new Uint8Array(pCount);
    const aArr = new Float32Array(pCount);

    let i = 0;
    for (let y = 0; y < sHeight && i < pCount; y += sampleStep) {
      for (let x = 0; x < sWidth && i < pCount; x += sampleStep) {
        const idx = (y * sWidth + x) * 4;
        const alpha = data[idx + 3];
        if (alpha > 18) {
          // Konversi dari canvas scale kembali ke CSS logical pixels dengan sedikit random subpixel jitter
          const logicalX = (x / dpr) + (Math.random() - 0.5) * 0.8;
          const logicalY = (y / dpr) + (Math.random() - 0.5) * 0.8;

          startX[i] = logicalX;
          startY[i] = logicalY;
          currX[i] = logicalX;
          currY[i] = logicalY;
          // Radius bervariasi 0.7px s.d. 1.5px untuk tekstur debu halus alami (bukan balok 8-bit)
          radius[i] = (0.75 + Math.random() * 0.85);

          rArr[i] = data[idx];
          gArr[i] = data[idx + 1];
          bArr[i] = data[idx + 2];
          aArr[i] = alpha / 255;

          // Gelombang hancur cepat dari kiri ke kanan (atau sebaliknya)
          const normX = direction === 'ltr' ? (logicalX / rect.width) : (1 - logicalX / rect.width);
          // Penyebaran gelombang ringkas: 0 s.d. 0.32 durasi total
          delay[i] = Math.max(0, Math.min(0.35, normX * 0.28 + (Math.random() - 0.5) * 0.05));

          // Vektor hembusan angin + dispersi natural
          vx[i] = (wind.x * 0.9) + (Math.random() * 0.9 - 0.2);
          vy[i] = (wind.y * 0.9) - (Math.random() * 0.7);

          i++;
        }
      }
    }

    // 3. Tampilkan canvas overlay beresolusi tinggi (HiDPI) di atas elemen
    const overlayCanvas = document.createElement('canvas');
    const extraRight = Math.max(120, rect.width * 0.8);
    const extraTop = Math.max(80, rect.height * 0.8);
    const cWidth = rect.width + extraRight;
    const cHeight = rect.height + extraTop;

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

    // Simpan visibilitas asli dan sembunyikan elemen
    if (!originalVisibility.has(el)) {
      originalVisibility.set(el, el.style.visibility);
    }
    el.style.visibility = 'hidden';

    // 4. Animasi requestAnimationFrame
    const state: ParticleState = {
      count: i,
      startX,
      startY,
      currX,
      currY,
      radius,
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
            // Belum hancur: partikel diam di posisi awal (lingkaran anti-aliased halus)
            oCtx.fillStyle = `rgba(${state.r[p]},${state.g[p]},${state.b[p]},${state.a[p]})`;
            oCtx.beginPath();
            oCtx.arc(state.startX[p], state.startY[p] + extraTop, state.radius[p], 0, Math.PI * 2);
            oCtx.fill();
            activeCount++;
          } else {
            // Sedang berdebu: melayang cepat dengan turbulensi angin dan mengecil
            const localP = (globalP - pDelay) / (1 - pDelay);
            const pLife = Math.min(1, Math.max(0, localP));

            // Turbulensi halus dan hembusan angin
            const turbulenceX = Math.sin(pLife * 10 + p * 0.1) * 14 * pLife;
            const turbulenceY = Math.cos(pLife * 9 + p * 0.1) * 10 * pLife;

            const moveDist = pLife * 125;
            const px = state.startX[p] + state.vx[p] * moveDist + turbulenceX;
            const py = state.startY[p] + extraTop + state.vy[p] * moveDist + turbulenceY;

            // Memudar secara bertahap dan ukuran partikel mengecil
            const alpha = state.a[p] * Math.max(0, 1 - Math.pow(pLife, 1.3));
            if (alpha > 0.015) {
              state.currX[p] = px;
              state.currY[p] = py;
              oCtx.fillStyle = `rgba(${state.r[p]},${state.g[p]},${state.b[p]},${alpha})`;
              const r = Math.max(0.4, state.radius[p] * (1 - pLife * 0.45));
              oCtx.beginPath();
              oCtx.arc(px, py, r, 0, Math.PI * 2);
              oCtx.fill();
              activeCount++;
            }
          }
        }

        if (globalP < 1 && activeCount > 0) {
          state.animFrameId = requestAnimationFrame(renderFrame);
        } else {
          // Bersihkan canvas dan resolve Promise setelah selesai
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
   * Menyusun ulang debu kembali menjadi elemen utuh semula secara cepat
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

    if (pState.animFrameId) {
      cancelAnimationFrame(pState.animFrameId);
    }

    if (!pState.canvas.parentNode) {
      document.body.appendChild(pState.canvas);
    }

    const extraTop = Math.max(80, pState.rect.height * 0.8);
    const duration = 460;
    const startTime = performance.now();
    const cWidth = pState.canvas.width;
    const cHeight = pState.canvas.height;
    const oCtx = pState.ctx;

    const scatterX = new Float32Array(pState.currX);
    const scatterY = new Float32Array(pState.currY);

    return new Promise<void>((resolve) => {
      function renderRestore(now: number) {
        const elapsed = now - startTime;
        const p = Math.min(1, elapsed / duration);
        // Ease-out cubic
        const ease = 1 - Math.pow(1 - p, 3);

        oCtx.clearRect(0, 0, cWidth, cHeight);

        for (let i = 0; i < pState.count; i++) {
          const destX = pState.startX[i];
          const destY = pState.startY[i] + extraTop;

          const curX = scatterX[i] + (destX - scatterX[i]) * ease;
          const curY = scatterY[i] + (destY - scatterY[i]) * ease;

          const alpha = Math.min(pState.a[i], 0.2 + ease * 0.8 * pState.a[i]);
          oCtx.fillStyle = `rgba(${pState.r[i]},${pState.g[i]},${pState.b[i]},${alpha})`;
          oCtx.beginPath();
          oCtx.arc(curX, curY, pState.radius[i], 0, Math.PI * 2);
          oCtx.fill();
        }

        if (p < 1) {
          requestAnimationFrame(renderRestore);
        } else {
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
