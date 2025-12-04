// app/new.tsx
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Keyboard, Pressable, Text, TextInput, View } from 'react-native';
import { Card, ScreenHeader, UI } from '../components/ui';
import { DECKS } from '../data/decks';
import { loadTournaments, makeTournament, saveTournaments } from '../state/app';

// Fonts (mesmo padrão da Home)
import { NotoSans_700Bold, useFonts as useNoto } from '@expo-google-fonts/noto-sans';
import { Oswald_400Regular, useFonts as useOswald } from '@expo-google-fonts/oswald';

const BRAND = '#8E7D55';
const normalize = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const inputBase = {
  paddingHorizontal: 14,
  paddingVertical: 12,
  borderRadius: 0 as const,
  backgroundColor: 'transparent',
  borderBottomWidth: 1,
  borderBottomColor: UI.color.line,
  fontFamily: 'NotoSans_700Bold',
  color: UI.color.ink,
} as const;

export default function NewTournament() {
  const [name, setName] = useState('');
  const [deckInput, setDeckInput] = useState('');
  const [deckSelected, setDeckSelected] = useState<string | null>(null);
  const [showDeckList, setShowDeckList] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [deckFocused, setDeckFocused] = useState(false);

  const [oswaldLoaded] = useOswald({ Oswald_400Regular });
  const [notoLoaded] = useNoto({ NotoSans_700Bold });

  const isReady = Boolean(name.trim() && deckSelected);

  const deckOptions = useMemo(() => {
    const q = normalize(deckInput);
    if (!q) return DECKS.slice(0, 20);
    return DECKS.filter((opt) => normalize(opt).includes(q)).slice(0, 30);
  }, [deckInput]);

  async function addTournament() {
    if (!isReady) return;
    const existing = await loadTournaments();
    const t = makeTournament({ name: name.trim(), deck: deckSelected! });
    await saveTournaments([t, ...existing]);
    router.replace(`/t/${t.id}`);
    setTimeout(() => {
      setName('');
      setDeckInput('');
      setDeckSelected(null);
      setShowDeckList(false);
      Keyboard.dismiss();
    }, 0);
  }

  // Botões pill
  const btnBase = {
    width: '82%',
    height: 48 as const,
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
  const btnPrimary = { ...btnBase, backgroundColor: isReady ? BRAND : UI.color.mid };
  const btnSecondary = { ...btnBase, backgroundColor: '#f1f5f9', borderWidth: 2, borderColor: BRAND };

  if (!oswaldLoaded || !notoLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: UI.color.bg }}>
        <Text>Carregando…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: UI.color.bg }}>
      <ScreenHeader title="Adicionar torneio" onBack={() => router.back()} brandColor={BRAND} />

      {/* FORM */}
      <View style={{ flex: 1, padding: 16 }}>
        {/* Nome */}
        <Text style={{ marginBottom: 6, fontFamily: 'NotoSans_700Bold' }}>Nome do torneio</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="ex.: Torneio da Loja"
          placeholderTextColor="#475569"
          onFocus={() => setNameFocused(true)}
          onBlur={() => setNameFocused(false)}
          underlineColorAndroid="transparent"
          style={[
            inputBase,
            { marginBottom: 14 },
            nameFocused && { borderBottomColor: BRAND, borderBottomWidth: 2 },
          ]}
        />

        {/* Deck */}
        <Text style={{ marginBottom: 6, fontFamily: 'NotoSans_700Bold' }}>Deck usado</Text>
        <View style={{ position: 'relative' }}>
          <TextInput
            value={deckInput}
            onChangeText={(t) => {
              setDeckInput(t);
              setDeckSelected(null);
              setShowDeckList(true);
            }}
            placeholder="ex.: Roronoa Zoro (OP01)"
            placeholderTextColor="#475569"
            onFocus={() => {
              setShowDeckList(true);
              setDeckFocused(true);
            }}
            onBlur={() => setDeckFocused(false)}
            underlineColorAndroid="transparent"
            style={[
              inputBase,
              deckFocused && { borderBottomColor: BRAND, borderBottomWidth: 2 },
            ]}
          />

          {showDeckList && (
            <Card
              style={{
                position: 'absolute',
                top: 56,
                left: 0,
                right: 0,
                maxHeight: 260,
                padding: 0,
                overflow: 'hidden',
                zIndex: 10,
              }}
            >
              <FlatList
                keyboardShouldPersistTaps="handled"
                data={deckOptions}
                keyExtractor={(s) => s}
                showsVerticalScrollIndicator
                bounces={false}
                overScrollMode="never"
                style={{ maxHeight: 200 }}
                nestedScrollEnabled={true}
                scrollEventThrottle={16}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      setDeckInput(item);
                      setDeckSelected(item);
                      setShowDeckList(false);
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
                )}
              />
            </Card>
          )}
        </View>
      </View>

      <View style={{ paddingVertical: 16, gap: 12, paddingBottom: 40 }}>
        <Pressable
          onPress={addTournament}
          disabled={!isReady}
          android_ripple={{ color: '#ffffff22' }}
          style={({ pressed }) => [
            btnPrimary,
            pressed && isReady ? { opacity: 0.9, transform: [{ scale: 0.998 }] } : null,
          ]}
        >
          <Text
            style={{
              color: 'white',
              fontSize: 14,
              letterSpacing: 1,
              fontFamily: 'NotoSans_700Bold',
            }}
          >
            {isReady ? 'ADICIONAR TORNEIO' : 'PREENCHA OS CAMPOS'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          android_ripple={{ color: '#00000010' }}
          style={({ pressed }) => [btnSecondary, pressed && { opacity: 0.95, transform: [{ scale: 0.998 }] }]}
        >
          <Text style={{ color: BRAND, fontSize: 14, letterSpacing: 1, fontFamily: 'NotoSans_700Bold' }}>
            CANCELAR
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
