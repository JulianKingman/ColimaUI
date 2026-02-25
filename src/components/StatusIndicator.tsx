import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ContainerState } from '../types/docker';
import { statusColor, colors } from '../theme/colors';

interface Props {
  state: ContainerState;
  size?: number;
}

export function StatusIndicator({ state, size = 8 }: Props) {
  const color = statusColor[state] ?? colors.textMuted;
  const isRunning = state === 'running';

  return (
    <View style={[styles.wrapper, { width: size + 4, height: size + 4 }]}>
      {isRunning && (
        <View
          style={[
            styles.glow,
            {
              width: size + 4,
              height: size + 4,
              borderRadius: (size + 4) / 2,
              backgroundColor: color,
              opacity: 0.3,
            },
          ]}
        />
      )}
      <View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  dot: {},
});
