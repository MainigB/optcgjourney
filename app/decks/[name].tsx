// app/decks/[name].tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  deckStats,
  deckKeyExact,
  loadTournaments,
  computeRecord,
  Tournament,
  matchupsForDeck,
  deckSplits,
  deckKey,
} from '../../state/app';
import { UI, Card, DeckAvatar, SplitTwo } from '../../components/ui';

// Fonts (padrão do app)
import { useFonts as useOswald, Oswald_400Regular } from '@expo-google-fonts/oswald';
import { useFonts as useNoto, NotoSans_700Bold } from '@expo-google-fonts/noto-sans';

const BRAND = '#8E7D55';

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
      setAll(await loadTournaments());
      setLoading(false);
    })();
  }, [name]);

  if (!oswaldLoaded || !notoLoaded || loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: UI.color.bg }}>
        <Text style={{ fontFamily: 'NotoSans_700Bold' }}>Carregando…</Text>
      </View>
    );
  }

  const filtered = all.filter((t) => t.deck === deckName);
  const { wins, losses, wr, tournaments } = deckStats(all, deckName);
  const tone: 'ok' | 'bad' | 'mid' = wins > losses ? 'ok' : wins < losses ? 'bad' : 'mid';
  const matchups = matchupsForDeck(all, deckName);
  const splits = deckSplits(all, deckName);

  // Botões pill (rodapé)
  const btnBase = {
    width: '82%',
    height: 48 as const,
    borderRadius: 999 as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    alignSelf: 'center' as const,
    overflow: 'hidden' as const,
    ...(UI.shadow ?? {
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
    }),
  };
  const btnPrimary = { ...btnBase, backgroundColor: BRAND };
  const btnSecondary = { ...btnBase, backgroundColor: '#fff', borderWidth: 2, borderColor: BRAND };

  return (
    <View style={{ flex: 1, backgroundColor: UI.color.bg }}>
      {/* TÍTULO */}
      <View style={{ paddingTop: 28 }}>
        <Text
          style={{
            fontSize: 28,
            textAlign: 'center',
            color: UI.color.ink,
            fontFamily: 'Oswald_400Regular',
            letterSpacing: 0.5,
          }}
        >
          Perfil do Deck
        </Text>
      </View>

      {/* CONTEÚDO */}
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 420,
          alignSelf: 'center',
          paddingHorizontal: 16,
          paddingTop: 12,
          gap: 12,
        }}
      >
        {/* Cabeçalho do deck */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <DeckAvatar label={deckName} tone={tone} size={72} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontFamily: 'NotoSans_700Bold' }} numberOfLines={1}>
                {deckName}
              </Text>
              <Text style={{ color: UI.color.sub, fontFamily: 'NotoSans_700Bold' }}>
                {tournaments} torneio(s)
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: 'NotoSans_700Bold' }}>
                {wins}-{losses}
              </Text>
              <Text style={{ color: UI.color.sub, fontFamily: 'NotoSans_700Bold' }}>{wr}% WR</Text>
            </View>
          </View>
        </Card>

        {/* Splits */}
        <Text style={{ fontFamily: 'NotoSans_700Bold', marginTop: 4 }}>Splits</Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            rowGap: 12,
            marginBottom: 4,
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

        {/* Matchups */}
        <Text style={{ fontFamily: 'NotoSans_700Bold', marginTop: 4 }}>Matchups</Text>
        {matchups.length === 0 ? (
          <Card>
            <Text style={{ color: UI.color.sub, fontFamily: 'NotoSans_700Bold' }}>
              Sem dados de matchups ainda.
            </Text>
          </Card>
        ) : (
          <FlatList
            data={matchups}
            keyExtractor={(m) => deckKeyExact(m.opponent)}
            contentContainerStyle={{ paddingBottom: 120 }}
            renderItem={({ item }) => {
              const toneItem: 'ok' | 'bad' | 'mid' =
                item.wins > item.losses ? 'ok' : item.wins < item.losses ? 'bad' : 'mid';
              return (
                <Pressable
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
                  style={{ marginBottom: 12 }}
                >
                  <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden', paddingVertical: 10 }}>
                    <DeckAvatar label={item.opponent} tone={toneItem} size={56} imgShiftY={8} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'NotoSans_700Bold' }} numberOfLines={1}>
                        {item.opponent}
                      </Text>
                      <Text style={{ color: UI.color.sub, fontFamily: 'NotoSans_700Bold' }}>
                        {item.rounds} partida(s)
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontFamily: 'NotoSans_700Bold' }}>
                        {item.wins}-{item.losses}
                      </Text>
                      <Text style={{ color: UI.color.sub, fontFamily: 'NotoSans_700Bold' }}>
                        {item.wr}% WR
                      </Text>
                    </View>
                    <Text style={{ color: UI.color.sub, marginLeft: 4, fontFamily: 'NotoSans_700Bold' }}>›</Text>
                  </Card>
                </Pressable>
              );
            }}
          />
        )}

        {/* Torneios com este deck */}
        <Text style={{ fontFamily: 'NotoSans_700Bold', marginTop: 4 }}>Torneios com este deck</Text>
        {filtered.length === 0 ? (
          <Card>
            <Text style={{ color: UI.color.sub, fontFamily: 'NotoSans_700Bold' }}>
              Sem torneios ainda.
            </Text>
          </Card>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(t) => t.id}
            contentContainerStyle={{ paddingBottom: 120 }}
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
                    <Text style={{ color: UI.color.sub, fontFamily: 'NotoSans_700Bold' }}>
                      {new Date(item.date).toLocaleDateString()} · {rec.wins}-{rec.losses}
                    </Text>
                  </Card>
                </Pressable>
              );
            }}
          />
        )}
      </View>

      {/* RODAPÉ: botões pill padrão */}
      <View style={{ paddingVertical: 48, gap: 12 }}>
        {/*<Pressable
          onPress={() => router.push('/new')}
          android_ripple={{ color: '#ffffff22' }}
          style={({ pressed }) => [btnPrimary, pressed && { opacity: 0.9, transform: [{ scale: 0.998 }] }]}
        >
          <Text style={{ color: 'white', fontSize: 14, letterSpacing: 1, fontFamily: 'NotoSans_700Bold' }}>
            ADD TOURNAMENT
          </Text>
        </Pressable>*/}

        <Pressable
          onPress={() => router.back()}
          android_ripple={{ color: '#00000010' }}
          style={({ pressed }) => [btnSecondary, pressed && { opacity: 0.95, transform: [{ scale: 0.998 }] }]}
        >
          <Text style={{ color: BRAND, fontSize: 14, letterSpacing: 1, fontFamily: 'NotoSans_700Bold' }}>
            VOLTAR
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
