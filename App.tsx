import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import type { NavigationScreen, Container } from './src/types/docker';
import { useContainers } from './src/hooks/useContainers';
import { dockerService } from './src/services/docker';
import { Sidebar } from './src/components/Sidebar';
import { ContainersScreen } from './src/screens/ContainersScreen';
import { ContainerDetailScreen } from './src/screens/ContainerDetailScreen';
import { ImagesScreen } from './src/screens/ImagesScreen';
import { VolumesScreen } from './src/screens/VolumesScreen';
import { CleanupScreen } from './src/screens/CleanupScreen';
import { colors } from './src/theme/colors';

function App() {
  const [activeScreen, setActiveScreen] = useState<NavigationScreen>('containers');
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const { containers, refresh } = useContainers();

  useEffect(() => {
    dockerService.ping().then(({ connected, socketPath }) => {
      console.log(connected
        ? `Docker connected via ${socketPath}`
        : `Docker daemon unreachable at ${socketPath}`);
    }).catch((e) => console.warn('Docker ping failed:', e));
  }, []);

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
      />
      <View style={styles.content}>
        {showDetail ? (
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
  screenVisible: {
    flex: 1,
  },
  screenHidden: {
    display: 'none',
  },
});

export default App;
