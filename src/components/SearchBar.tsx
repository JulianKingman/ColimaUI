import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { colors, fonts, radii, spacing } from '../theme/colors';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  resultCount?: number;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  resultCount,
}: Props) {
  return (
    <View style={styles.container}>
      <Icon name="search" color={colors.textMuted} size={16} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {resultCount !== undefined && value.length > 0 && (
        <Text style={styles.count}>
          {resultCount} result{resultCount !== 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 32,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.system,
    padding: 0,
    height: 30,
  },
  count: {
    color: colors.textMuted,
    fontSize: 11,
    marginLeft: spacing.sm,
  },
});
