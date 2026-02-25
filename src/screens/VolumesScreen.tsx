import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useVolumes } from '../hooks/useVolumes';
import { dockerService } from '../services/docker';
import { SearchBar } from '../components/SearchBar';
import { Icon } from '../components/Icon';
import { IconButton } from '../components/IconButton';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { colors, fonts, spacing } from '../theme/colors';

function formatSize(bytes: number): string {
  if (bytes === 0) {return '0 B';}
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function VolumesScreen() {
  const { volumes, loading, refresh } = useVolumes();
  const [search, setSearch] = useState('');
  const [removingName, setRemovingName] = useState<string | null>(null);

  const filtered = volumes.filter((v) => {
    if (!search) {return true;}
    const q = search.toLowerCase();
    return (
      v.Name.toLowerCase().includes(q) ||
      v.Driver.toLowerCase().includes(q)
    );
  });

  const totalSize = volumes.reduce(
    (sum, v) => sum + (v.UsageData?.Size ?? 0),
    0,
  );
  const unusedCount = volumes.filter(
    (v) => v.UsageData && v.UsageData.RefCount === 0,
  ).length;

  const handleRemove = useCallback(
    async (name: string) => {
      setRemovingName(name);
      await dockerService.removeVolume(name);
      await refresh();
      setRemovingName(null);
    },
    [refresh],
  );

  if (loading && volumes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Volumes</Text>
          <Text style={styles.subtitle}>
            {volumes.length} volumes, {formatSize(totalSize)} total
            {unusedCount > 0 && ` (${unusedCount} unused)`}
          </Text>
        </View>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Filter volumes by name or driver..."
          resultCount={search ? filtered.length : undefined}
        />
      </View>

      {/* Table header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.colHeader, styles.colName]}>VOLUME NAME</Text>
        <Text style={[styles.colHeader, styles.colDriver]}>DRIVER</Text>
        <Text style={[styles.colHeader, styles.colCreated]}>CREATED</Text>
        <Text style={[styles.colHeader, styles.colSize]}>SIZE</Text>
        <Text style={[styles.colHeader, styles.colRefs]}>IN USE</Text>
        <Text style={[styles.colHeader, styles.colActions]}>ACTIONS</Text>
      </View>

      <ScrollView style={styles.list}>
        {filtered.map((volume) => {
          const inUse =
            volume.UsageData && volume.UsageData.RefCount > 0;
          const project = volume.Labels['com.docker.compose.project'];

          return (
            <View key={volume.Name} style={styles.row}>
              <View style={[styles.colName]}>
                <Text style={styles.volumeName} numberOfLines={1}>
                  {volume.Name}
                </Text>
                {project && (
                  <Badge label={project} />
                )}
              </View>
              <Text style={[styles.colDriver, styles.cellText]}>
                {volume.Driver}
              </Text>
              <Text style={[styles.colCreated, styles.cellText]}>
                {formatDate(volume.CreatedAt)}
              </Text>
              <Text style={[styles.colSize, styles.mono]}>
                {formatSize(volume.UsageData?.Size ?? 0)}
              </Text>
              <View style={[styles.colRefs]}>
                <Badge
                  label={inUse ? 'Yes' : 'No'}
                  color={inUse ? colors.success : colors.textMuted}
                  bgColor={inUse ? colors.success + '20' : colors.badgeBg}
                />
              </View>
              <View style={[styles.colActions]}>
                <IconButton
                  label=""
                  onPress={() => handleRemove(volume.Name)}
                  variant="danger"
                  small
                  disabled={removingName === volume.Name || !!inUse}
                  icon={<Icon name="trash" color={removingName === volume.Name || !!inUse ? colors.textMuted : colors.error} size={14} />}
                />
              </View>
            </View>
          );
        })}

        {filtered.length === 0 && (
          <EmptyState
            title="No volumes found"
            subtitle={search ? 'Try a different search term' : undefined}
          />
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  colHeader: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  colName: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  colDriver: {
    flex: 1,
  },
  colCreated: {
    flex: 1.5,
  },
  colSize: {
    flex: 1,
    textAlign: 'right',
  },
  colRefs: {
    flex: 0.8,
    alignItems: 'center',
  },
  colActions: {
    flex: 1,
    alignItems: 'flex-end',
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  volumeName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
    fontFamily: fonts.mono,
  },
  cellText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  mono: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.mono,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
