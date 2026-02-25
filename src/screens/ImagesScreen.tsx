import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useImages } from '../hooks/useImages';
import { dockerService } from '../services/docker';
import { SearchBar } from '../components/SearchBar';
import { IconButton } from '../components/IconButton';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { colors, fonts, spacing, radii } from '../theme/colors';

function formatSize(bytes: number): string {
  if (bytes === 0) {return '0 B';}
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatAge(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 3600) {return `${Math.floor(seconds / 60)}m ago`;}
  if (seconds < 86400) {return `${Math.floor(seconds / 3600)}h ago`;}
  if (seconds < 2592000) {return `${Math.floor(seconds / 86400)}d ago`;}
  return `${Math.floor(seconds / 2592000)}mo ago`;
}

export function ImagesScreen() {
  const { images, loading, refresh } = useImages();
  const [search, setSearch] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  const filtered = images.filter((img) => {
    if (!search) {return true;}
    const q = search.toLowerCase();
    return img.RepoTags.some((t) => t.toLowerCase().includes(q));
  });

  const totalSize = images.reduce((sum, img) => sum + img.Size, 0);
  const danglingCount = images.filter(
    (i) => i.RepoTags[0] === '<none>:<none>',
  ).length;

  const handleRemove = useCallback(
    async (id: string) => {
      setRemovingId(id);
      await dockerService.removeImage(id);
      await refresh();
      setRemovingId(null);
    },
    [refresh],
  );

  if (loading && images.length === 0) {
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
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Images</Text>
            <Text style={styles.subtitle}>
              {images.length} images, {formatSize(totalSize)} total
              {danglingCount > 0 && ` (${danglingCount} dangling)`}
            </Text>
          </View>
        </View>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Filter images by name or tag..."
          resultCount={search ? filtered.length : undefined}
        />
      </View>

      {/* Table header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.colHeader, styles.colName]}>REPOSITORY:TAG</Text>
        <Text style={[styles.colHeader, styles.colId]}>IMAGE ID</Text>
        <Text style={[styles.colHeader, styles.colCreated]}>CREATED</Text>
        <Text style={[styles.colHeader, styles.colSize]}>SIZE</Text>
        <Text style={[styles.colHeader, styles.colActions]}>ACTIONS</Text>
      </View>

      {/* Image list */}
      <ScrollView style={styles.list}>
        {filtered.map((image) => {
          const tag = image.RepoTags[0] ?? '<none>:<none>';
          const isDangling = tag === '<none>:<none>';
          const shortId = image.Id.replace('sha256:', '').slice(0, 12);

          return (
            <View key={image.Id} style={styles.row}>
              <View style={[styles.colName]}>
                <Text
                  style={[
                    styles.imageName,
                    isDangling && styles.imageNameDangling,
                  ]}
                  numberOfLines={1}>
                  {isDangling ? '<none>' : tag.split(':')[0]}
                </Text>
                {!isDangling && (
                  <Badge label={tag.split(':')[1] ?? 'latest'} />
                )}
                {isDangling && (
                  <Badge
                    label="dangling"
                    color={colors.warning}
                    bgColor={colors.warning + '20'}
                  />
                )}
              </View>
              <Text style={[styles.colId, styles.mono]}>{shortId}</Text>
              <Text style={[styles.colCreated, styles.cellText]}>
                {formatAge(image.Created)}
              </Text>
              <Text style={[styles.colSize, styles.mono]}>
                {formatSize(image.Size)}
              </Text>
              <View style={[styles.colActions]}>
                <IconButton
                  label="Remove"
                  onPress={() => handleRemove(image.Id)}
                  variant="danger"
                  small
                  disabled={removingId === image.Id || image.Containers > 0}
                />
              </View>
            </View>
          );
        })}

        {filtered.length === 0 && (
          <EmptyState
            title="No images found"
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  colId: {
    flex: 1.5,
  },
  colCreated: {
    flex: 1,
  },
  colSize: {
    flex: 1,
    textAlign: 'right',
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
  imageName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  imageNameDangling: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  mono: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.mono,
  },
  cellText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
