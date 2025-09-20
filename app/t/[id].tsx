// app/t/[id].tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  loadTournaments,
  addRoundToTournament,
  removeRound,
  Tournament,
  Round,
  computeRecord,
  Dice,
  Order,
  Result,
} from '../../state/app';
import { DECKS } from '../../data/decks';
import { UI, Card, DeckAvatar } from '../../components/ui';

// Fonts (mesmo padrão do app)
import { useFonts as useOswald, Oswald_400Regular } from '@expo-google-fonts/oswald';
import { useFonts as useNoto, NotoSans_700Bold } from '@expo-google-fonts/noto-sans';

const BRAND = '#8E7D55';
const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// colunas da tabela
const COL = { round: 56, dice: 64, order: 64, result: 64 };

// Pill opcional (usa brand quando ativo)
function Pill({
  active,
  children,
  danger = false,
}: {
  active: boolean;
  children: React.ReactNode;
  danger?: boolean;
}) {
  const bg = active
    ? danger
      ? '#ffe4e6'
      : 'rgba(142,125,85,0.12)'
    : 'transparent';
  const border = danger ? '#fecaca' : active ? BRAND : UI.color.line;
  return (
    <View
      style={{
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: border,
        borderRadius: 999,
        backgroundColor: bg,
        alignItems: 'center',
      }}
    >
      <Text style={{ fontFamily: 'NotoSans_700Bold' }}>{children}</Text>
    </View>
  );
}

function RowItem({ r, onDelete }: { r: Round; onDelete: (id: string) => void }) {
  const orderBadge = r.order === 'first' ? '1' : '2';
  const diceTxt = r.dice === 'won' ? '🎲✓' : r.dice === 'lost' ? '🎲✗' : '🎲';
  const res = r.result === 'win' ? '✅' : '❌';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderColor: '#f1f5f9',
      }}
    >
      <Text style={{ width: COL.round, textAlign: 'center', fontFamily: 'NotoSans_700Bold' }}>
        {r.num}
      </Text>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ fontFamily: 'NotoSans_700Bold' }}>
          {r.opponentLeader || '-'}
        </Text>
      </View>
      <Text style={{ width: COL.dice, textAlign: 'center', fontFamily: 'NotoSans_700Bold' }}>
        {diceTxt}
      </Text>
      <Text style={{ width: COL.order, textAlign: 'center', fontFamily: 'NotoSans_700Bold' }}>
        {orderBadge}
      </Text>
      <Text
        style={{
          width: COL.result,
          textAlign: 'center',
          color: r.result === 'win' ? UI.color.ok : UI.color.bad,
          fontFamily: 'NotoSans_700Bold',
        }}
      >
        {res}
      </Text>
      {/* Excluir (se quiser reativar)
      <Pressable onPress={() => onDelete(r.id)} style={{ paddingHorizontal: 10 }}>
        <Text style={{ color: 'crimson', fontFamily: 'NotoSans_700Bold' }}>🗑️</Text>
      </Pressable>
      */}
    </View>
  );
}

export default function TournamentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [t, setT] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  // formulário
  const [oppInput, setOppInput] = useState('');
  const [oppSelected, setOppSelected] = useState<string | null>(null);
  const [showOppList, setShowOppList] = useState(false);
  const [dice, setDice] = useState<Dice>('none');
  const [order, setOrder] = useState<Order | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const [oswaldLoaded] = useOswald({ Oswald_400Regular });
  const [notoLoaded] = useNoto({ NotoSans_700Bold });

  useEffect(() => {
    (async () => {
      const list = await loadTournaments();
      const found = list.find((x) => x.id === id);
      setT(found ?? null);
      setLoading(false);
    })();
  }, [id]);

  const rec = useMemo(
    () => (t ? computeRecord(t) : { wins: 0, losses: 0 }),
    [t]
  );

  const oppOptions = useMemo(() => {
    const q = normalize(oppInput);
    if (!q) return DECKS.slice(0, 20);
    return DECKS.filter((s) => normalize(s).includes(q)).slice(0, 30);
  }, [oppInput]);

  async function addRound() {
    if (!t) return;
    if (!oppSelected || !order || !result) {
      Alert.alert(
        'Preencha todos os campos',
        'Selecione o líder do oponente, a ordem (1º/2º) e o resultado (W/L).'
      );
      return;
    }
    const updated = await addRoundToTournament(t.id, {
      opponentLeader: oppSelected,
      dice,
      order,
      result,
    });
    if (updated) {
      setT(updated);
      // limpa form
      setOppInput('');
      setOppSelected(null);
      setShowOppList(false);
      setDice('none');
      setOrder(null);
      setResult(null);
    }
  }

  async function deleteRound(roundId: string) {
    if (!t) return;
    const updated = await removeRound(t.id, roundId);
    if (updated) setT(updated);
  }

  const canSave = Boolean(oppSelected && order && result);

  if (!oswaldLoaded || !notoLoaded || loading || !t) {
    return (
      <View
        style={{ flex: 1, backgroundColor: UI.color.bg, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ fontFamily: 'NotoSans_700Bold' }}>
          {loading ? 'Carregando…' : 'Torneio não encontrado.'}
        </Text>
        {!loading && (
          <Pressable onPress={() => router.back()} style={{ marginTop: 8 }}>
            <Text style={{ color: BRAND, fontFamily: 'NotoSans_700Bold' }}>← Voltar</Text>
          </Pressable>
        )}
      </View>
    );
  }

  const tone: 'ok' | 'bad' | 'mid' =
    rec.wins > rec.losses ? 'ok' : rec.wins < rec.losses ? 'bad' : 'mid';

  // Botões pill do rodapé
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
  const btnPrimary = { ...btnBase, backgroundColor: canSave ? BRAND : UI.color.mid };
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
          Torneio
        </Text>
      </View>

      {/* CONTEÚDO */}

        {/* Card do torneio */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <DeckAvatar label={t.deck} tone={tone} size={72} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontFamily: 'NotoSans_700Bold' }}>{t.name}</Text>
              <Text style={{ color: UI.color.sub, marginTop: 6, fontFamily: 'NotoSans_700Bold' }}>
                <Text style={{ color: UI.color.ink, fontFamily: 'NotoSans_700Bold' }}>{t.deck}</Text>
              </Text>
              <Text style={{ color: UI.color.sub, fontFamily: 'NotoSans_700Bold' }}>
                {new Date(t.date).toLocaleDateString()}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: UI.color.sub, fontFamily: 'NotoSans_700Bold' }}>Record</Text>
              <Text style={{ fontFamily: 'NotoSans_700Bold' }}>
                {rec.wins}-{rec.losses}
              </Text>
            </View>
          </View>
        </Card>
        <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }}
              >
        {/* Tabela de rounds */}
        <Card style={{ padding: 0 }}>
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#f8fafc',
              paddingVertical: 10,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              borderBottomWidth: 1,
              borderBottomColor: UI.color.line,
            }}
          >
            <Text style={{ width: COL.round, textAlign: 'center', fontFamily: 'NotoSans_700Bold' }}>
              Round
            </Text>
            <Text style={{ flex: 1, fontFamily: 'NotoSans_700Bold' }}>Opponent</Text>
            <Text style={{ width: COL.dice, textAlign: 'center', fontFamily: 'NotoSans_700Bold' }}>
              Dice
            </Text>
            <Text style={{ width: COL.order, textAlign: 'center', fontFamily: 'NotoSans_700Bold' }}>
              Order
            </Text>
            <Text style={{ width: COL.result, textAlign: 'center', fontFamily: 'NotoSans_700Bold' }}>
              Result
            </Text>
          </View>

          {(t.rounds ?? []).length === 0 ? (
            <Text style={{ padding: 12, color: UI.color.sub, fontFamily: 'NotoSans_700Bold' }}>
              Sem rodadas ainda.
            </Text>
          ) : (
            <View>
              {(t.rounds ?? []).map((item) => (
                <RowItem key={item.id} r={item} onDelete={deleteRound} />
              ))}
            </View>
          )}
        </Card>

        {/* Form: adicionar rodada */}
        <Card>
          <Text style={{ fontSize: 18, marginBottom: 8, fontFamily: 'NotoSans_700Bold' }}>
            Round {(t.rounds?.length ?? 0) + 1}
          </Text>

          {/* Opponent */}
          <Text style={{ marginBottom: 6, fontFamily: 'NotoSans_700Bold' }}>Opponent Leader</Text>
          <View style={{ position: 'relative', marginBottom: 10 }}>
            <TextInput
              value={oppInput}
              onChangeText={(txt) => {
                setOppInput(txt);
                setOppSelected(null);
                setShowOppList(true);
              }}
              onFocus={() => setShowOppList(true)}
              placeholder="ex.: Monkey D. Luffy (OP11)"
              placeholderTextColor="#475569"
              style={{
                borderWidth: 1,
                borderColor: UI.color.line,
                borderRadius: UI.radius.lg,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontFamily: 'NotoSans_700Bold',
                color: UI.color.ink,
              }}
            />
            {showOppList && (
              <Card
                style={{
                  position: 'absolute',
                  top: 56,
                  left: 0,
                  right: 0,
                  maxHeight: 250,
                  padding: 0,
                  overflow: 'hidden',
                  zIndex: 10,
                }}
              >
                <ScrollView keyboardShouldPersistTaps="handled">
                  {oppOptions.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => {
                        setOppInput(item);
                        setOppSelected(item);
                        setShowOppList(false);
                      }}
                      android_ripple={{ color: '#0000000d' }}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: UI.color.line,
                      }}
                    >
                      <Text numberOfLines={1} style={{ fontFamily: 'NotoSans_700Bold' }}>
                        {item}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </Card>
            )}
          </View>

          {/* Dice */}
          <Text style={{ marginBottom: 6, fontFamily: 'NotoSans_700Bold' }}>Dice</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <Pressable onPress={() => setDice(dice === 'won' ? 'none' : 'won')} style={{ flex: 1 }}>
              <Pill active={dice === 'won'}>🎲 W</Pill>
            </Pressable>
            <Pressable onPress={() => setDice(dice === 'lost' ? 'none' : 'lost')} style={{ flex: 1 }}>
              <Pill active={dice === 'lost'} danger>
                🎲 L
              </Pill>
            </Pressable>
          </View>

          {/* Order */}
          <Text style={{ marginBottom: 6, fontFamily: 'NotoSans_700Bold' }}>Ordem</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <Pressable onPress={() => setOrder(order === 'first' ? null : 'first')} style={{ flex: 1 }}>
              <Pill active={order === 'first'}>1️⃣</Pill>
            </Pressable>
            <Pressable onPress={() => setOrder(order === 'second' ? null : 'second')} style={{ flex: 1 }}>
              <Pill active={order === 'second'}>2️⃣</Pill>
            </Pressable>
          </View>

          {/* Result */}
          <Text style={{ marginBottom: 6, fontFamily: 'NotoSans_700Bold' }}>Resultado</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={() => setResult(result === 'win' ? null : 'win')} style={{ flex: 1 }}>
              <Pill active={result === 'win'}>Venci ✅</Pill>
            </Pressable>
            <Pressable onPress={() => setResult(result === 'loss' ? null : 'loss')} style={{ flex: 1 }}>
              <Pill active={result === 'loss'} danger>
                Perdi ❌
              </Pill>
            </Pressable>
          </View>
        </Card>
      </ScrollView>

      {/* RODAPÉ: botões pill iguais ao resto do app */}
      <View style={{ paddingVertical: 16, gap: 12 }}>
        <Pressable
          onPress={addRound}
          disabled={!canSave}
          android_ripple={{ color: '#ffffff22' }}
          style={({ pressed }) => [btnPrimary, pressed && canSave ? { opacity: 0.9, transform: [{ scale: 0.998 }] } : null]}
        >
          <Text style={{ color: 'white', fontSize: 14, letterSpacing: 1, fontFamily: 'NotoSans_700Bold' }}>
            ADD ROUND
          </Text>
        </Pressable>

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
