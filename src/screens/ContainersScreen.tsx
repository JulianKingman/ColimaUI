import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import type { Container } from '../types/docker';
import { useContainers } from '../hooks/useContainers';
import { dockerService } from '../services/docker';
import { SearchBar } from '../components/SearchBar';
import { SectionHeader } from '../components/SectionHeader';
import { ContainerRow } from '../components/ContainerRow';
import { EmptyState } from '../components/EmptyState';
import { colors, spacing } from '../theme/colors';

interface Props {
  onSelectContainer: (container: Container) => void;
}

export function ContainersScreen({ onSelectContainer }: Props) {
  const { containers, projects, standalone, loading, refresh } = useContainers();
  const [search, setSearch] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [groupActionLoading, setGroupActionLoading] = useState<string | null>(null);

  const toggleSection = useCallback((name: string) => {
    setCollapsedSections((prev) => ({ ...prev, [name]: !prev[name] }));
  }, []);

  const handleAction = useCallback(
    async (action: () => Promise<boolean>, containerId: string) => {
      setActionLoading(containerId);
      try {
        await action();
        await refresh();
      } finally {
        setActionLoading(null);
      }
    },
    [refresh],
  );

  const handleGroupAction = useCallback(
    async (
      action: (id: string) => Promise<boolean>,
      groupContainers: Container[],
      groupName: string,
    ) => {
      if (groupContainers.length === 0) {return;}
      setGroupActionLoading(groupName);
      try {
        await Promise.all(groupContainers.map((c) => action(c.Id)));
        await refresh();
      } finally {
        setGroupActionLoading(null);
      }
    },
    [refresh],
  );

  const filterContainers = useCallback(
    (list: Container[]) => {
      if (!search) {return list;}
      const q = search.toLowerCase();
      return list.filter(
        (c) =>
          c.Names.some((n) => n.toLowerCase().includes(q)) ||
          c.Image.toLowerCase().includes(q) ||
          c.State.toLowerCase().includes(q),
      );
    },
    [search],
  );

  const totalFiltered = filterContainers(containers).length;
  const runningCount = containers.filter((c) => c.State === 'running').length;

  if (loading && containers.length === 0) {
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
            <Text style={styles.title}>Containers</Text>
            <Text style={styles.subtitle}>
              {runningCount} running, {containers.length - runningCount} stopped
            </Text>
          </View>
        </View>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Filter containers by name, image, or status..."
          resultCount={search ? totalFiltered : undefined}
        />
      </View>

      {/* Container list */}
      <ScrollView style={styles.list}>
        {projects.map((project) => {
          const filtered = filterContainers(project.containers);
          if (filtered.length === 0) {return null;}
          const collapsed = collapsedSections[project.name];
          const projectRunning = filtered.filter(
            (c) => c.State === 'running',
          ).length;

          return (
            <View key={project.name}>
              <SectionHeader
                title={project.name}
                collapsed={collapsed}
                onToggle={() => toggleSection(project.name)}
                runningCount={projectRunning}
                totalCount={filtered.length}
                hasRunning={projectRunning > 0}
                onStopAll={() =>
                  handleGroupAction(
                    (id) => dockerService.stopContainer(id),
                    filtered,
                    project.name,
                  )
                }
                onRestartAll={() =>
                  handleGroupAction(
                    (id) => dockerService.restartContainer(id),
                    filtered,
                    project.name,
                  )
                }
                onStartAll={() =>
                  handleGroupAction(
                    (id) => dockerService.startContainer(id),
                    filtered,
                    project.name,
                  )
                }
                onRemoveAll={() =>
                  handleGroupAction(
                    (id) => dockerService.removeContainer(id),
                    filtered,
                    project.name,
                  )
                }
                actionLoading={groupActionLoading === project.name}
              />
              {!collapsed &&
                filtered.map((container) => (
                  <ContainerRow
                    key={container.Id}
                    container={container}
                    onPress={() => onSelectContainer(container)}
                    onStart={() =>
                      handleAction(
                        () => dockerService.startContainer(container.Id),
                        container.Id,
                      )
                    }
                    onStop={() =>
                      handleAction(
                        () => dockerService.stopContainer(container.Id),
                        container.Id,
                      )
                    }
                    onRestart={() =>
                      handleAction(
                        () => dockerService.restartContainer(container.Id),
                        container.Id,
                      )
                    }
                    onRemove={() =>
                      handleAction(
                        () => dockerService.removeContainer(container.Id),
                        container.Id,
                      )
                    }
                  />
                ))}
            </View>
          );
        })}

        {/* Standalone containers */}
        {(() => {
          const filteredStandalone = filterContainers(standalone);
          const standaloneRunning = filteredStandalone.filter((c) => c.State === 'running').length;
          if (filteredStandalone.length === 0) {return null;}
          return (
          <View>
            <SectionHeader
              title="Standalone"
              collapsed={collapsedSections._standalone}
              onToggle={() => toggleSection('_standalone')}
              runningCount={standaloneRunning}
              totalCount={filteredStandalone.length}
              hasRunning={standaloneRunning > 0}
              onStopAll={() =>
                handleGroupAction(
                  (id) => dockerService.stopContainer(id),
                  filterContainers(standalone),
                  '_standalone',
                )
              }
              onRestartAll={() =>
                handleGroupAction(
                  (id) => dockerService.restartContainer(id),
                  filterContainers(standalone),
                  '_standalone',
                )
              }
              onStartAll={() =>
                handleGroupAction(
                  (id) => dockerService.startContainer(id),
                  filterContainers(standalone),
                  '_standalone',
                )
              }
              onRemoveAll={() =>
                handleGroupAction(
                  (id) => dockerService.removeContainer(id),
                  filterContainers(standalone),
                  '_standalone',
                )
              }
              actionLoading={groupActionLoading === '_standalone'}
            />
            {!collapsedSections._standalone &&
              filterContainers(standalone).map((container) => (
                <ContainerRow
                  key={container.Id}
                  container={container}
                  onPress={() => onSelectContainer(container)}
                  onStart={() =>
                    handleAction(
                      () => dockerService.startContainer(container.Id),
                      container.Id,
                    )
                  }
                  onStop={() =>
                    handleAction(
                      () => dockerService.stopContainer(container.Id),
                      container.Id,
                    )
                  }
                  onRestart={() =>
                    handleAction(
                      () => dockerService.restartContainer(container.Id),
                      container.Id,
                    )
                  }
                  onRemove={() =>
                    handleAction(
                      () => dockerService.removeContainer(container.Id),
                      container.Id,
                    )
                  }
                />
              ))}
          </View>
          );
        })()}

        {totalFiltered === 0 && (
          <EmptyState
            title="No containers found"
            subtitle={
              search
                ? 'Try a different search term'
                : 'No containers are running'
            }
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
  list: {
    flex: 1,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
