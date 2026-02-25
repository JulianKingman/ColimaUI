import React, { useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import type { NavigationScreen, Container } from './src/types/docker';
import { useContainers } from './src/hooks/useContainers';
import { useDockerConnection } from './src/hooks/useDockerConnection';
import { Sidebar } from './src/components/Sidebar';
import { ConnectionOverlay } from './src/components/ConnectionOverlay';
import { ContainersScreen } from './src/screens/ContainersScreen';
import { ContainerDetailScreen } from './src/screens/ContainerDetailScreen';
import { ImagesScreen } from './src/screens/ImagesScreen';
import { VolumesScreen } from './src/screens/VolumesScreen';
import { CleanupScreen } from './src/screens/CleanupScreen';
import { colors } from './src/theme/colors';

function App() {
  const [activeScreen, setActiveScreen] = useState<NavigationScreen>('containers');
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const { connected, starting, startError, startColima } = useDockerConnection();
  const { containers, refresh } = useContainers();

  const runningCount = containers.filter((c) => c.State === 'running').length;

  const handleNavigate = useCallback((screen: NavigationScreen) => {
    setActiveScreen(screen);
    setSelectedContainer(null);
  }, []);

  const handleSelectContainer = useCallback((container: Container) => {
    setSelectedContainer(container);
  }, []);

  const handleBackFromDetail = useCallback(() => {
    setSelectedContainer(null);
  }, []);

  const handleRefreshFromDetail = useCallback(() => {
    refresh();
  }, [refresh]);

  const showDetail = activeScreen === 'containers' && selectedContainer;

  return (
    <View style={styles.root}>
      <Sidebar
        active={activeScreen}
        onNavigate={handleNavigate}
        containerCount={containers.length}
        runningCount={runningCount}
        connected={connected}
      />
      <View style={styles.content}>
        {connected === null ? (
          <View style={styles.centerContent}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : connected === false ? (
          <ConnectionOverlay
            starting={starting}
            startError={startError}
            onStartColima={startColima}
          />
        ) : showDetail ? (
          <ContainerDetailScreen
            container={selectedContainer}
            onBack={handleBackFromDetail}
            onRefresh={handleRefreshFromDetail}
          />
        ) : (
          <>
            <View style={activeScreen === 'containers' ? styles.screenVisible : styles.screenHidden}>
              <ContainersScreen onSelectContainer={handleSelectContainer} />
            </View>
            <View style={activeScreen === 'images' ? styles.screenVisible : styles.screenHidden}>
              <ImagesScreen />
            </View>
            <View style={activeScreen === 'volumes' ? styles.screenVisible : styles.screenHidden}>
              <VolumesScreen />
            </View>
            <View style={activeScreen === 'cleanup' ? styles.screenVisible : styles.screenHidden}>
              <CleanupScreen />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenVisible: {
    flex: 1,
  },
  screenHidden: {
    display: 'none',
  },
});

export default App;
