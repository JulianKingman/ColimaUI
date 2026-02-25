import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';

interface Props {
  label: string;
  color?: string;
  bgColor?: string;
}

export function Badge({
  label,
  color = colors.textSecondary,
  bgColor = colors.badgeBg,
}: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  text: {
    fontSize: 11,
    fontWeight: '500',
  },
});
