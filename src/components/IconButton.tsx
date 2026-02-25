import React from 'react';
import { TouchableOpacity, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'default' | 'danger' | 'success' | 'primary';
  disabled?: boolean;
  small?: boolean;
  style?: ViewStyle;
  icon?: React.ReactElement;
}

const variantColors = {
  default: { bg: colors.bgElevated, text: colors.textPrimary },
  danger: { bg: '#3b2018', text: colors.error },
  success: { bg: '#1a2e1e', text: colors.success },
  primary: { bg: colors.accentMuted, text: colors.accent },
};

export function IconButton({
  label,
  onPress,
  variant = 'default',
  disabled = false,
  small = false,
  style,
  icon,
}: Props) {
  const vc = variantColors[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          backgroundColor: vc.bg,
          opacity: disabled ? 0.4 : 1,
          paddingVertical: small ? spacing.xs : spacing.sm,
          paddingHorizontal: small ? spacing.sm : spacing.md,
        },
        icon && !label ? styles.iconOnly : undefined,
        style,
      ]}>
      {icon ? (
        icon
      ) : (
        <Text
          style={[
            styles.label,
            { color: vc.text, fontSize: small ? 11 : 12 },
          ]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontWeight: '600',
  },
  iconOnly: {
    paddingHorizontal: spacing.sm,
  },
});
