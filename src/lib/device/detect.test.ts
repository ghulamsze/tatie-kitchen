import { describe, it, expect } from 'vitest';
import { classifyDevice, DeviceEnv } from './detect.ts';

describe('Klasifikasi Perangkat (classifyDevice)', () => {
  const uaTable = [
    {
      name: 'iPhone 14 Safari',
      env: {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
        maxTouchPoints: 5,
        screenWidth: 390,
        screenHeight: 844,
      },
      expected: { platform: 'ios', formFactor: 'phone', source: 'user-agent', native: false },
    },
    {
      name: 'iPad Pro (UserAgent iPad klasik)',
      env: {
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1 Mobile/15E148 Safari/604.1',
        maxTouchPoints: 5,
        screenWidth: 1024,
        screenHeight: 768,
      },
      expected: { platform: 'ios', formFactor: 'tablet', source: 'user-agent', native: false },
    },
    {
      name: 'iPadOS modern (Macintosh dengan layar sentuh > 1 titik sentuh)',
      env: {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
        maxTouchPoints: 5,
        screenWidth: 1024,
        screenHeight: 640,
      },
      expected: { platform: 'ios', formFactor: 'tablet', source: 'user-agent', native: false },
    },
    {
      name: 'Macbook Laptop (Macintosh tanpa sentuhan)',
      env: {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        maxTouchPoints: 0,
        screenWidth: 1440,
        screenHeight: 900,
      },
      expected: { platform: 'mac', formFactor: 'laptop', source: 'user-agent', native: false },
    },
    {
      name: 'Android Phone (dengan kata Mobile)',
      env: {
        userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
        maxTouchPoints: 5,
        screenWidth: 393,
        screenHeight: 851,
      },
      expected: { platform: 'android', formFactor: 'phone', source: 'user-agent', native: false },
    },
    {
      name: 'Android Tablet (tanpa kata Mobile)',
      env: {
        userAgent: 'Mozilla/5.0 (Linux; Android 12; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
        maxTouchPoints: 5,
        screenWidth: 1280,
        screenHeight: 800,
      },
      expected: { platform: 'android', formFactor: 'tablet', source: 'user-agent', native: false },
    },
    {
      name: 'Android Phone resolusi tinggi tapi sisi terpendek >= 600px (penajam tablet)',
      env: {
        userAgent: 'Mozilla/5.0 (Linux; Android 12; Pixel Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
        maxTouchPoints: 5,
        screenWidth: 1600,
        screenHeight: 800,
      },
      expected: { platform: 'android', formFactor: 'tablet', source: 'user-agent', native: false },
    },
    {
      name: 'Windows NT (Laptop/PC)',
      env: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        maxTouchPoints: 0,
        screenWidth: 1920,
        screenHeight: 1080,
      },
      expected: { platform: 'windows', formFactor: 'laptop', source: 'user-agent', native: false },
    },
    {
      name: 'Linux Desktop (Ubuntu/X11)',
      env: {
        userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/114.0',
        maxTouchPoints: 0,
        screenWidth: 1920,
        screenHeight: 1080,
      },
      expected: { platform: 'linux', formFactor: 'laptop', source: 'user-agent', native: false },
    },
  ];

  uaTable.forEach(({ name, env, expected }) => {
    it(`harus mendeteksi: ${name}`, () => {
      const result = classifyDevice(env);
      expect(result).toEqual(expected);
    });
  });

  describe('Pengujian Override', () => {
    it('parameter ?device=tablet di laptop Windows harus mengesampingkan userAgent menjadi tablet', () => {
      const env: DeviceEnv = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114.0.0.0 Safari/537.36',
        urlSearch: '?device=tablet',
      };
      const result = classifyDevice(env);
      expect(result.formFactor).toBe('tablet');
      expect(result.source).toBe('override');
      expect(result.platform).toBe('windows');
    });

    it('storedOverride di localStorage harus mengesampingkan userAgent saat URL search kosong', () => {
      const env: DeviceEnv = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114.0.0.0 Safari/537.36',
        storedOverride: 'tablet',
      };
      const result = classifyDevice(env);
      expect(result.formFactor).toBe('tablet');
      expect(result.source).toBe('override');
    });

    it('parameter ?device=auto harus menghapus override dan kembali ke deteksi laptop', () => {
      const env: DeviceEnv = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114.0.0.0 Safari/537.36',
        storedOverride: 'tablet',
        urlSearch: '?device=auto',
      };
      const result = classifyDevice(env);
      expect(result.formFactor).toBe('laptop');
      expect(result.source).toBe('user-agent');
    });
  });

  describe('Capacitor Native', () => {
    it('harus mendeteksi platform native saat Capacitor aktif', () => {
      const env: DeviceEnv = {
        capacitor: { isNative: true, platform: 'android' },
        screenWidth: 1280,
        screenHeight: 800,
      };
      const result = classifyDevice(env);
      expect(result.platform).toBe('android');
      expect(result.formFactor).toBe('tablet');
      expect(result.native).toBe(true);
      expect(result.source).toBe('capacitor');
    });
  });
});
