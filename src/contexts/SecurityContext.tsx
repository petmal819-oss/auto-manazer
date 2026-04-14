import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';

const PIN_KEY = 'car_manager_pin';
const PIN_ENABLED_KEY = 'car_manager_pin_enabled';

interface SecurityContextType {
  pin: string | null;
  isPinEnabled: boolean;
  isAuthenticated: boolean;
  updatePin: (newPin: string | null) => void;
  togglePin: (enabled: boolean) => void;
  authenticate: (enteredPin: string) => boolean;
  logout: () => void;
  hasPin: boolean;
  isFirstLaunch: boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: ReactNode }) {
  const [pin, setPin] = useState<string | null>(() => localStorage.getItem(PIN_KEY));
  // Default to true if PIN is set, otherwise default to true to force setup
  const [isPinEnabled, setIsPinEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem(PIN_ENABLED_KEY);
    return stored !== null ? stored === 'true' : true;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  const isFirstLaunch = !pin;

  useEffect(() => {
    if (pin) {
      localStorage.setItem(PIN_KEY, pin);
    } else {
      localStorage.removeItem(PIN_KEY);
    }
  }, [pin]);

  useEffect(() => {
    localStorage.setItem(PIN_ENABLED_KEY, String(isPinEnabled));
  }, [isPinEnabled]);

  const updatePin = useCallback((newPin: string | null) => {
    setPin(newPin);
    if (!newPin) {
      setIsPinEnabled(false);
    } else {
      setIsPinEnabled(true);
      setIsAuthenticated(true); // Auto-authenticate after setting new PIN
    }
  }, []);

  const togglePin = useCallback((enabled: boolean) => {
    setIsPinEnabled(enabled);
    if (!enabled) {
      setIsAuthenticated(true);
    } else if (pin) {
      setIsAuthenticated(false);
    }
  }, [pin]);

  const authenticate = useCallback((enteredPin: string) => {
    if (enteredPin === pin) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, [pin]);

  const logout = useCallback(() => {
    if (isPinEnabled && pin) {
      setIsAuthenticated(false);
    }
  }, [isPinEnabled, pin]);

  // If PIN is not enabled and it's not first launch, the user is always authenticated
  useEffect(() => {
    if (!isPinEnabled && pin) {
      setIsAuthenticated(true);
    }
  }, [isPinEnabled, pin]);

  return (
    <SecurityContext.Provider value={{
      pin,
      isPinEnabled,
      isAuthenticated,
      updatePin,
      togglePin,
      authenticate,
      logout,
      hasPin: !!pin,
      isFirstLaunch
    }}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}
