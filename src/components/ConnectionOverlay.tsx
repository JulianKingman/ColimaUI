import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { colors, spacing, radii, fonts } from '../theme/colors';

interface Props {
  starting: boolean;
  startError: string | null;
  onStartColima: () => void;
}

export function ConnectionOverlay({ starting, startError, onStartColima }: Props) {
  return (
    <View style={styles.container}>
      <Icon name="plug" color={colors.textMuted} size={48} />
      <Text style={styles.title}>Docker is not available</Text>
      <Text style={styles.subtitle}>
        Colima doesn't appear to be running. Start it to manage your containers.
      </Text>

      {startError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{startError}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, starting && styles.buttonDisabled]}
        onPress={onStartColima}
        disabled={starting}
        activeOpacity={0.7}>
        {starting ? (
          <>
            <ActivityIndicator color={colors.textInverse} size="small" />
            <Text style={styles.buttonText}>Starting Colima...</Text>
          </>
        ) : (
          <>
            <Icon name="play" color={colors.textInverse} size={16} />
            <Text style={styles.buttonText}>Start Colima</Text>
          </>
        )}
      </TouchableOpacity>

      {starting && (
        <Text style={styles.hint}>This may take a minute</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: spacing.md,
  },
  errorBox: {
    backgroundColor: '#2a1a1a',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    maxWidth: 400,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    fontFamily: fonts.mono,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: spacing.xs,
  },
});
