/** Paleta e medidas. Contrastes verificados contra WCAG 2.2 AA (ver README). */
export const colors = {
  bg: '#FFFFFF',
  surface: '#F3F6FB',
  text: '#14213D',
  textMuted: '#425066',
  border: '#6E7A8E',
  primary: '#1D4ED8',
  onPrimary: '#FFFFFF',
  headerBg: '#14213D',
  onHeader: '#FFFFFF',
  selectedBg: '#DCE7FF',
  danger: '#9B1C1C',
  dangerBg: '#FDE6E6',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

/** Área de toque mínima (RNF09). */
export const MIN_TOUCH = 48;

export const radius = 12;
