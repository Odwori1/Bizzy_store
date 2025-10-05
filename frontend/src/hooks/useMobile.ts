import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';

export const useMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    // Check if running on mobile
    const platform = Capacitor.getPlatform();
    setIsMobile(platform !== 'web');

    // Setup mobile-specific features
    if (platform !== 'web') {
      // Configure status bar
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: '#2563eb' });

      // Handle keyboard events
      Keyboard.addListener('keyboardWillShow', () => {
        setKeyboardVisible(true);
      });

      Keyboard.addListener('keyboardWillHide', () => {
        setKeyboardVisible(false);
      });
    }

    // Cleanup
    return () => {
      Keyboard.removeAllListeners();
    };
  }, []);

  return { isMobile, keyboardVisible };
};
