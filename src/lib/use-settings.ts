'use client';

import { useEffect, useState } from 'react';

export interface AppSettings {
  orgName: string;
  appName: string;
  currencyLocale: string;
  showToastOnSubmit: boolean;
  confirmBeforeDelete: boolean;
}

const DEFAULTS: AppSettings = {
  orgName: 'Hotel Management',
  appName: 'ODC Manager',
  currencyLocale: 'en-IN',
  showToastOnSubmit: true,
  confirmBeforeDelete: true,
};

const KEY = 'odc-app-settings';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      // ignore parse errors
    }
    setLoaded(true);
  }, []);

  const save = (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  };

  const reset = () => {
    setSettings(DEFAULTS);
    try {
      localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
  };

  return { settings, save, reset, loaded };
}
