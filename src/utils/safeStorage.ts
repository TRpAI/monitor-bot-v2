// In-memory fallback for environments where localStorage/sessionStorage is blocked (e.g. sandboxed iframes)
const memoryStorage = new Map<string, string>();

export const safeLocalStorage = {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memoryStorage.get(`local:${key}`) ?? null;
    }
  },
  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      memoryStorage.set(`local:${key}`, value);
    }
  },
  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      memoryStorage.delete(`local:${key}`);
    }
  },
};

export const safeSessionStorage = {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return memoryStorage.get(`session:${key}`) ?? null;
    }
  },
  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      memoryStorage.set(`session:${key}`, value);
    }
  },
  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      memoryStorage.delete(`session:${key}`);
    }
  },
};
