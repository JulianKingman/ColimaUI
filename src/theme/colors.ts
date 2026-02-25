export const colors = {
  // Backgrounds
  bg: '#1a1714',
  bgSidebar: '#0e0d0b',
  bgCard: '#1e1b17',
  bgCardHover: '#252119',
  bgInput: '#1a1815',
  bgElevated: '#252119',
  bgModal: '#141210',

  // Borders
  border: '#3a352d',
  borderLight: '#4a443a',
  borderFocus: '#d4a574',

  // Text
  textPrimary: '#e8e2d6',
  textSecondary: '#9a9285',
  textMuted: '#6a6358',
  textInverse: '#1a1714',

  // Accent / Brand
  accent: '#d4a574',
  accentHover: '#deb48a',
  accentMuted: '#5a4430',

  // Status colors
  statusRunning: '#5cb87a',
  statusStopped: '#c45454',
  statusPaused: '#d4a040',
  statusRestarting: '#d4a040',
  statusCreated: '#7a7368',
  statusDead: '#c45454',
  statusRemoving: '#d4a040',

  // Semantic
  success: '#5cb87a',
  warning: '#d4a040',
  error: '#c45454',
  info: '#c4956a',

  // Sidebar
  sidebarBg: '#0e0d0b',
  sidebarItemActive: '#221f1a',
  sidebarItemHover: '#181510',
  sidebarText: '#9a9285',
  sidebarTextActive: '#e8e2d6',
  sidebarIcon: '#6a6358',
  sidebarIconActive: '#d4a574',

  // Tags / badges
  badgeBg: '#2a2620',
  badgeText: '#9a9285',
} as const;

export const statusColor: Record<string, string> = {
  running: colors.statusRunning,
  exited: colors.statusStopped,
  paused: colors.statusPaused,
  restarting: colors.statusRestarting,
  created: colors.statusCreated,
  dead: colors.statusDead,
  removing: colors.statusRemoving,
};

export const fonts = {
  mono: 'Menlo',
  system: 'System',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
} as const;
