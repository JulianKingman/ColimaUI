import React from 'react';
import { requireNativeComponent, Platform, View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme/colors';

interface NativeTerminalProps {
  containerId: string;
  containerName?: string;
  fontSize?: number;
  fontFamily?: string;
  themeForeground?: string;
  themeBackground?: string;
  style?: object;
}

const NativeTerminalView =
  Platform.OS === 'macos'
    ? requireNativeComponent<NativeTerminalProps>('TerminalHostView')
    : null;

interface Props {
  containerId: string;
  containerName?: string;
  fontSize?: number;
}

export function TerminalView({ containerId, containerName, fontSize = 13 }: Props) {
  if (!NativeTerminalView) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>
          Terminal is only available on macOS.
        </Text>
      </View>
    );
  }

  return (
    <NativeTerminalView
      containerId={containerId}
      containerName={containerName ?? containerId.slice(0, 12)}
      fontSize={fontSize}
      fontFamily={fonts.mono}
      themeForeground={colors.textPrimary}
      themeBackground={colors.bg}
      style={styles.terminal}
    />
  );
}

const styles = StyleSheet.create({
  terminal: {
    flex: 1,
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  fallbackText: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 13,
  },
});
