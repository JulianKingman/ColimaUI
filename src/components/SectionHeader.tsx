import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { colors, spacing } from '../theme/colors';

interface Props {
  title: string;
  count?: number;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function SectionHeader({ title, count, collapsed, onToggle }: Props) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.7}
      style={styles.container}>
      <View style={styles.left}>
        {onToggle && (
          <View style={styles.chevronContainer}>
            {collapsed ? (
              <Icon name="caret-right" color={colors.textMuted} size={10} />
            ) : (
              <Icon name="caret-down" color={colors.textMuted} size={10} />
            )}
          </View>
        )}
        <Text style={styles.title}>{title}</Text>
      </View>
      {count !== undefined && (
        <Text style={styles.count}>{count}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chevronContainer: {
    width: 14,
    alignItems: 'center',
  },
  title: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  count: {
    color: colors.textMuted,
    fontSize: 11,
  },
});
