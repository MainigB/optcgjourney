// app/index.tsx
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { AppLogo } from '../components/logo';
import { Card, Chip, DeckAvatar, UI } from '../components/ui';
import { computeRecord, loadTournaments, Tournament } from '../state/app';

// >>> Fonts
import { NotoSans_700Bold, useFonts as useNoto } from '@expo-google-fonts/noto-sans';
import { Oswald_400Regular, useFonts as useOswald } from '@expo-google-fonts/oswald';

function Tag({ label }: { label: string }) {
  return <Chip label={label} />;
}

// Layout consts
const CARD_H = 96;
const VISIBLE = 2.5;
const LIST_MAX_H = (CARD_H + 8) * VISIBLE + 24; // 8px margin + 24px padding
const BRAND = '#8E7D55';

function TournamentCard({ t }: { t: Tournament }) {
  const rec = computeRecord(t);
  const tone = rec.wins > rec.losses ? 'ok' : rec.wins < rec.losses ? 'bad' : 'mid';

  return (
    <Pressable onPress={() => router.push(`/t/${t.id}`)} android_ripple={{ color: '#00000010' }}>
      <Card
        style={{
          height: CARD_H,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginBottom: 8,
          overflow: 'hidden',
        }}
      >
        <DeckAvatar label={t.deck} tone={tone} size={72} imgShiftY={-6} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ fontSize: 18, fontFamily: 'NotoSans_700Bold' }}>
            {t.name || '(sem nome)'}
          </Text>
          <Text style={{ color: UI.color.sub, marginTop: 2, fontFamily: 'NotoSans_700Bold' }}>
            {new Date(t.date).toLocaleDateString()}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            {t.set ? <Tag label={t.set} /> : null}
            {t.type ? <Tag label={t.type} /> : null}
          </View>
        </View>
        <Text style={{ color: UI.color.sub, fontFamily: 'NotoSans_700Bold' }}>›</Text>
      </Card>
    </Pressable>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  // Load fonts
  const [oswaldLoaded] = useOswald({ Oswald_400Regular });
  const [notoLoaded] = useNoto({ NotoSans_700Bold });

  useEffect(() => {
    (async () => {
      setLoading(true);
      setTournaments(await loadTournaments());
      setLoading(false);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => setTournaments(await loadTournaments()))();
    }, [])
  );

  if (!oswaldLoaded || !notoLoaded || loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: UI.color.bg }}>
        <Text style={{ fontFamily: oswaldLoaded ? 'NotoSans_700Bold' : undefined }}>Carregando…</Text>
      </View>
    );
  }

  const recent = useMemo(
    () => [...tournaments].sort((a, b) => b.date - a.date).slice(0, 5),
    [tournaments]
  );

  // Botões (base)
  const btnBase = {
    width: '82%',
    height: 48 as const,              // altura consistente
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    alignSelf: 'center' as const,
    overflow: 'hidden' as const,      // ripple clipped
    // sombra leve
    ...(UI.shadow ?? {
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
    }),
  };

  // Primário (Add Tournament)
  const btnPrimary = {
    ...btnBase,
    backgroundColor: BRAND,
  };

  // Secundário invertido (Your Decks)
  const btnSecondary = {
    ...btnBase,
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: BRAND,
  };

  return (
    <View style={{ flex: 1, backgroundColor: UI.color.bg }}>
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

        <View style={{ marginTop: 6, marginBottom: 6 }}>
          <Text style={{ fontSize: 21, color: UI.color.ink, fontFamily: 'NotoSans_700Bold' }}>Últimos torneios</Text>
        </View>

        {recent.length === 0 ? (
          <View style={{ height: 120, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: UI.color.sub, fontFamily: 'NotoSans_700Bold', fontSize: 16 }}>
              Sem torneios ainda.
            </Text>
            <Text style={{ color: UI.color.sub, fontFamily: 'NotoSans_700Bold', fontSize: 14, marginTop: 4 }}>
              Adicione seu primeiro torneio!
            </Text>
          </View>
        ) : (
          <View>
            <View style={{ 
              width: '100%', 
              height: LIST_MAX_H,
              backgroundColor: UI.color.card,
              borderRadius: UI.radius.lg,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: UI.color.line
            }}>
              <FlatList
                data={recent}
                keyExtractor={(t) => t.id}
                renderItem={({ item }) => <TournamentCard t={item} />}
                contentContainerStyle={{ padding: 12 }}
                showsVerticalScrollIndicator={true}
                bounces={false}
                overScrollMode="never"
                nestedScrollEnabled={true}
                scrollEventThrottle={16}
              />
            </View>
            {recent.length > 3 && (
              <Text style={{ 
                textAlign: 'center', 
                color: UI.color.sub, 
                fontFamily: 'NotoSans_700Bold', 
                fontSize: 12, 
                marginTop: 8 
              }}>
                Deslize para ver mais torneios
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={{ paddingVertical: 16, gap: 12 }}>
        <Pressable
          onPress={() => router.push('/new')}
          android_ripple={{ color: '#ffffff22' }}
          style={btnPrimary}
        >
          <Text style={{ color: 'white', fontSize: 16, fontFamily: 'NotoSans_700Bold' }}>ADICIONAR TORNEIO</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/decks')}
          android_ripple={{ color: '#00000010' }}
          style={btnSecondary}
        >
          <Text style={{ color: BRAND, fontSize: 16, fontFamily: 'NotoSans_700Bold' }}>MEUS DECKS</Text>
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
