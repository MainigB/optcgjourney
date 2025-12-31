// app/index.tsx
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppLogo } from '../components/logo';
import { FeedbackModal } from '../components/feedback-modal';
import { UI } from '../components/ui';
import { t } from '../i18n';

// >>> Fonts
import { NotoSans_700Bold, useFonts as useNoto } from '@expo-google-fonts/noto-sans';
import { Oswald_400Regular, useFonts as useOswald } from '@expo-google-fonts/oswald';

const BRAND = '#8E7D55';

export default function Home() {
  // Load fonts
  const [oswaldLoaded] = useOswald({ Oswald_400Regular });
  const [notoLoaded] = useNoto({ NotoSans_700Bold });

  if (!oswaldLoaded || !notoLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: UI.color.bg }}>
        <Text style={{ fontFamily: oswaldLoaded ? 'NotoSans_700Bold' : undefined }}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: UI.color.bg }}>
      <FeedbackModal />
      {/* CONTEÚDO (título + lista) */}
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 420,
          alignSelf: 'center',
          padding: 16,
          paddingTop: 130,
          gap: 12,
        }}
      >
        <AppLogo size={130} style={{ marginBottom: 18 }} />
        {/* Título com OSWALD */}
        <Text
          style={{
            fontSize: 42,
            color: UI.color.ink,
            marginBottom: 6,
            textAlign: 'center',
            fontFamily: 'Oswald_400Regular',
            letterSpacing: 0.5,
          }}
        >
          OPTCG Journey
        </Text>
      </View>

      <View style={{ paddingVertical: 16, gap: 12 }}>
        <Pressable
          onPress={() => router.push('/new')}
          android_ripple={{ color: '#ffffff22' }}
          style={styles.btnPrimary}
        >
          <Text style={{ color: 'white', fontSize: 16, fontFamily: 'NotoSans_700Bold' }}>{t('home.addTournament')}</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/decks')}
          android_ripple={{ color: '#00000010' }}
          style={styles.btnSecondary}
        >
          <Text style={{ color: BRAND, fontSize: 16, fontFamily: 'NotoSans_700Bold' }}>{t('home.myDecks')}</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/tournaments' as any)}
          android_ripple={{ color: '#00000010' }}
          style={styles.btnSecondary}
        >
          <Text style={{ color: BRAND, fontSize: 16, fontFamily: 'NotoSans_700Bold' }}>{t('home.viewTournaments')}</Text>
        </Pressable>

                <Text
                  style={{
                    fontSize: 13,
                    color: UI.color.ink,
                    marginTop: 8,
                    textAlign: 'center',
                    fontFamily: 'NotoSans_700Regular',
                    opacity: 0.7,
                  }}
                >
                  by BRENIN ZIKA
                </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  btnBase: {
    width: '82%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  btnPrimary: {
    width: '82%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    backgroundColor: BRAND,
  },
  btnSecondary: {
    width: '82%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: BRAND,
  },
});
