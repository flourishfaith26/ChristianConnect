'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type TextSize = 'normal' | 'large' | 'xlarge';

interface AccessibilityContextType {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  highContrast: boolean;
  setHighContrast: (contrast: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  textSize: 'normal',
  setTextSize: () => {},
  highContrast: false,
  setHighContrast: () => {},
});

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [textSize, setTextSizeState] = useState<TextSize>('normal');
  const [highContrast, setHighContrastState] = useState<boolean>(false);

  useEffect(() => {
    const savedSize = localStorage.getItem('cc_text_size') as TextSize;
    const savedContrast = localStorage.getItem('cc_high_contrast') === 'true';
    if (savedSize) setTextSizeState(savedSize);
    if (savedContrast) setHighContrastState(savedContrast);
  }, []);

  const setTextSize = (size: TextSize) => {
    setTextSizeState(size);
    localStorage.setItem('cc_text_size', size);
  };

  const setHighContrast = (contrast: boolean) => {
    setHighContrastState(contrast);
    localStorage.setItem('cc_high_contrast', String(contrast));
  };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-text-size', textSize);
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [textSize, highContrast]);

  return (
    <AccessibilityContext.Provider value={{ textSize, setTextSize, highContrast, setHighContrast }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => useContext(AccessibilityContext);
