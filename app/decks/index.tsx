// app/decks/index.tsx
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Card, DeckAvatar, ScreenHeader, UI } from '../../components/ui';
import { aggregateDecks, loadTournaments, wrPercent } from '../../state/app';

// Fonts
import { NotoSans_700Bold, useFonts as useNoto } from '@expo-google-fonts/noto-sans';
import { Oswald_400Regular, useFonts as useOswald } from '@expo-google-fonts/oswald';

const BRAND = '#8E7D55';
const INK = UI?.color?.ink ?? '#0f172a';
const SUB = UI?.color?.sub ?? '#64748b';
const LINE = UI?.color?.line ?? '#e5e7eb';

export default function DecksList() {
  const [agg, setAgg] = useState<ReturnType<typeof aggregateDecks>>([]);

  async function refresh() {
    const list = await loadTournaments();
    setAgg(aggregateDecks(list));
  }
  useEffect(() => { refresh(); }, []);
  useFocusEffect(useCallback(() => { refresh(); }, []));

  const [oswaldLoaded] = useOswald({ Oswald_400Regular });
  const [notoLoaded] = useNoto({ NotoSans_700Bold });

  if (!oswaldLoaded || !notoLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'NotoSans_700Bold' }}>Carregando…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* HEADER fixo */}
      <View style={{ paddingBottom: 0 }}>
        <ScreenHeader title="Seus Decks" onBack={() => router.back()} brandColor={BRAND} />

        <View style={{ paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8 }}>
          <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>
            {agg.length} deck(s)
          </Text>
          {/* Linha fina como no detail */}
          <View style={{ height: 1, backgroundColor: LINE, position: 'absolute', left: 0, right: 0, bottom: 0 }} />
        </View>
      </View>

      {/* CONTEÚDO rolável no meio */}
      <View style={{ flex: 1 }}>
        {agg.length === 0 ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
            <Text style={{ color: SUB, textAlign: 'left', fontFamily: 'NotoSans_700Bold' }}>
              Ainda não há dados. Crie torneios na tela inicial.
            </Text>
          </View>
        ) : (
          <FlatList
            data={agg}
            keyExtractor={(d) => d.deck}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 }}
            renderItem={({ item }) => {
              const tone = item.wins > item.losses ? 'ok' : item.wins < item.losses ? 'bad' : 'mid';
              const wr = wrPercent(item.wins, item.losses);

              return (
                <Pressable
                  onPress={() => router.push(`/decks/${encodeURIComponent(item.deck)}`)}
                  android_ripple={{ color: '#00000010' }}
                  style={{ marginBottom: 12 }}
                >
                  <Card
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      overflow: 'hidden',
                      paddingVertical: 12,
                    }}
                  >
                    <DeckAvatar label={item.deck} tone={tone} size={64} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'NotoSans_700Bold', fontSize: 16 }} numberOfLines={1}>
                        {item.deck}
                      </Text>
                      <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold', marginTop: 2 }}>
                        {item.tournaments} torneio(s) · {item.rounds} partida(s)
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontFamily: 'NotoSans_700Bold' }}>
                        {item.wins}-{item.losses}
                      </Text>
                      <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>{wr}% WR</Text>
                    </View>
                    <Text style={{ color: SUB, marginLeft: 6, fontFamily: 'NotoSans_700Bold' }}>›</Text>
                  </Card>
                </Pressable>
              );
            }}
            bounces={false}
            overScrollMode="never"
            showsVerticalScrollIndicator
          />
        )}
      </View>

      {/* RODAPÉ fixo */}
      <View style={{ padding: 16, paddingTop: 12 }}>
        <Pressable
          onPress={() => router.back()}
          android_ripple={{ color: '#00000010' }}
          style={{
            height: 48,
            borderRadius: 0,
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: BRAND,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: BRAND, fontSize: 14, letterSpacing: 1, fontFamily: 'NotoSans_700Bold' }}>
            VOLTAR
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
