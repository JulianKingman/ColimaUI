import React from 'react';
import {
  Cube,
  Stack,
  Database,
  Broom,
  Hexagon,
  Play,
  Stop,
  ArrowCounterClockwise,
  Trash,
  ArrowLeft,
  MagnifyingGlass,
  CaretRight,
  CaretDown,
  Warning,
  HardDrives,
  Ghost,
  Terminal,
  Rows,
  Info,
  ChartBar,
} from 'phosphor-react-native';
import type { IconProps as PhosphorIconProps } from 'phosphor-react-native';

const iconMap: Record<string, React.ComponentType<PhosphorIconProps>> = {
  // Navigation
  'cube': Cube,
  'stack': Stack,
  'database': Database,
  'broom': Broom,
  'hexagon': Hexagon,

  // Actions
  'play': Play,
  'stop': Stop,
  'restart': ArrowCounterClockwise,
  'trash': Trash,
  'arrow-left': ArrowLeft,
  'search': MagnifyingGlass,
  'caret-right': CaretRight,
  'caret-down': CaretDown,

  // Status/Info
  'warning': Warning,
  'hard-drives': HardDrives,
  'ghost': Ghost,

  // Detail tabs
  'terminal': Terminal,
  'logs': Rows,
  'info': Info,
  'chart': ChartBar,
};

interface Props {
  name: string;
  size?: number;
  color?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

export function Icon({ name, size = 16, color = '#e8e2d6', weight = 'regular' }: Props) {
  const IconComponent = iconMap[name];
  if (!IconComponent) {
    return null;
  }
  return <IconComponent size={size} color={color} weight={weight} />;
}
