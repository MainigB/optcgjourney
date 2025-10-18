// app/decks/[name]/[opponent].tsx
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Card, DeckAvatar, UI } from '../../../components/ui';
import { DECKS } from '../../../data/decks';
import { deckKey, loadTournaments, Tournament } from '../../../state/app';

import { NotoSans_700Bold, useFonts as useNoto } from '@expo-google-fonts/noto-sans';
import { Oswald_400Regular, useFonts as useOswald } from '@expo-google-fonts/oswald';

const BRAND = '#8E7D55';
const INK = UI?.color?.ink ?? '#0f172a';
const SUB = UI?.color?.sub ?? '#64748b';
const LINE = UI?.color?.line ?? '#e5e7eb';

type RItem = {
  id: string;
  num: number;
  result: 'win' | 'loss';
  order: 'first' | 'second';
  dice: 'won' | 'lost' | 'none';
  tournamentId: string;
  tournamentName: string;
  tournamentDate: number;
};
const pack = (W: number, L: number) => ({ wins: W, losses: L, rounds: W + L, wr: (W + L) ? Math.round((W / (W + L)) * 100) : 0 });

/* --- Cápsula de stats (Ordem / Dado) --- */
function StatPill({ label, w, l }: { label: string; w: number; l: number }) {
  const total = w + l;
  const wr = total ? Math.round((w / total) * 100) : 0;
  const toneColor = w > l ? UI.color.ok : w < l ? UI.color.bad : UI.color.mid;

  return (
    <View style={{
      flex: 1,
      borderWidth: 1,
      borderColor: UI.color.line,
      backgroundColor: UI.color.card,
      borderRadius: UI.radius.lg,
      padding: 12,
    }}>
      <Text style={{ fontFamily: 'NotoSans_700Bold', marginBottom: 6 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{
          width: 40, height: 40, borderRadius: 10,
          borderWidth: 3, borderColor: toneColor,
          backgroundColor: UI.color.ink,
          alignItems: 'center', justifyContent: 'center'
        }}>
          <Text style={{ color: 'white', fontFamily: 'NotoSans_700Bold' }}>{total || 0}</Text>
        </View>
        <View>
          <Text style={{ fontFamily: 'NotoSans_700Bold' }}>{w}-{l}</Text>
          <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>{wr}% WR</Text>
        </View>
      </View>
    </View>
  );
}

/* --- Célula compacta para a Matriz --- */
function MatrixCell({ title, w, l }: { title: string; w: number; l: number }) {
  const total = w + l;
  const wr = total ? Math.round((w / total) * 100) : 0;
  const toneColor = w > l ? UI.color.ok : w < l ? UI.color.bad : UI.color.mid;

  return (
    <Card style={{ flexBasis: '48%', padding: 12 }}>
      <Text style={{ fontFamily: 'NotoSans_700Bold', marginBottom: 6 }}>{title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{
          width: 34, height: 34, borderRadius: 8,
          borderWidth: 3, borderColor: toneColor,
          backgroundColor: UI.color.ink,
          alignItems: 'center', justifyContent: 'center'
        }}>
          <Text style={{ color: 'white', fontFamily: 'NotoSans_700Bold', fontSize: 12 }}>{total || 0}</Text>
        </View>
        <View>
          <Text style={{ fontFamily: 'NotoSans_700Bold' }}>{w}-{l}</Text>
          <Text style={{ color: SUB, fontSize: 12, fontFamily: 'NotoSans_700Bold' }}>{wr}% WR</Text>
        </View>
      </View>
    </Card>
  );
}

/* --- helper para obter o rótulo canônico a partir de uma key --- */
function canonicalFromKey(k: string, fallback: string) {
  const found = DECKS.find(d => deckKey(d) === k);
  return found ?? fallback;
}

export default function MatchupDetail() {
  const params = useLocalSearchParams<{ name: string; opponent: string; oppk?: string; dek?: string }>();
  const deckNameParam = decodeURIComponent(params.name || '');
  const opponentNameParam = decodeURIComponent(params.opponent || '');
  const meKeyParam  = params.dek  ? String(params.dek)  : deckKey(deckNameParam);
  const oppKeyParam = params.oppk ? String(params.oppk) : deckKey(opponentNameParam);

  const [all, setAll] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const [oswaldLoaded] = useOswald({ Oswald_400Regular });
  const [notoLoaded] = useNoto({ NotoSans_700Bold });

  useEffect(() => { (async () => {
    setLoading(true);
    setAll(await loadTournaments());
    setLoading(false);
  })(); }, [params.name, params.opponent, params.dek, params.oppk]);

  const rounds = useMemo<RItem[]>(() => {
    const out: RItem[] = [];
    for (const t of all) {
      if (deckKey(t.deck) !== meKeyParam) continue;
      for (const r of t.rounds ?? []) {
        if (deckKey(r.opponentLeader || '') !== oppKeyParam) continue;
        out.push({
          id: r.id, num: r.num, result: r.result, order: r.order, dice: r.dice,
          tournamentId: t.id, tournamentName: t.name, tournamentDate: t.date
        });
      }
    }
    out.sort((a, b) => (b.tournamentDate - a.tournamentDate) || (a.num - b.num));
    return out;
  }, [all, meKeyParam, oppKeyParam]);

  /* Labels vindos dos dados + normalização para o rótulo canônico (bate imagem) */
  const myLabelFromData = useMemo(() => {
    if (!rounds.length) return deckNameParam;
    const t0 = all.find(t => t.id === rounds[0].tournamentId);
    return t0?.deck ?? deckNameParam;
  }, [all, rounds, deckNameParam]);

  const oppLabelFromData = useMemo(() => {
    if (!rounds.length) return opponentNameParam;
    // se precisar, poderíamos decidir pelo mais frequente; primeiro round costuma bastar
    return (rounds as any)[0]?.opponentLeader ?? opponentNameParam;
  }, [rounds, opponentNameParam]);

  // Rótulos canônicos (garante mapeamento de imagem correto e exibição consistente)
  const myDisplay  = useMemo(() => canonicalFromKey(meKeyParam,  myLabelFromData),  [meKeyParam,  myLabelFromData]);
  const oppDisplay = useMemo(() => canonicalFromKey(oppKeyParam, oppLabelFromData), [oppKeyParam, oppLabelFromData]);

  const splits = useMemo(() => {
    let w = 0, l = 0;
    let o1w = 0, o1l = 0, o2w = 0, o2l = 0;
    let dw = 0, dl = 0, lw = 0, ll = 0;
    let fWonW = 0, fWonL = 0, fLostW = 0, fLostL = 0;
    let sWonW = 0, sWonL = 0, sLostW = 0, sLostL = 0;

    for (const r of rounds) {
      r.result === 'win' ? w++ : l++;
      if (r.order === 'first') (r.result === 'win' ? o1w++ : o1l++); else if (r.order === 'second') (r.result === 'win' ? o2w++ : o2l++);
      if (r.dice === 'won')  (r.result === 'win' ? dw++ : dl++);
      if (r.dice === 'lost') (r.result === 'win' ? lw++ : ll++);
      if (r.order === 'first'  && r.dice === 'won')  (r.result === 'win' ? fWonW++  : fWonL++);
      if (r.order === 'first'  && r.dice === 'lost') (r.result === 'win' ? fLostW++ : fLostL++);
      if (r.order === 'second' && r.dice === 'won')  (r.result === 'win' ? sWonW++  : sWonL++);
      if (r.order === 'second' && r.dice === 'lost') (r.result === 'win' ? sLostW++ : sLostL++);
    }

    return {
      total:       pack(w, l),
      orderFirst:  pack(o1w, o1l),
      orderSecond: pack(o2w, o2l),
      diceWon:     pack(dw, dl),
      diceLost:    pack(lw, ll),
      matrix: {
        firstWon:   pack(fWonW, fWonL),
        firstLost:  pack(fLostW, fLostL),
        secondWon:  pack(sWonW, sWonL),
        secondLost: pack(sLostW, sLostL),
      },
    };
  }, [rounds]);

  if (!oswaldLoaded || !notoLoaded || loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontFamily: 'NotoSans_700Bold' }}>Carregando…</Text>
      </View>
    );
  }

  const myTone: 'ok'|'bad'|'mid' = splits.total.wins > splits.total.losses ? 'ok' : splits.total.wins < splits.total.losses ? 'bad' : 'mid';
  const oppTone: 'ok'|'bad'|'mid' = myTone === 'ok' ? 'bad' : myTone === 'bad' ? 'ok' : 'mid';

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ paddingRight: 8 }}>
            <Text style={{ fontSize: 48, color: BRAND }}>←</Text>
          </Pressable>
          <Text style={{ fontSize: 22, color: INK, fontFamily: 'Oswald_400Regular', letterSpacing: 0.3, flex: 1 }}>
            Matchup — {deckNameParam} vs {opponentNameParam}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8 }}>
          <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>
            {rounds.length} partida(s) · {splits.total.wr}% WR
          </Text>
          <View style={{ height: 1, backgroundColor: LINE, position: 'absolute', left: 0, right: 0, bottom: 0 }} />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 16 }}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        showsVerticalScrollIndicator
      >
        <View style={{ gap: 12 }}>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1, alignItems: 'center', gap: 8 }}>
              <DeckAvatar label={myDisplay} tone={myTone} size={78} imgShiftY={10} />
              <View style={{ alignItems: 'center', maxWidth: 140 }}>
                <Text style={{ color: SUB, marginBottom: 2, fontFamily: 'NotoSans_700Bold' }}>Você</Text>
                <Text style={{ fontSize: 15, fontFamily: 'NotoSans_700Bold', textAlign: 'center' }} numberOfLines={2}>{deckNameParam}</Text>
              </View>
            </View>

            {/* Centro */}
            <View style={{ width: 64, alignItems: 'center', gap: 6 }}>
              <View style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: UI.color.ink, alignItems: 'center', justifyContent: 'center'
              }}>
                <Text style={{ color: 'white', fontFamily: 'NotoSans_700Bold' }}>vs</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontFamily: 'NotoSans_700Bold' }}>
                  {splits.total.wins}-{splits.total.losses}
                </Text>
                <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>{splits.total.wr}% WR</Text>
              </View>
            </View>

            {/* Oponente */}
            <View style={{ flex: 1, alignItems: 'center', gap: 8 }}>
              <DeckAvatar label={oppDisplay} tone={oppTone} size={78} imgShiftY={10} />
              <View style={{ alignItems: 'center', maxWidth: 140 }}>
                <Text style={{ color: SUB, marginBottom: 2, fontFamily: 'NotoSans_700Bold' }}>Oponente</Text>
                {/* <- Text explícito com o nome do deck do oponente */}
                <Text style={{ fontSize: 15, fontFamily: 'NotoSans_700Bold', textAlign: 'center' }} numberOfLines={2}>{oppDisplay}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* ===== Ordem ===== */}
        <Text style={{ fontFamily: 'NotoSans_700Bold' }}>Ordem</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <StatPill label="1️⃣ First"  w={splits.orderFirst.wins}  l={splits.orderFirst.losses} />
          <StatPill label="2️⃣ Second" w={splits.orderSecond.wins} l={splits.orderSecond.losses} />
        </View>

        {/* ===== Dado ===== */}
        <Text style={{ fontFamily: 'NotoSans_700Bold' }}>Dado</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <StatPill label="🎲 Won"  w={splits.diceWon.wins}  l={splits.diceWon.losses} />
          <StatPill label="🎲 Lost" w={splits.diceLost.wins} l={splits.diceLost.losses} />
        </View>

        {/* ===== Matriz (Ordem × Dado) — 2x2 compacto ===== */}
        <Text style={{ fontFamily: 'NotoSans_700Bold' }}>Matriz (Ordem × Dado)</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 }}>
          <MatrixCell title="1️⃣ + 🎲 Won"  w={splits.matrix.firstWon.wins}  l={splits.matrix.firstWon.losses} />
          <MatrixCell title="1️⃣ + 🎲 Lost" w={splits.matrix.firstLost.wins} l={splits.matrix.firstLost.losses} />
          <MatrixCell title="2️⃣ + 🎲 Won"  w={splits.matrix.secondWon.wins}  l={splits.matrix.secondWon.losses} />
          <MatrixCell title="2️⃣ + 🎲 Lost" w={splits.matrix.secondLost.wins} l={splits.matrix.secondLost.losses} />
        </View>

        {/* ===== Partidas ===== */}
        <Text style={{ fontFamily: 'NotoSans_700Bold' }}>Partidas</Text>
        {rounds.length === 0 ? (
          <Card><Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>Sem partidas ainda contra este deck.</Text></Card>
        ) : (
          <FlatList
            data={rounds}
            keyExtractor={(r) => r.id}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => (
              <Pressable onPress={() => router.push(`/t/${item.tournamentId}`)} android_ripple={{ color: '#00000010' }} style={{ marginBottom: 12 }}>
                <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: UI.color.ink, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Text style={{ color: 'white', fontWeight: '800' }}>{item.num}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'NotoSans_700Bold' }}>{item.tournamentName}</Text>
                    <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>
                      {new Date(item.tournamentDate).toLocaleDateString()} · {item.order === 'first' ? '1º' : '2º'} · {item.dice === 'won' ? 'dice ✓' : item.dice === 'lost' ? 'dice ✗' : 'dice -'}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: 'NotoSans_700Bold', color: item.result === 'win' ? UI.color.ok : UI.color.bad }}>
                    {item.result === 'win' ? 'W' : 'L'}
                  </Text>
                </Card>
              </Pressable>
            )}
          />
        )}
        </View>
      </ScrollView>

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
