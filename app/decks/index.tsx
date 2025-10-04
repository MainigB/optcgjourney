// app/decks/index.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { aggregateDecks, loadTournaments, wrPercent } from '../../state/app';
import { router, useFocusEffect } from 'expo-router';
import { UI, Card, DeckAvatar } from '../../components/ui';

// Fonts
import { useFonts as useOswald, Oswald_400Regular } from '@expo-google-fonts/oswald';
import { useFonts as useNoto, NotoSans_700Bold } from '@expo-google-fonts/noto-sans';

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
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ paddingRight: 8 }}>
            <Text style={{ fontSize: 48, color: BRAND }}>←</Text>
          </Pressable>
          <Text style={{ fontSize: 22, color: INK, fontFamily: 'Oswald_400Regular', letterSpacing: 0.3, flex: 1 }}>
            Seus Decks
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8 }}>
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
