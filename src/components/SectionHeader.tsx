import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { colors, spacing } from '../theme/colors';

interface Props {
  title: string;
  collapsed?: boolean;
  onToggle?: () => void;
  hasRunning?: boolean;
  onStopAll?: () => void;
  onRestartAll?: () => void;
  onStartAll?: () => void;
  onRemoveAll?: () => void;
  actionLoading?: boolean;
}

export function SectionHeader({
  title,
  collapsed,
  onToggle,
  hasRunning,
  onStopAll,
  onRestartAll,
  onStartAll,
  onRemoveAll,
  actionLoading,
}: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        style={styles.left}>
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
      </TouchableOpacity>
      <View style={styles.actions}>
        {hasRunning ? (
          <>
            {onStopAll && (
              <IconButton
                label=""
                onPress={onStopAll}
                variant="danger"
                small
                disabled={actionLoading}
                icon={<Icon name="stop" color={actionLoading ? colors.textMuted : colors.error} size={14} />}
              />
            )}
            {onRestartAll && (
              <IconButton
                label=""
                onPress={onRestartAll}
                small
                disabled={actionLoading}
                icon={<Icon name="restart" color={actionLoading ? colors.textMuted : colors.textPrimary} size={14} />}
              />
            )}
          </>
        ) : (
          <>
            {onStartAll && (
              <IconButton
                label=""
                onPress={onStartAll}
                variant="success"
                small
                disabled={actionLoading}
                icon={<Icon name="play" color={actionLoading ? colors.textMuted : colors.success} size={14} />}
              />
            )}
            {onRemoveAll && (
              <IconButton
                label=""
                onPress={onRemoveAll}
                variant="danger"
                small
                disabled={actionLoading}
                icon={<Icon name="trash" color={actionLoading ? colors.textMuted : colors.error} size={14} />}
              />
            )}
          </>
        )}
      </View>
    </View>
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
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
});
