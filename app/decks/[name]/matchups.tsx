// app/decks/[name]/matchups.tsx
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Card, DeckAvatar, ScreenHeader, UI } from '../../../components/ui';
import { Tournament, deckKey, deckKeyExact, loadTournaments, matchupsForDeck } from '../../../state/app';

// Fonts
import { NotoSans_700Bold, useFonts as useNoto } from '@expo-google-fonts/noto-sans';
import { Oswald_400Regular, useFonts as useOswald } from '@expo-google-fonts/oswald';

const BRAND = '#8E7D55';
const INK = UI?.color?.ink ?? '#0f172a';
const SUB = UI?.color?.sub ?? '#64748b';
const LINE = UI?.color?.line ?? '#e5e7eb';

export default function DeckMatchupsList() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const deckName = decodeURIComponent(name || '');

  const [all, setAll] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const [oswaldLoaded] = useOswald({ Oswald_400Regular });
  const [notoLoaded] = useNoto({ NotoSans_700Bold });

  useEffect(() => {
    (async () => {
      setLoading(true);
      setAll(await loadTournaments());
      setLoading(false);
    })();
  }, [name]);

  if (!oswaldLoaded || !notoLoaded || loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'NotoSans_700Bold' }}>Carregando…</Text>
      </View>
    );
  }

  const matchups = matchupsForDeck(all, deckName);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* HEADER */}
      <View style={{ paddingBottom: 0 }}>
        <ScreenHeader title={`Matchups — ${deckName}`} onBack={() => router.back()} brandColor={BRAND} />
        <View style={{ paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8 }}>
          <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>
            {matchups.length} oponente(s)
          </Text>
          <View style={{ height: 1, backgroundColor: LINE, position: 'absolute', left: 0, right: 0, bottom: 0 }} />
        </View>
      </View>

      {/* LISTA */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 16 }}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        showsVerticalScrollIndicator
      >
        {matchups.length === 0 ? (
          <Card>
            <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>
              Sem dados de matchups ainda.
            </Text>
          </Card>
        ) : (
          <View style={{ gap: 12 }}>
            {matchups.map((item) => {
              const toneItem: 'ok' | 'bad' | 'mid' =
                item.wins > item.losses ? 'ok' : item.wins < item.losses ? 'bad' : 'mid';
              return (
                <Pressable
                  key={deckKeyExact(item.opponent)}
                  onPress={() =>
                    router.push({
                      pathname: '/decks/[name]/[opponent]',
                      params: {
                        name: deckName,
                        opponent: item.opponent,
                        oppk: deckKey(item.opponent),
                        dek: deckKey(deckName),
                      },
                    })
                  }
                  android_ripple={{ color: '#00000010' }}
                >
                  <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden', paddingVertical: 10 }}>
                    <DeckAvatar label={item.opponent} tone={toneItem} size={56} imgShiftY={8} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'NotoSans_700Bold' }} numberOfLines={1}>
                        {item.opponent}
                      </Text>
                      <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>
                        {item.rounds} partida(s)
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontFamily: 'NotoSans_700Bold' }}>
                        {item.wins}-{item.losses}
                      </Text>
                      <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>
                        {item.wr}% WR
                      </Text>
                    </View>
                    <Text style={{ color: SUB, marginLeft: 4, fontFamily: 'NotoSans_700Bold' }}>›</Text>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* RODAPÉ */}
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
