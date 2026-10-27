import { useState, useEffect } from 'react';
import { DeviceInfo, getCurrentDevice } from './detect.ts';

export function useDevice(): DeviceInfo {
  const [device, setDevice] = useState<DeviceInfo>(getCurrentDevice);

  useEffect(() => {
    const handleResize = () => {
      setDevice(getCurrentDevice());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('popstate', handleResize);
    window.addEventListener('tk-device-change', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('popstate', handleResize);
      window.removeEventListener('tk-device-change', handleResize);
    };
  }, []);

  return device;
}
