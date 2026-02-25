import React from 'react';
import { Text } from 'react-native';

// Icon names mapped to macOS-friendly characters
const iconMap: Record<string, string> = {
  // Navigation
  'cube': '▣',
  'stack': '◎',
  'database': '▤',
  'broom': '⌫',
  'hexagon': '⬡',

  // Actions
  'play': '▶',
  'stop': '■',
  'restart': '↻',
  'trash': '✕',
  'arrow-left': '←',
  'search': '⌕',
  'caret-right': '▸',
  'caret-down': '▾',

  // Status/Info
  'warning': '⚠',
  'hard-drives': '⚙',
  'ghost': '∅',

  // Detail tabs
  'terminal': '>_',
  'logs': '≡',
  'info': 'ⓘ',
  'chart': '▊',
};

interface Props {
  name: string;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 16, color = '#e8e2d6' }: Props) {
  const char = iconMap[name] ?? '?';
  return (
    <Text style={{ fontSize: size * 0.85, color, lineHeight: size, textAlign: 'center', width: size }}>
      {char}
    </Text>
  );
}
