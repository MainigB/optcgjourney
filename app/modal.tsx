import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const BRAND = '#8E7D55';

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 20 }}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ paddingRight: 8 }}>
          <Text style={{ fontSize: 48, color: BRAND }}>←</Text>
        </Pressable>
        <ThemedText type="title" style={{ flex: 1 }}>This is a modal</ThemedText>
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
