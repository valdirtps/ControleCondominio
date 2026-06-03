export const safeSessionStorageGet = (key: string) => {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(key);
  } catch (e) {
    return null;
  }
};

export const safeSessionStorageSet = (key: string, value: string) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, value);
  } catch (e) {
    // Ignore
  }
};
