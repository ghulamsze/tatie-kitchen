import React, { useEffect } from 'react';
import { useDevice } from '../lib/device/useDevice.ts';
import { registerDevice } from '../lib/device/deviceRegistration.ts';
import { DevFrame } from './DevFrame.tsx';
import { LaptopPlaceholder } from '../platform/laptop/LaptopPlaceholder.tsx';
import { PhonePlaceholder } from '../platform/phone/PhonePlaceholder.tsx';
import { ComponentGallery } from '../dev/ComponentGallery.tsx';
import { TabletRoot } from '../platform/tablet/TabletRoot.tsx';

export const AppShell: React.FC = () => {
  const device = useDevice();

  useEffect(() => {
    // Daftarkan perangkat saat pertama dibuka dan perbarui aktivitas
    registerDevice(device);
  }, [device]);

  // Masuk fullscreen otomatis saat pertama dibuka, keluar dengan Esc (browser handle sendiri)
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        // Browser menolak fullscreen (misal iframe) — abaikan
      }
    };
    // Fullscreen hanya bisa dipanggil setelah interaksi user, tunggu click/touch pertama
    const onFirstInteraction = () => {
      enterFullscreen();
      window.removeEventListener('click', onFirstInteraction);
      window.removeEventListener('touchstart', onFirstInteraction);
    };
    window.addEventListener('click', onFirstInteraction, { once: true });
    window.addEventListener('touchstart', onFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('click', onFirstInteraction);
      window.removeEventListener('touchstart', onFirstInteraction);
    };
  }, []);

  // Cek jika pengguna membuka rute galeri langsung
  const isGalleryRoute = typeof window !== 'undefined' && window.location.pathname === '/dev/gallery';

  if (isGalleryRoute) {
    return <ComponentGallery />;
  }

  // Pilih antarmuka berdasarkan formFactor
  if (device.formFactor === 'laptop') {
    return <LaptopPlaceholder device={device} />;
  }

  if (device.formFactor === 'phone') {
    return <PhonePlaceholder device={device} />;
  }

  // Tablet Kasir (di laptop akan otomatis dibungkus DevFrame 1024 x 640)
  return (
    <DevFrame device={device}>
      <TabletRoot />
    </DevFrame>
  );
};

export default AppShell;
