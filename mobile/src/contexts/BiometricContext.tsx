import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

// Lazy require — el módulo nativo solo existe después de un rebuild con expo run:android/ios
let LA: typeof import('expo-local-authentication') | null = null;
try {
  LA = require('expo-local-authentication');
} catch {
  console.log('[Biometric] native module not available — rebuild required');
}

const STORAGE_KEY = 'biometric_enabled';

interface BiometricContextType {
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  isLocked: boolean;
  setBiometricEnabled: (value: boolean) => Promise<void>;
  authenticate: () => Promise<boolean>;
}

const BiometricContext = createContext<BiometricContextType>({
  biometricEnabled: false,
  biometricAvailable: false,
  isLocked: false,
  setBiometricEnabled: async () => {},
  authenticate: async () => false,
});

export function BiometricProvider({ children }: { children: React.ReactNode }) {
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const lastActive = useRef<number>(Date.now());

  useEffect(() => {
    async function init() {
      if (!LA) return; // módulo nativo no disponible aún

      const [available, savedPref] = await Promise.all([
        LA.hasHardwareAsync(),
        AsyncStorage.getItem(STORAGE_KEY),
      ]);
      const enrolled = available ? await LA.isEnrolledAsync() : false;
      setBiometricAvailable(available && enrolled);
      const enabled = savedPref === 'true';
      setBiometricEnabledState(enabled);
      if (enabled && enrolled) {
        setIsLocked(true);
        authenticate();
      }
    }
    init();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        lastActive.current = Date.now();
      }
      if (state === 'active' && biometricEnabled) {
        const elapsed = Date.now() - lastActive.current;
        if (elapsed > 60_000) {
          setIsLocked(true);
          authenticate();
        }
      }
    });
    return () => sub.remove();
  }, [biometricEnabled]);

  async function authenticate(): Promise<boolean> {
    if (!LA) return true; // sin módulo nativo, desbloquear directo

    try {
      const result = await LA.authenticateAsync({
        promptMessage: 'Spendly',
        fallbackLabel: 'Usar contraseña',
        cancelLabel: 'Cancelar',
      });
      if (result.success) {
        setIsLocked(false);
        return true;
      }
      return false;
    } catch {
      setIsLocked(false);
      return false;
    }
  }

  async function setBiometricEnabled(value: boolean) {
    await AsyncStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
    setBiometricEnabledState(value);
    if (!value) setIsLocked(false);
  }

  return (
    <BiometricContext.Provider value={{ biometricEnabled, biometricAvailable, isLocked, setBiometricEnabled, authenticate }}>
      {children}
    </BiometricContext.Provider>
  );
}

export const useBiometric = () => useContext(BiometricContext);
