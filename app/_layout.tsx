// app/_layout.tsx
import { Stack } from 'expo-router';
import { useState } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomSplash } from '../components/custom-splash';
import { UI } from '../components/ui';

function InnerStack() {
  const insets = useSafeAreaInsets();
  const [splashFinished, setSplashFinished] = useState(false);

  if (!splashFinished) {
    return <CustomSplash onFinish={() => setSplashFinished(true)} />;
  }

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            backgroundColor: UI?.color?.bg ?? '#fff',
          },
        }}
      />
    </>
  );
}

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <InnerStack />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
