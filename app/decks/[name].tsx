// app/decks/[name].tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  deckStats,
  loadTournaments,
  computeRecord,
  Tournament,
  matchupsForDeck,
  deckSplits,
} from '../../state/app';
import { UI, Card, DeckAvatar, SplitTwo } from '../../components/ui';

// Fonts
import { useFonts as useOswald, Oswald_400Regular } from '@expo-google-fonts/oswald';
import { useFonts as useNoto, NotoSans_700Bold } from '@expo-google-fonts/noto-sans';

const BRAND = '#8E7D55';
const INK = UI?.color?.ink ?? '#0f172a';
const SUB = UI?.color?.sub ?? '#64748b';
const LINE = UI?.color?.line ?? '#e5e7eb';

export default function DeckProfile() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const deckName = decodeURIComponent(name || '');

  const [all, setAll] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const [oswaldLoaded] = useOswald({ Oswald_400Regular });
  const [notoLoaded] = useNoto({ NotoSans_700Bold });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await loadTournaments();
      setAll(data);
      setLoading(false);
    })();
  }, [name]);

  // early return SEM hooks depois
  if (!oswaldLoaded || !notoLoaded || loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontFamily: 'NotoSans_700Bold' }}>Carregando…</Text>
      </View>
    );
  }

  const filtered = all.filter((t) => t.deck === deckName);
  const { wins, losses, wr, tournaments } = deckStats(all, deckName);
  const tone: 'ok' | 'bad' | 'mid' = wins > losses ? 'ok' : wins < losses ? 'bad' : 'mid';
  const matchups = matchupsForDeck(all, deckName);
  const splits = deckSplits(all, deckName);

  const totalRounds = splits.diceWon.rounds + splits.diceLost.rounds;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* HEADER fixo */}
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ paddingRight: 8 }}>
            <Text style={{ fontSize: 48, color: BRAND }}>←</Text>
          </Pressable>
          <Text style={{ fontSize: 22, color: INK, fontFamily: 'Oswald_400Regular', letterSpacing: 0.3, flex: 1 }}>
            Perfil do Deck
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8 }}>
          <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>
            {tournaments} torneio(s) · {totalRounds} partida(s) · {wr}% WR
          </Text>
          <View style={{ height: 1, backgroundColor: LINE, position: 'absolute', left: 0, right: 0, bottom: 0 }} />
        </View>
      </View>

      {/* LINHA DO DECK */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
          <DeckAvatar label={deckName} tone={tone} size={64} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontFamily: 'NotoSans_700Bold', color: INK }} numberOfLines={1}>
              {deckName}
            </Text>
            <Text style={{ color: SUB, marginTop: 2, fontFamily: 'NotoSans_700Bold' }}>
              {tournaments} torneio(s)
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>Record</Text>
            <Text style={{ fontFamily: 'NotoSans_700Bold' }}>
              {wins}-{losses}
            </Text>
          </View>
        </View>
      </View>

      {/* CONTEÚDO NÃO-ROLÁVEL */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 12 }}>
        {/* Splits */}
        <View>
          <Text style={{ fontFamily: 'NotoSans_700Bold', marginBottom: 8 }}>Splits</Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              rowGap: 12,
            }}
          >
            <SplitTwo
              title="Ordem"
              aLabel="1st"
              aW={splits.orderFirst.wins}
              aL={splits.orderFirst.losses}
              bLabel="2nd"
              bW={splits.orderSecond.wins}
              bL={splits.orderSecond.losses}
            />

            <SplitTwo
              title="Dado"
              aLabel="Won"
              aW={splits.diceWon.wins}
              aL={splits.diceWon.losses}
              bLabel="Lost"
              bW={splits.diceLost.wins}
              bL={splits.diceLost.losses}
            />
          </View>
        </View>

        {/* Matchups -> botão para a nova tela */}
        <View>
          <Text style={{ fontFamily: 'NotoSans_700Bold', marginBottom: 8 }}>Matchups</Text>
          {matchups.length === 0 ? (
            <Card>
              <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>
                Sem dados de matchups ainda.
              </Text>
            </Card>
          ) : (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/decks/[name]/matchups',
                  params: { name: deckName },
                })
              }
              android_ripple={{ color: '#00000010' }}
            >
              <Card style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'NotoSans_700Bold' }}>Ver todos os matchups</Text>
                  <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold', marginTop: 2 }}>
                    {matchups.length} deck(s) enfrentado(s)
                  </Text>
                </View>
                <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>›</Text>
              </Card>
            </Pressable>
          )}
        </View>
      </View>

      {/* SÓ ESTA PARTE É ROLÁVEL */}
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}>
        <Text style={{ fontFamily: 'NotoSans_700Bold', marginBottom: 8 }}>Torneios com este deck</Text>

        {filtered.length === 0 ? (
          <Card>
            <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>
              Sem torneios ainda.
            </Text>
          </Card>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 12 }}
            overScrollMode="never"
            bounces={false}
            showsVerticalScrollIndicator
            renderItem={({ item }) => {
              const rec = computeRecord(item);
              return (
                <Pressable
                  onPress={() => router.push(`/t/${item.id}`)}
                  android_ripple={{ color: '#00000010' }}
                  style={{ marginBottom: 12 }}
                >
                  <Card style={{ overflow: 'hidden', paddingVertical: 10 }}>
                    <Text style={{ fontFamily: 'NotoSans_700Bold' }} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>
                      {new Date(item.date).toLocaleDateString()} · {rec.wins}-{rec.losses}
                    </Text>
                  </Card>
                </Pressable>
              );
            }}
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
