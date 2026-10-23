/**
 * Menghasilkan UUID v4 standar yang valid untuk id pesanan dan item pesanan
 */
export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback standar RFC4122 v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isValidUUID = (str: string): boolean => {
  return UUID_REGEX.test(str);
};

export const ensureUUID = (
  val?: string | null,
  fallback = '00000000-0000-0000-0000-000000000001'
): string => {
  if (val && isValidUUID(val)) return val;
  return fallback;
};

