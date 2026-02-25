import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from './Icon';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const appIcon = require('../assets/app-icon.png');
import type { NavigationScreen } from '../types/docker';
import { colors, spacing, radii, fonts } from '../theme/colors';

interface NavItem {
  key: NavigationScreen;
  label: string;
  renderIcon: (color: string, size: number) => React.ReactElement;
}

const navItems: NavItem[] = [
  {
    key: 'containers',
    label: 'Containers',
    renderIcon: (color, size) => <Icon name="cube" color={color} size={size} />,
  },
  {
    key: 'images',
    label: 'Images',
    renderIcon: (color, size) => <Icon name="stack" color={color} size={size} />,
  },
  {
    key: 'volumes',
    label: 'Volumes',
    renderIcon: (color, size) => <Icon name="database" color={color} size={size} />,
  },
  {
    key: 'cleanup',
    label: 'Cleanup',
    renderIcon: (color, size) => <Icon name="broom" color={color} size={size} />,
  },
];

interface Props {
  active: NavigationScreen;
  onNavigate: (screen: NavigationScreen) => void;
  containerCount?: number;
  runningCount?: number;
  connected?: null | boolean;
}

export function Sidebar({
  active,
  onNavigate,
  containerCount = 0,
  runningCount = 0,
  connected,
}: Props) {
  const statusDotColor =
    connected === null
      ? colors.warning
      : connected
        ? colors.statusRunning
        : colors.statusStopped;
  return (
    <View style={styles.container}>
      {/* Logo area */}
      <View style={styles.logoArea}>
        <Image source={appIcon} style={styles.logoIcon} />
        <View>
          <Text style={styles.logoText}>ColimaUI</Text>
          <Text style={styles.logoSubtext}>Docker Manager</Text>
        </View>
      </View>

      {/* Status pill */}
      <View style={styles.statusPill}>
        <View style={[styles.statusDot, { backgroundColor: statusDotColor }]} />
        <Text style={styles.statusText}>
          {connected === false
            ? 'Disconnected'
            : connected === null
              ? 'Checking...'
              : `${runningCount} running / ${containerCount} total`}
        </Text>
      </View>

      {/* Navigation */}
      <View style={styles.nav}>
        {navItems.map((item) => {
          const isActive = active === item.key;
          const iconColor = isActive ? colors.sidebarIconActive : colors.sidebarIcon;
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => onNavigate(item.key)}
              activeOpacity={0.7}
              style={[
                styles.navItem,
                isActive && styles.navItemActive,
              ]}>
              <View style={styles.navIconContainer}>
                {item.renderIcon(iconColor, 16)}
              </View>
              <Text
                style={[
                  styles.navLabel,
                  isActive && styles.navLabelActive,
                ]}>
                {item.label}
              </Text>
              {isActive && <View style={styles.activeBar} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bottom info */}
      <View style={styles.footer}>
        <View style={styles.footerLine}>
          <Text style={styles.footerLabel}>Engine</Text>
          <Text style={styles.footerValue}>Colima</Text>
        </View>
        <View style={styles.footerLine}>
          <Text style={styles.footerLabel}>Docker</Text>
          <Text style={styles.footerValue}>24.0.7</Text>
        </View>
        <View style={styles.footerLine}>
          <Text style={styles.footerLabel}>Runtime</Text>
          <Text style={styles.footerValue}>containerd</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 220,
    backgroundColor: colors.sidebarBg,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingTop: 40,
    paddingBottom: spacing.lg,
  },
  logoArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  logoText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  logoSubtext: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.bgCard,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    gap: spacing.sm,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fonts.mono,
  },
  nav: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    gap: 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    gap: spacing.md,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: colors.sidebarItemActive,
  },
  navIconContainer: {
    width: 22,
    alignItems: 'center',
  },
  navLabel: {
    fontSize: 13,
    color: colors.sidebarText,
    fontWeight: '500',
  },
  navLabelActive: {
    color: colors.sidebarTextActive,
    fontWeight: '600',
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  footerLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerLabel: {
    color: colors.textMuted,
    fontSize: 11,
  },
  footerValue: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fonts.mono,
  },
});
