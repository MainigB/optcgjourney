// app/t/[id].tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, ScrollView, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  loadTournaments,
  addRoundToTournament,
  removeRound,
  setTournamentFinalized,
  Tournament,
  Round,
  computeRecord,
  Dice,
  Order,
  Result,
} from '../../state/app';
import { DECKS } from '../../data/decks';
import { UI, DeckAvatar } from '../../components/ui';

import { useFonts as useOswald, Oswald_400Regular } from '@expo-google-fonts/oswald';
import { useFonts as useNoto, NotoSans_700Bold } from '@expo-google-fonts/noto-sans';

const BRAND = '#8E7D55';
const INK = UI?.color?.ink ?? '#0f172a';
const SUB = UI?.color?.sub ?? '#64748b';
const LINE = UI?.color?.line ?? '#e5e7eb';
const MID = UI?.color?.mid ?? '#cbd5e1';
const SEG_FILL = '#8E939E'; // cinza cheio do figma
const PLACEHOLDER = '#9aa3af';

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function Segmented({
  options,
  value,
  onChange,
  trailing, // { label: string; onPress?: () => void }
  height = 44,
  disabled = false,
}: {
  options: { key: string; label: string; leadingLabel?: string }[];
  value: string | null;
  onChange: (k: string) => void;
  trailing?: { label: string; onPress?: () => void };
  height?: number;
  disabled?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: LINE,
        borderRadius: 0,
        height,
        overflow: 'hidden',
        backgroundColor: '#fff',
        opacity: disabled ? 0.6 : 1,
      }}
      pointerEvents={disabled ? 'none' : 'auto'}
    >
      {options.map((opt, i) => {
        const selected = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            android_ripple={{ color: '#00000010' }}
            disabled={disabled}
            style={{
              flex: 1,
              backgroundColor: selected ? SEG_FILL : '#fff',
              justifyContent: 'center',
              paddingHorizontal: 14,
              borderRightWidth: i < options.length - 1 || !!trailing ? 1 : 0,
              borderRightColor: LINE,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {opt.leadingLabel ? (
                <Text style={{ color: selected ? '#fff' : SUB, fontFamily: 'NotoSans_700Bold' }}>
                  {opt.leadingLabel}
                </Text>
              ) : null}
              <Text
                style={{
                  color: selected ? '#fff' : SUB,
                  letterSpacing: 1,
                  fontFamily: 'NotoSans_700Bold',
                }}
              >
                {opt.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
      {trailing ? (
        <Pressable
          onPress={trailing.onPress}
          android_ripple={{ color: '#00000010' }}
          disabled={disabled}
          style={{
            width: height,
            alignItems: 'center',
            justifyContent: 'center',
            borderLeftWidth: 1,
            borderLeftColor: LINE,
          }}
        >
          <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>{trailing.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function RowItem({ r }: { r: Round }) {
  const orderBadge = r.order === 'first' ? '1' : '2';
  const diceTxt = r.dice === 'won' ? 'W' : r.dice === 'lost' ? 'L' : '-';
  const resTxt = r.result === 'win' ? 'W' : 'L';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: LINE,
      }}
    >
      <Text style={{ width: 56, textAlign: 'center', fontFamily: 'NotoSans_700Bold' }}>{r.num}</Text>
      <Text numberOfLines={1} style={{ flex: 1, fontFamily: 'NotoSans_700Bold' }}>
        {r.opponentLeader || '-'}
      </Text>
      <Text style={{ width: 64, textAlign: 'center', fontFamily: 'NotoSans_700Bold' }}>{diceTxt}</Text>
      <Text style={{ width: 64, textAlign: 'center', fontFamily: 'NotoSans_700Bold' }}>{orderBadge}</Text>
      <Text
        style={{
          width: 64,
          textAlign: 'center',
          color: r.result === 'win' ? '#16a34a' : '#dc2626',
          fontFamily: 'NotoSans_700Bold',
        }}
      >
        {resTxt}
      </Text>
    </View>
  );
}

export default function TournamentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [t, setT] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  const [oppInput, setOppInput] = useState('');
  const [oppSelected, setOppSelected] = useState<string | null>(null);
  const [showOppList, setShowOppList] = useState(false);
  const [dice, setDice] = useState<Dice>('none');
  const [order, setOrder] = useState<Order | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const [finishOpen, setFinishOpen] = useState(false);

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

  const rec = useMemo(() => (t ? computeRecord(t) : { wins: 0, losses: 0 }), [t]);

  const oppOptions = useMemo(() => {
    const q = normalize(oppInput);
    if (!q) return DECKS.slice(0, 20);
    return DECKS.filter((s) => normalize(s).includes(q)).slice(0, 30);
  }, [oppInput]);

  async function addRound() {
    if (!t) return;
    if ((t as any).finalized) {
      Alert.alert('Torneio finalizado', 'Não é possível adicionar novos rounds.');
      return;
    }
    if (!oppSelected || !order || !result) {
      Alert.alert('Preencha todos os campos', 'Selecione líder, ordem e resultado.');
      return;
    }
    const updated = await addRoundToTournament(t.id, { opponentLeader: oppSelected, dice, order, result });
    if (updated) {
      setT(updated);
      setOppInput('');
      setOppSelected(null);
      setShowOppList(false);
      setDice('none');
      setOrder(null);
      setResult(null);
    }
  }

  const canSave = Boolean(oppSelected && order && result) && Boolean(t && !(t as any).finalized);

  if (!oswaldLoaded || !notoLoaded || loading || !t) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
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

  const disabled = (t as any).finalized === true;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* ====== FIXO (sem scroll): Header + Deck ====== */}
      <View style={{ flexShrink: 0, padding: 16, paddingBottom: 0 }}>
        {/* HEADER plano */}
        <View style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={{ paddingRight: 8 }}>
              <Text style={{ fontSize: 48, color: BRAND }}>←</Text>
            </Pressable>
            <Text style={{ fontSize: 22, color: INK, fontFamily: 'Oswald_400Regular', letterSpacing: 0.3, flex: 1 }}>
              {t.name}
            </Text>

            {(t as any).finalized ? (
              <View style={{ borderWidth: 1, borderColor: BRAND, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ color: BRAND, fontFamily: 'NotoSans_700Bold' }}>FINALIZADO</Text>
              </View>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>
              Resultado {rec.wins}-{rec.losses}
            </Text>
            <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>
              {new Date(t.date).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Linha do deck */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
          <DeckAvatar label={t.deck} tone={tone} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontFamily: 'NotoSans_700Bold', color: INK }}>{t.deck}</Text>
            <Text style={{ color: SUB, marginTop: 4, fontFamily: 'NotoSans_700Bold' }}>{t.name}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>Record</Text>
            <Text style={{ fontFamily: 'NotoSans_700Bold' }}>
              {rec.wins}-{rec.losses}
            </Text>
          </View>
        </View>
      </View>

      {/* ====== SCROLL APENAS NESTE MEIO: Aviso + Form + Tabela ====== */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {/* Aviso de bloqueio */}
        {(t as any).finalized ? (
          <View style={{ borderWidth: 1, borderColor: LINE, padding: 12, backgroundColor: '#f8fafc', marginTop: 6 }}>
            <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>
              Este torneio está finalizado. Adição/edição de rounds está bloqueada.
            </Text>
          </View>
        ) : null}

        {/* FORM plano */}
        <View style={{ marginTop: 8, opacity: disabled ? 0.6 : 1 }} pointerEvents={disabled ? 'none' : 'auto'}>
          {/* Título do round + limpar */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ fontSize: 16, fontFamily: 'NotoSans_700Bold' }}>
              Round {(t.rounds?.length ?? 0) + 1}
            </Text>
            <Pressable
              onPress={() => {
                setOppInput('');
                setOppSelected(null);
                setShowOppList(false);
                setDice('none');
                setOrder(null);
                setResult(null);
              }}
              hitSlop={10}
            >
              <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>LIMPAR</Text>
            </Pressable>
          </View>

          {/* Opponent leader */}
          <Text style={{ marginBottom: 6, fontFamily: 'NotoSans_700Bold' }}>Líder do oponente</Text>
          <View style={{ position: 'relative', marginBottom: 12 }}>
            <TextInput
              value={oppInput}
              onChangeText={(txt) => {
                setOppInput(txt);
                setOppSelected(null);
                setShowOppList(true);
              }}
              onFocus={() => setShowOppList(true)}
              placeholder="Ex.: Roronoa Zoro (OP12)"
              placeholderTextColor={PLACEHOLDER}
              editable={!disabled}
              style={{
                borderWidth: 1,
                borderColor: LINE,
                borderRadius: 0,
                paddingHorizontal: 12,
                paddingVertical: 12,
                fontFamily: 'NotoSans_700Bold',
                color: INK,
                backgroundColor: '#fff',
              }}
            />
            {showOppList && !disabled && (
              <View
                style={{
                  position: 'absolute',
                  top: 46,
                  left: 0,
                  right: 0,
                  maxHeight: 240,
                  borderWidth: 1,
                  borderColor: LINE,
                  borderTopWidth: 0,
                  backgroundColor: '#fff',
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
                      style={{ paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: LINE }}
                    >
                      <Text numberOfLines={1} style={{ fontFamily: 'NotoSans_700Bold' }}>
                        {item}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Dado */}
          <Text style={{ marginBottom: 6, fontFamily: 'NotoSans_700Bold' }}>Dado</Text>
          <Segmented
            value={dice === 'none' ? null : dice}
            onChange={(k) => setDice((k as Dice) || 'none')}
            options={[
              { key: 'won', label: 'VENCI' },
              { key: 'lost', label: 'PERDI' },
            ]}
            disabled={disabled}
          />

          {/* Ordem */}
          <View style={{ marginTop: 14 }}>
            <Text style={{ marginBottom: 6, fontFamily: 'NotoSans_700Bold' }}>Ordem</Text>
            <Segmented
              value={order ?? null}
              onChange={(k) => setOrder(k as Order)}
              options={[
                { key: 'first', label: 'PLAY' },
                { key: 'second', label: 'DRAW' },
              ]}
              disabled={disabled}
            />
          </View>

          {/* Resultado */}
          <View style={{ marginTop: 14 }}>
            <Text style={{ marginBottom: 6, fontFamily: 'NotoSans_700Bold' }}>Resultado</Text>
            <Segmented
              value={result ?? null}
              onChange={(k) => setResult(k as Result)}
              options={[
                { key: 'win', label: 'VENCI' },
                { key: 'loss', label: 'PERDI' },
              ]}
              disabled={disabled}
            />
          </View>

          {/* CTA flat */}
          <View style={{ marginTop: 16 }}>
            <Pressable
              onPress={addRound}
              disabled={!canSave}
              android_ripple={{ color: '#00000010' }}
              style={{
                height: 48,
                borderRadius: 0,
                backgroundColor: canSave ? BRAND : MID,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 14, letterSpacing: 1, fontFamily: 'NotoSans_700Bold' }}>
                ADICIONAR ROUND
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Tabela de rounds */}
        <View style={{ marginTop: 18 }}>
          <View
            style={{
              flexDirection: 'row',
              paddingVertical: 10,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: LINE,
              backgroundColor: '#f8fafc',
              paddingHorizontal: 12,
            }}
          >
            <Text style={{ width: 56, textAlign: 'center', fontFamily: 'NotoSans_700Bold' }}>Round</Text>
            <Text style={{ flex: 1, fontFamily: 'NotoSans_700Bold' }}>Opponent</Text>
            <Text style={{ width: 64, textAlign: 'center', fontFamily: 'NotoSans_700Bold' }}>Dice</Text>
            <Text style={{ width: 64, textAlign: 'center', fontFamily: 'NotoSans_700Bold' }}>Order</Text>
            <Text style={{ width: 64, textAlign: 'center', fontFamily: 'NotoSans_700Bold' }}>Result</Text>
          </View>

          {(t.rounds ?? []).length === 0 ? (
            <Text style={{ paddingVertical: 12, color: SUB, fontFamily: 'NotoSans_700Bold' }}>Sem rodadas ainda.</Text>
          ) : (
            (t.rounds ?? []).map((r) => <RowItem key={r.id} r={r} />)
          )}
        </View>
      </ScrollView>

      {/* ====== FIXO (sem scroll): Botões ====== */}
      <View style={{ padding: 16, paddingTop: 12 }}>
        <View style={{ gap: 10 }}>
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

          {/* FINALIZAR / REABRIR */}
          <Pressable
            onPress={() => setFinishOpen(true)}
            android_ripple={{ color: (t as any).finalized ? '#00000010' : '#ffffff22' }}
            style={{
              height: 48,
              borderRadius: 0,
              backgroundColor: (t as any).finalized ? '#fff' : BRAND,
              borderWidth: (t as any).finalized ? 1 : 0,
              borderColor: (t as any).finalized ? BRAND : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: (t as any).finalized ? BRAND : '#fff',
                fontSize: 14,
                letterSpacing: 1,
                fontFamily: 'NotoSans_700Bold',
              }}
            >
              {(t as any).finalized ? 'REABRIR TORNEIO' : 'FINALIZAR TORNEIO'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* MODAL de confirmação */}
      <Modal animationType="fade" transparent visible={finishOpen} onRequestClose={() => setFinishOpen(false)}>
        <View style={{ flex: 1, backgroundColor: '#00000055', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ width: '100%', maxWidth: 420, backgroundColor: '#fff', borderWidth: 1, borderColor: LINE }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: LINE }}>
              <Text style={{ fontFamily: 'NotoSans_700Bold', fontSize: 16 }}>
                {(t as any).finalized ? 'Reabrir torneio?' : 'Finalizar torneio?'}
              </Text>
            </View>

            <View style={{ padding: 16 }}>
              <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>
                {(t as any).finalized
                  ? 'Ao reabrir, você poderá adicionar novos rounds novamente.'
                  : 'Ao finalizar, não será possível adicionar novos rounds. Você pode reabrir depois se precisar.'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row' }}>
              <Pressable
                onPress={() => setFinishOpen(false)}
                android_ripple={{ color: '#00000010' }}
                style={{ flex: 1, height: 48, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderRightWidth: 1, borderColor: LINE }}
              >
                <Text style={{ fontFamily: 'NotoSans_700Bold', color: SUB }}>CANCELAR</Text>
              </Pressable>

              <Pressable
                onPress={async () => {
                  const next = await setTournamentFinalized(t.id, !(t as any).finalized);
                  if (next) setT(next);
                  setFinishOpen(false);
                }}
                android_ripple={{ color: '#00000010' }}
                style={{
                  flex: 1,
                  height: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderTopWidth: 1,
                  borderColor: LINE,
                  backgroundColor: (t as any).finalized ? '#fff' : BRAND,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'NotoSans_700Bold',
                    color: (t as any).finalized ? BRAND : '#fff',
                  }}
                >
                  {(t as any).finalized ? 'REABRIR' : 'FINALIZAR'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
