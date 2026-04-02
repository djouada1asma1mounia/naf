import React, { createContext, useContext, useMemo, useState } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import getTheme from '../theme';

const ThemeContext = createContext(null);
const THEME_MODE_KEY = 'naftal_theme';
const SECONDARY_BY_USER_KEY = 'naftal_theme_secondary_by_user';
const DEFAULT_SECONDARY_BLUE = '#1976D2';

const normalizeColor = (value) => {
  const input = String(value || '').trim();
  const normalized = input.startsWith('#') ? input : `#${input}`;
  return /^#[0-9A-Fa-f]{6}$/.test(normalized) ? normalized.toUpperCase() : DEFAULT_SECONDARY_BLUE;
};

const getStoredSecondaryMap = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(SECONDARY_BY_USER_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const getStoredUserId = () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem('naftal_user') || 'null');
    return storedUser?.id ? String(storedUser.id) : 'guest';
  } catch {
    return 'guest';
  }
};

export const useThemeMode = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeProvider');
  return ctx;
};

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => localStorage.getItem(THEME_MODE_KEY) || 'light');
  const [secondaryByUser, setSecondaryByUser] = useState(getStoredSecondaryMap);

  const activeUserId = getStoredUserId();
  const secondaryColor = normalizeColor(secondaryByUser[activeUserId] || DEFAULT_SECONDARY_BLUE);

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(THEME_MODE_KEY, next);
      return next;
    });
  };

  const setSecondaryColor = (value) => {
    const nextColor = normalizeColor(value);
    setSecondaryByUser((prev) => {
      const next = {
        ...prev,
        [activeUserId]: nextColor,
      };
      localStorage.setItem(SECONDARY_BY_USER_KEY, JSON.stringify(next));
      return next;
    });
  };

  const resetSecondaryColor = () => {
    setSecondaryColor(DEFAULT_SECONDARY_BLUE);
  };

  const theme = useMemo(() => getTheme(mode, secondaryColor), [mode, secondaryColor]);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        toggleTheme,
        secondaryColor,
        setSecondaryColor,
        resetSecondaryColor,
        defaultSecondaryColor: DEFAULT_SECONDARY_BLUE,
      }}
    >
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
