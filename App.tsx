import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import type { NavigationScreen, Container } from './src/types/docker';
import { useContainers } from './src/hooks/useContainers';
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

  const renderContent = () => {
    // Container detail overlay
    if (activeScreen === 'containers' && selectedContainer) {
      return (
        <ContainerDetailScreen
          container={selectedContainer}
          onBack={handleBackFromDetail}
          onRefresh={handleRefreshFromDetail}
        />
      );
    }

    switch (activeScreen) {
      case 'containers':
        return (
          <ContainersScreen onSelectContainer={handleSelectContainer} />
        );
      case 'images':
        return <ImagesScreen />;
      case 'volumes':
        return <VolumesScreen />;
      case 'cleanup':
        return <CleanupScreen />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.root}>
      <Sidebar
        active={activeScreen}
        onNavigate={handleNavigate}
        containerCount={containers.length}
        runningCount={runningCount}
      />
      <View style={styles.content}>{renderContent()}</View>
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
});

export default App;
