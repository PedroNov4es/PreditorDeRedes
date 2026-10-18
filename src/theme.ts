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
  /** Texto secundário e rótulo sobre o cabeçalho escuro (contrastes >= 8,7:1). */
  onHeaderMuted: '#C9D3E8',
  onHeaderEyebrow: '#AFC0E3',
  /** Controle (seletor de região) sobre o cabeçalho: fundo e borda (>= 3:1). */
  headerControlBg: '#243556',
  headerControlBorder: '#8FA3CC',
  /** Faixa neutra dos indicadores (decorativa: o texto sempre repete a informação). */
  track: '#DCE2EC',
  warningBg: '#FFF1CC',
  warningFg: '#6B4200',
  selectedBg: '#DCE7FF',
  danger: '#9B1C1C',
  dangerBg: '#FDE6E6',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

/** Área de toque mínima (RNF09). */
export const MIN_TOUCH = 48;

export const radius = 12;
