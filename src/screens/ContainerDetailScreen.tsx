import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Icon } from '../components/Icon';
import type { Container, ContainerInspect, ContainerLogEntry } from '../types/docker';
import { dockerService } from '../services/docker';
import { StatusIndicator } from '../components/StatusIndicator';
import { IconButton } from '../components/IconButton';
import { TabBar } from '../components/TabBar';
import { Badge } from '../components/Badge';
import { colors, fonts, spacing, radii, statusColor } from '../theme/colors';
import { TerminalView } from '../components/TerminalView';

interface Props {
  container: Container;
  onBack: () => void;
  onRefresh: () => void;
}

const detailTabs = [
  { key: 'logs', label: 'Logs' },
  { key: 'inspect', label: 'Inspect' },
  { key: 'terminal', label: 'Terminal' },
  { key: 'stats', label: 'Stats' },
];

export function ContainerDetailScreen({ container, onBack, onRefresh }: Props) {
  const [activeTab, setActiveTab] = useState('logs');
  const [logs, setLogs] = useState<ContainerLogEntry[]>([]);
  const [inspect, setInspect] = useState<ContainerInspect | null>(null);
  const [logsLoading, setLogsLoading] = useState(true);

  const name = container.Names[0]?.replace(/^\//, '') ?? container.Id.slice(0, 12);
  const stateColor = statusColor[container.State] ?? colors.textMuted;

  useEffect(() => {
    dockerService.getContainerLogs(container.Id).then((data) => {
      setLogs(data);
      setLogsLoading(false);
    });
    dockerService.inspectContainer(container.Id).then((data) => {
      setInspect(data);
    });
  }, [container.Id]);

  const handleStart = useCallback(async () => {
    await dockerService.startContainer(container.Id);
    onRefresh();
  }, [container.Id, onRefresh]);

  const handleStop = useCallback(async () => {
    await dockerService.stopContainer(container.Id);
    onRefresh();
  }, [container.Id, onRefresh]);

  const handleRestart = useCallback(async () => {
    await dockerService.restartContainer(container.Id);
    onRefresh();
  }, [container.Id, onRefresh]);

  const isRunning = container.State === 'running';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
          <Icon name="arrow-left" color={colors.accent} size={16} />
          <Text style={styles.backText}>Containers</Text>
        </TouchableOpacity>

        <View style={styles.headerMain}>
          <View style={styles.headerLeft}>
            <StatusIndicator state={container.State} size={10} />
            <View>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.image}>{container.Image}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Badge
              label={container.State.toUpperCase()}
              color={stateColor}
              bgColor={stateColor + '20'}
            />
            {isRunning ? (
              <>
                <IconButton
                  label="Stop"
                  onPress={handleStop}
                  variant="danger"
                  icon={<Icon name="stop" color={colors.error} size={14} />}
                />
                <IconButton
                  label="Restart"
                  onPress={handleRestart}
                  icon={<Icon name="restart" color={colors.textPrimary} size={14} />}
                />
              </>
            ) : (
              <IconButton
                label="Start"
                onPress={handleStart}
                variant="success"
                icon={<Icon name="play" color={colors.success} size={14} />}
              />
            )}
          </View>
        </View>

        {/* Quick info row */}
        <View style={styles.quickInfo}>
          <View style={styles.quickInfoItem}>
            <Text style={styles.quickInfoLabel}>ID</Text>
            <Text style={styles.quickInfoValue}>{container.Id.slice(0, 12)}</Text>
          </View>
          <View style={styles.quickInfoItem}>
            <Text style={styles.quickInfoLabel}>Status</Text>
            <Text style={styles.quickInfoValue}>{container.Status}</Text>
          </View>
          {container.Ports.filter((p) => p.PublicPort).length > 0 && (
            <View style={styles.quickInfoItem}>
              <Text style={styles.quickInfoLabel}>Ports</Text>
              <Text style={styles.quickInfoValue}>
                {container.Ports.filter((p) => p.PublicPort)
                  .map((p) => `${p.PublicPort}:${p.PrivatePort}`)
                  .join(', ')}
              </Text>
            </View>
          )}
          {Object.keys(container.NetworkSettings.Networks).length > 0 && (
            <View style={styles.quickInfoItem}>
              <Text style={styles.quickInfoLabel}>Network</Text>
              <Text style={styles.quickInfoValue}>
                {Object.keys(container.NetworkSettings.Networks).join(', ')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Tabs */}
      <TabBar tabs={detailTabs} active={activeTab} onSelect={setActiveTab} />

      {/* Tab content */}
      <View style={styles.tabContent}>
        {activeTab === 'logs' && (
          <LogsView logs={logs} loading={logsLoading} />
        )}
        {activeTab === 'inspect' && <InspectView inspect={inspect} />}
        {activeTab === 'terminal' && (
          isRunning ? (
            <TerminalView containerId={container.Id} containerName={name} />
          ) : (
            <TerminalPlaceholder name={name} />
          )
        )}
        {activeTab === 'stats' && <StatsPlaceholder />}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Logs sub-view
// ---------------------------------------------------------------------------

function LogsView({
  logs,
  loading,
}: {
  logs: ContainerLogEntry[];
  loading: boolean;
}) {
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = React.useRef<ScrollView>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      // Small delay so layout completes
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50);
    }
  }, [logs, autoScroll]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.logsContainer}>
      <View style={styles.logsToolbar}>
        <TouchableOpacity
          onPress={() => setAutoScroll(!autoScroll)}
          activeOpacity={0.7}
          style={styles.logsToggle}>
          <View
            style={[
              styles.logsToggleDot,
              { backgroundColor: autoScroll ? colors.success : colors.textMuted },
            ]}
          />
          <Text style={styles.logsToggleText}>Auto-scroll</Text>
        </TouchableOpacity>
        <Text style={styles.logsCount}>{logs.length} lines</Text>
      </View>
      <ScrollView ref={scrollRef} style={styles.logsScroll}>
        {logs.map((entry, idx) => {
          const time = entry.timestamp.split('T')[1]?.split('.')[0] ?? '';
          const isError = entry.stream === 'stderr';
          return (
            <View key={idx} style={styles.logLine}>
              <Text style={styles.logTimestamp}>{time}</Text>
              <Text
                style={[
                  styles.logMessage,
                  isError && styles.logMessageError,
                ]}
                numberOfLines={1}>
                {entry.message}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Inspect sub-view
// ---------------------------------------------------------------------------

function InspectView({ inspect }: { inspect: ContainerInspect | null }) {
  if (!inspect) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const sections = [
    {
      title: 'Configuration',
      items: [
        { label: 'Image', value: inspect.Config.Image },
        { label: 'Working Dir', value: inspect.Config.WorkingDir },
        {
          label: 'Command',
          value: inspect.Config.Cmd?.join(' ') ?? '-',
        },
        {
          label: 'Entrypoint',
          value: inspect.Config.Entrypoint?.join(' ') || '-',
        },
      ],
    },
    {
      title: 'Host Config',
      items: [
        {
          label: 'Memory Limit',
          value: inspect.HostConfig.Memory
            ? `${Math.round(inspect.HostConfig.Memory / 1024 / 1024)} MB`
            : 'No limit',
        },
        {
          label: 'CPU Shares',
          value: String(inspect.HostConfig.CpuShares),
        },
        {
          label: 'Restart Policy',
          value: inspect.HostConfig.RestartPolicy.Name || 'no',
        },
      ],
    },
    {
      title: 'Environment Variables',
      items: inspect.Config.Env.map((e) => {
        const [key, ...rest] = e.split('=');
        return { label: key, value: rest.join('=') };
      }),
    },
    {
      title: 'Mounts',
      items: inspect.Mounts.map((m) => ({
        label: m.Destination,
        value: `${m.Source} (${m.Type}, ${m.RW ? 'rw' : 'ro'})`,
      })),
    },
  ];

  return (
    <ScrollView style={styles.inspectScroll}>
      {sections.map((section) => (
        <View key={section.title} style={styles.inspectSection}>
          <Text style={styles.inspectSectionTitle}>{section.title}</Text>
          {section.items.map((item, idx) => (
            <View key={idx} style={styles.inspectRow}>
              <Text style={styles.inspectLabel}>{item.label}</Text>
              <Text style={styles.inspectValue} selectable>
                {item.value}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Terminal placeholder
// ---------------------------------------------------------------------------

function TerminalPlaceholder({ name }: { name: string }) {
  return (
    <View style={styles.terminalContainer}>
      <View style={styles.terminalBody}>
        <Text style={styles.terminalHint}>
          Container "{name}" is not running.{'\n'}
          Start the container to open a terminal session.
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stats placeholder
// ---------------------------------------------------------------------------

function StatsPlaceholder() {
  const mockStats = [
    { label: 'CPU Usage', value: '2.4%', bar: 0.024 },
    { label: 'Memory', value: '128 MB / 512 MB', bar: 0.25 },
    { label: 'Network I/O', value: '12.4 MB / 3.2 MB', bar: 0 },
    { label: 'Disk I/O', value: '45.6 MB / 12.1 MB', bar: 0 },
  ];

  return (
    <ScrollView style={styles.statsScroll}>
      {mockStats.map((stat) => (
        <View key={stat.label} style={styles.statRow}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
          {stat.bar > 0 && (
            <View style={styles.statBarBg}>
              <View
                style={[
                  styles.statBarFill,
                  { width: `${Math.max(stat.bar * 100, 2)}%` as any },
                ]}
              />
            </View>
          )}
        </View>
      ))}
      <Text style={styles.statsNote}>
        Live stats require the native Docker socket bridge.
        {'\n'}Showing simulated values.
      </Text>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  backText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '500',
  },
  headerMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  image: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.mono,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quickInfo: {
    flexDirection: 'row',
    gap: spacing.xl,
    flexWrap: 'wrap',
  },
  quickInfoItem: {
    gap: 2,
  },
  quickInfoLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickInfoValue: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.mono,
  },
  tabContent: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Logs
  logsContainer: {
    flex: 1,
  },
  logsToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  logsToggleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  logsToggleText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  logsCount: {
    color: colors.textMuted,
    fontSize: 11,
  },
  logsScroll: {
    flex: 1,
    backgroundColor: '#12100c',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  logLine: {
    flexDirection: 'row',
    paddingVertical: 1,
    gap: spacing.sm,
  },
  logTimestamp: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fonts.mono,
    width: 70,
  },
  logMessage: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fonts.mono,
    flex: 1,
  },
  logMessageError: {
    color: colors.error,
  },

  // Inspect
  inspectScroll: {
    flex: 1,
    padding: spacing.xl,
  },
  inspectSection: {
    marginBottom: spacing.xl,
  },
  inspectSectionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  inspectRow: {
    flexDirection: 'row',
    paddingVertical: spacing.xs + 1,
    gap: spacing.lg,
  },
  inspectLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.mono,
    width: 140,
  },
  inspectValue: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.mono,
    flex: 1,
  },

  // Terminal
  terminalContainer: {
    flex: 1,
  },
  terminalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  terminalTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.mono,
  },
  terminalBody: {
    flex: 1,
    backgroundColor: '#100e0a',
    padding: spacing.lg,
  },
  terminalPrompt: {
    color: colors.success,
    fontSize: 13,
    fontFamily: fonts.mono,
  },
  terminalHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.mono,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  terminalCursor: {
    color: colors.success,
    fontSize: 13,
    fontFamily: fonts.mono,
    marginTop: spacing.sm,
  },

  // Stats
  statsScroll: {
    flex: 1,
    padding: spacing.xl,
  },
  statRow: {
    marginBottom: spacing.xl,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.mono,
  },
  statBarBg: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  statBarFill: {
    height: 6,
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  statsNote: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xl,
    lineHeight: 20,
  },
});
