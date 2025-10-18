// components/custom-splash.tsx
import { Image as ExpoImage } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';

SplashScreen.preventAutoHideAsync();

interface CustomSplashProps {
  onFinish: () => void;
}

export function CustomSplash({ onFinish }: CustomSplashProps) {
  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await SplashScreen.hideAsync();
        
        onFinish();
      } catch (e) {
        console.warn(e);
        await SplashScreen.hideAsync();
        onFinish();
      }
    }

    prepare();
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <ExpoImage
        source={require('../assets/images/bg-vertical.png')}
        style={styles.backgroundImage}
        contentFit="cover"
      />
      
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/op_tcg_icon_1024_ios.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  logo: {
    width: 200,
    height: 200,
  },
});
