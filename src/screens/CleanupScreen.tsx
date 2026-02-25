import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Icon } from '../components/Icon';
import { useDiskUsage } from '../hooks/useDiskUsage';
import { dockerService } from '../services/docker';
import { IconButton } from '../components/IconButton';
import { colors, fonts, spacing, radii } from '../theme/colors';

function formatSize(bytes: number): string {
  if (bytes === 0) {return '0 B';}
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

interface CleanupCategory {
  key: string;
  title: string;
  renderIcon: (color: string) => React.ReactElement;
  description: string;
  itemCount: number;
  totalSize: number;
  reclaimable: number;
  color: string;
}

export function CleanupScreen() {
  const { usage, loading, refresh } = useDiskUsage();
  const [pruning, setPruning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { count: number; space: number }>>({});

  const handlePrune = useCallback(
    async (
      key: string,
      action: () => Promise<{ count: number; spaceReclaimed: number }>,
    ) => {
      setPruning(key);
      try {
        const result = await action();
        setResults((prev) => ({
          ...prev,
          [key]: { count: result.count, space: result.spaceReclaimed },
        }));
        await refresh();
      } finally {
        setPruning(null);
      }
    },
    [refresh],
  );

  if (loading || !usage) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  // Compute categories
  const stoppedContainers = usage.Containers.filter(
    (c) => c.State === 'exited' || c.State === 'dead',
  );
  const danglingImages = usage.Images.filter(
    (i) => i.RepoTags[0] === '<none>:<none>',
  );
  const unusedVolumes = usage.Volumes.filter(
    (v) => v.UsageData && v.UsageData.RefCount === 0,
  );
  const prunableBuildCache = usage.BuildCache.filter((b) => !b.InUse);

  const categories: CleanupCategory[] = [
    {
      key: 'containers',
      title: 'Stopped Containers',
      renderIcon: (color) => <Icon name="stop" color={color} size={20} />,
      description: 'Containers that have exited and are no longer running',
      itemCount: stoppedContainers.length,
      totalSize: stoppedContainers.length * 50_000_000, // Approximate
      reclaimable: stoppedContainers.length * 50_000_000,
      color: colors.error,
    },
    {
      key: 'images',
      title: 'Dangling Images',
      renderIcon: (color) => <Icon name="warning" color={color} size={20} />,
      description: 'Untagged images not referenced by any container',
      itemCount: danglingImages.length,
      totalSize: danglingImages.reduce((s, i) => s + i.Size, 0),
      reclaimable: danglingImages.reduce((s, i) => s + i.Size, 0),
      color: colors.warning,
    },
    {
      key: 'volumes',
      title: 'Unused Volumes',
      renderIcon: (color) => <Icon name="database" color={color} size={20} />,
      description: 'Volumes not referenced by any container',
      itemCount: unusedVolumes.length,
      totalSize: unusedVolumes.reduce(
        (s, v) => s + (v.UsageData?.Size ?? 0),
        0,
      ),
      reclaimable: unusedVolumes.reduce(
        (s, v) => s + (v.UsageData?.Size ?? 0),
        0,
      ),
      color: colors.info,
    },
    {
      key: 'buildcache',
      title: 'Build Cache',
      renderIcon: (color) => <Icon name="hard-drives" color={color} size={20} />,
      description: 'Cached layers from docker build that are not in use',
      itemCount: prunableBuildCache.length,
      totalSize: prunableBuildCache.reduce((s, b) => s + b.Size, 0),
      reclaimable: prunableBuildCache.reduce((s, b) => s + b.Size, 0),
      color: colors.accent,
    },
  ];

  const totalReclaimable = categories.reduce(
    (sum, c) => sum + c.reclaimable,
    0,
  );
  const totalDiskUsage =
    usage.Images.reduce((s, i) => s + i.Size, 0) +
    usage.Volumes.reduce((s, v) => s + (v.UsageData?.Size ?? 0), 0) +
    usage.BuildCache.reduce((s, b) => s + b.Size, 0);

  const pruneActions: Record<string, () => Promise<{ count: number; spaceReclaimed: number }>> =
    {
      containers: () => dockerService.pruneContainers(),
      images: () => dockerService.pruneImages(),
      volumes: () => dockerService.pruneVolumes(),
      buildcache: () => dockerService.pruneBuildCache(),
    };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Cleanup</Text>
          <Text style={styles.subtitle}>
            Reclaim disk space by removing unused Docker resources
          </Text>
        </View>
      </View>

      <ScrollView style={styles.list}>
        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{formatSize(totalDiskUsage)}</Text>
              <Text style={styles.summaryLabel}>Total Disk Usage</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.warning }]}>
                {formatSize(totalReclaimable)}
              </Text>
              <Text style={styles.summaryLabel}>Reclaimable</Text>
            </View>
          </View>

          {/* Usage bar */}
          <View style={styles.usageBarContainer}>
            {categories.map((cat) => {
              const pct = totalDiskUsage > 0 ? (cat.totalSize / totalDiskUsage) * 100 : 0;
              if (pct < 1) {return null;}
              return (
                <View
                  key={cat.key}
                  style={[
                    styles.usageBarSegment,
                    {
                      width: `${pct}%` as any,
                      backgroundColor: cat.color,
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            {categories.map((cat) => (
              <View key={cat.key} style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: cat.color }]}
                />
                <Text style={styles.legendText}>{cat.title}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Category cards */}
        {categories.map((cat) => {
          const result = results[cat.key];
          const isPruning = pruning === cat.key;

          return (
            <View key={cat.key} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryLeft}>
                  <View style={styles.categoryIconContainer}>
                    {cat.renderIcon(cat.color)}
                  </View>
                  <View>
                    <Text style={styles.categoryTitle}>{cat.title}</Text>
                    <Text style={styles.categoryDesc}>{cat.description}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.categoryStats}>
                <View style={styles.categoryStat}>
                  <Text style={styles.categoryStatValue}>{cat.itemCount}</Text>
                  <Text style={styles.categoryStatLabel}>Items</Text>
                </View>
                <View style={styles.categoryStat}>
                  <Text style={styles.categoryStatValue}>
                    {formatSize(cat.totalSize)}
                  </Text>
                  <Text style={styles.categoryStatLabel}>Size</Text>
                </View>
                <View style={styles.categoryStat}>
                  <Text
                    style={[
                      styles.categoryStatValue,
                      { color: colors.warning },
                    ]}>
                    {formatSize(cat.reclaimable)}
                  </Text>
                  <Text style={styles.categoryStatLabel}>Reclaimable</Text>
                </View>
              </View>

              <View style={styles.categoryFooter}>
                {result ? (
                  <Text style={styles.resultText}>
                    Removed {result.count} item{result.count !== 1 ? 's' : ''},{' '}
                    reclaimed {formatSize(result.space)}
                  </Text>
                ) : (
                  <View />
                )}
                <IconButton
                  label={isPruning ? 'Pruning...' : 'Prune'}
                  onPress={() => handlePrune(cat.key, pruneActions[cat.key])}
                  variant="danger"
                  disabled={isPruning || cat.itemCount === 0}
                />
              </View>
            </View>
          );
        })}

        {/* Prune all */}
        <View style={styles.pruneAllCard}>
          <View style={styles.pruneAllLeft}>
            <Text style={styles.pruneAllTitle}>Prune Everything</Text>
            <Text style={styles.pruneAllDesc}>
              Remove all stopped containers, dangling images, unused volumes,
              and build cache in one go.
            </Text>
          </View>
          <IconButton
            label="Prune All"
            onPress={async () => {
              setPruning('all');
              try {
                await dockerService.pruneContainers();
                await dockerService.pruneImages();
                await dockerService.pruneVolumes();
                await dockerService.pruneBuildCache();
                await refresh();
              } finally {
                setPruning(null);
              }
            }}
            variant="danger"
            disabled={pruning !== null || totalReclaimable === 0}
          />
        </View>

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
  list: {
    flex: 1,
    padding: spacing.xl,
  },

  // Summary
  summaryCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    fontFamily: fonts.mono,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  usageBarContainer: {
    flexDirection: 'row',
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  usageBarSegment: {
    height: 8,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: colors.textSecondary,
    fontSize: 11,
  },

  // Category cards
  categoryCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    flex: 1,
  },
  categoryIconContainer: {
    marginTop: 2,
  },
  categoryTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  categoryDesc: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  categoryStats: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  categoryStat: {
    gap: 2,
  },
  categoryStatValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.mono,
  },
  categoryStatLabel: {
    color: colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultText: {
    color: colors.success,
    fontSize: 12,
  },

  // Prune all
  pruneAllCard: {
    backgroundColor: colors.error + '10',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.error + '30',
    padding: spacing.lg,
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  pruneAllLeft: {
    flex: 1,
  },
  pruneAllTitle: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
  pruneAllDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },

  bottomSpacer: {
    height: spacing.xxl,
  },
});
