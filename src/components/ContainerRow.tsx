import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import type { Container } from '../types/docker';
import { StatusIndicator } from './StatusIndicator';
import { IconButton } from './IconButton';
import { colors, fonts, spacing, radii } from '../theme/colors';

interface Props {
  container: Container;
  onPress: () => void;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onRemove: () => void;
}

function formatPorts(container: Container): string {
  return container.Ports.filter((p) => p.PublicPort)
    .map((p) => `${p.PublicPort}:${p.PrivatePort}`)
    .join(', ');
}

export function ContainerRow({
  container,
  onPress,
  onStart,
  onStop,
  onRestart,
  onRemove,
}: Props) {
  const name = container.Names[0]?.replace(/^\//, '') ?? container.Id.slice(0, 12);
  const isRunning = container.State === 'running';
  const ports = formatPorts(container);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.container}>
      <View style={styles.left}>
        <StatusIndicator state={container.State} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.meta}>
            <Text style={styles.image} numberOfLines={1}>
              {container.Image}
            </Text>
            {ports.length > 0 && (
              <Text style={styles.ports}>{ports}</Text>
            )}
          </View>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.status}>{container.Status}</Text>
        <View style={styles.actions}>
          {isRunning ? (
            <>
              <IconButton
                label=""
                onPress={onStop}
                variant="danger"
                small
                icon={<Icon name="stop" color={colors.error} size={14} />}
              />
              <IconButton
                label=""
                onPress={onRestart}
                small
                icon={<Icon name="restart" color={colors.textPrimary} size={14} />}
              />
            </>
          ) : (
            <>
              <IconButton
                label=""
                onPress={onStart}
                variant="success"
                small
                icon={<Icon name="play" color={colors.success} size={14} />}
              />
              <IconButton
                label=""
                onPress={onRemove}
                variant="danger"
                small
                icon={<Icon name="trash" color={colors.error} size={14} />}
              />
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  image: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fonts.mono,
  },
  ports: {
    color: colors.accent,
    fontSize: 11,
    fontFamily: fonts.mono,
  },
  right: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  status: {
    color: colors.textMuted,
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
