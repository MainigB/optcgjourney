import { Link, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { ScreenHeader } from '../components/ui';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const BRAND = '#8E7D55';

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={{ alignSelf: 'stretch' }}>
        <ScreenHeader title="This is a modal" onBack={() => router.back()} brandColor={BRAND} />
      </View>
      
      <Link href="/" dismissTo style={styles.link}>
        <ThemedText type="link">Go to home screen</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
