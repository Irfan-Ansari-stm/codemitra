'use client';

import { useEffect } from 'react';
import axios from 'axios';
import { authApi, setAccessToken } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

let restoreSessionPromise: Promise<void> | null = null;

function restoreSession() {
  if (!restoreSessionPromise) {
    restoreSessionPromise = authApi.refresh()
      .then(async ({ data }) => {
        setAccessToken(data.data.accessToken);
        try {
          const profile = await authApi.getProfile();
          useAuthStore.getState().setUser(profile.data.data);
        } catch {
          // Keep the refreshed session and cached profile during a temporary profile API outage.
        }
      })
      .catch((error: unknown) => {
        setAccessToken(null);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          useAuthStore.getState().clear();
        }
      })
      .finally(() => {
        useAuthStore.getState().setReady(true);
        restoreSessionPromise = null;
      });
  }
  return restoreSessionPromise;
}

export function AuthInitializer() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const useDarkTheme = savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', useDarkTheme);
    void restoreSession();
  }, []);

  return null;
}
