import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { colors, spacing } from '../theme/colors';

interface Props {
  title: string;
  collapsed?: boolean;
  onToggle?: () => void;
  runningCount?: number;
  totalCount?: number;
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
  runningCount = 0,
  totalCount = 0,
  hasRunning,
  onStopAll,
  onRestartAll,
  onStartAll,
  onRemoveAll,
  actionLoading,
}: Props) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.7}
      style={styles.container}>
      {/* Left: chevron + title + status bar + count */}
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
        {totalCount > 0 && (
          <>
            <View style={styles.statusBar}>
              <View
                style={[
                  styles.statusFill,
                  { width: `${(runningCount / totalCount) * 100}%` as any },
                ]}
              />
            </View>
            <Text style={styles.statusText}>
              {runningCount}/{totalCount}
            </Text>
          </>
        )}
      </View>

      {/* Right: action buttons */}
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
  statusBar: {
    width: 40,
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  statusFill: {
    height: 3,
    backgroundColor: colors.statusRunning,
    borderRadius: 2,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: 10,
  },
});
