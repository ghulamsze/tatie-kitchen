import React, { useEffect } from 'react';
import { useDevice } from '../lib/device/useDevice.ts';
import { registerDevice } from '../lib/device/deviceRegistration.ts';
import { DevFrame } from './DevFrame.tsx';
import { PhoneDevFrame } from './PhoneDevFrame.tsx';
import { PhoneRoot } from '../platform/phone/PhoneRoot.tsx';
import { ComponentGallery } from '../dev/ComponentGallery.tsx';
import { TabletRoot } from '../platform/tablet/TabletRoot.tsx';
import { useHistoryStore } from '../stores/historyStore.ts';
import { WebDevControls } from './WebDevControls.tsx';

export const AppShell: React.FC = () => {
  const device = useDevice();

  useEffect(() => {
    // Daftarkan perangkat saat pertama dibuka dan perbarui aktivitas
    registerDevice(device);
    // Bersihkan selectedOrder dari riwayat saat berganti device agar tidak bocor antar tampilan
    useHistoryStore.getState().setSelectedOrder(null);
  }, [device]);

  // Cek jika pengguna membuka rute galeri langsung
  const isGalleryRoute = typeof window !== 'undefined' && window.location.pathname === '/dev/gallery';

  if (isGalleryRoute) {
    return <ComponentGallery />;
  }

  return (
    <>
      {device.formFactor === 'phone' ? (
        <PhoneDevFrame device={device}>
          <PhoneRoot />
        </PhoneDevFrame>
      ) : (
        <DevFrame device={device}>
          <TabletRoot />
        </DevFrame>
      )}
      {!device.native && <WebDevControls currentMode={device.formFactor} />}
    </>
  );
};

export default AppShell;
