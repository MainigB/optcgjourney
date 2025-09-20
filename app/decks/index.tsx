// app/decks/index.tsx (ou app/decks/lista.tsx — ajuste o caminho conforme seu roteamento)
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { aggregateDecks, loadTournaments, wrPercent } from '../../state/app';
import { router, useFocusEffect } from 'expo-router';
import { UI, Card, DeckAvatar } from '../../components/ui';

// Fonts (mesmo padrão do app)
import { useFonts as useOswald, Oswald_400Regular } from '@expo-google-fonts/oswald';
import { useFonts as useNoto, NotoSans_700Bold } from '@expo-google-fonts/noto-sans';

const BRAND = '#8E7D55';

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

  if (!oswaldLoaded || !notoLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: UI.color.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Carregando…</Text>
      </View>
    );
  }

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
          Seus Decks
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
        }}
      >
        {agg.length === 0 ? (
          <Text style={{ color: UI.color.sub, textAlign: 'center', fontFamily: 'NotoSans_700Bold' }}>
            Ainda não há dados. Crie torneios na tela inicial.
          </Text>
        ) : (
          <FlatList
            data={agg}
            keyExtractor={(d) => d.deck}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }} // espaço pros botões do rodapé
            renderItem={({ item }) => {
              const tone = item.wins > item.losses ? 'ok' : item.wins < item.losses ? 'bad' : 'mid';
              const wr = wrPercent(item.wins, item.losses);

              return (
                <Pressable
                  onPress={() => router.push(`/decks/${encodeURIComponent(item.deck)}`)}
                  android_ripple={{ color: '#00000010' }}
                >
                  <Card
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 12,
                      overflow: 'hidden',
                      paddingVertical: 12,
                    }}
                  >
                    <DeckAvatar label={item.deck} tone={tone} size={64} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'NotoSans_700Bold', fontSize: 16 }} numberOfLines={1}>
                        {item.deck}
                      </Text>
                      <Text style={{ color: UI.color.sub, fontFamily: 'NotoSans_700Bold', marginTop: 2 }}>
                        {item.tournaments} torneio(s) · {item.rounds} partida(s)
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontFamily: 'NotoSans_700Bold' }}>
                        {item.wins}-{item.losses}
                      </Text>
                      <Text style={{ color: UI.color.sub, fontFamily: 'NotoSans_700Bold' }}>{wr}% WR</Text>
                    </View>
                  </Card>
                </Pressable>
              );
            }}
          />
        )}
      </View>

      {/* RODAPÉ: botões pill padrão*/}
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
