// app/decks/[name].tsx
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, Text, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { DeckExportImage } from '../../components/deck-export-image';
import { Card, DeckAvatar, ScreenHeader, SplitTwo, UI } from '../../components/ui';
import { t } from '../../i18n';
import {
    computeRecord,
    deckSplits,
    deckStats,
    loadTournaments,
    matchupsForDeck,
    Tournament,
} from '../../state/app';

// Fonts
import { NotoSans_700Bold, useFonts as useNoto } from '@expo-google-fonts/noto-sans';
import { Oswald_400Regular, useFonts as useOswald } from '@expo-google-fonts/oswald';

const BRAND = '#8E7D55';
const INK = UI?.color?.ink ?? '#0f172a';
const SUB = UI?.color?.sub ?? '#64748b';
const LINE = UI?.color?.line ?? '#e5e7eb';

export default function DeckProfile() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const deckName = decodeURIComponent(name || '');

  const [all, setAll] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const exportViewRef = useRef<ViewShot>(null);

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
        <Text style={{ fontFamily: 'NotoSans_700Bold' }}>{t('common.loading')}</Text>
      </View>
    );
  }

  const filtered = all.filter((t) => t.deck === deckName);
  const { wins, losses, wr, tournaments } = deckStats(all, deckName);
  const tone: 'ok' | 'bad' | 'mid' = wins > losses ? 'ok' : wins < losses ? 'bad' : 'mid';
  const matchups = matchupsForDeck(all, deckName);
  const splits = deckSplits(all, deckName);

  const totalRounds = splits.diceWon.rounds + splits.diceLost.rounds;

  const handleExportImage = async () => {
    try {
      setExporting(true);
      setShowExportModal(true);

      // Aguarda um pouco para garantir que o componente foi renderizado
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const viewShot = exportViewRef.current;
      if (!viewShot || typeof viewShot.capture !== 'function') {
        throw new Error(t('deck.errorRef'));
      }

      const uri = await viewShot.capture();
      
      if (!uri) {
        throw new Error(t('deck.errorCapture'));
      }

      // Verifica se o compartilhamento está disponível
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(t('deck.errorExport'), t('deck.errorShare'));
        setShowExportModal(false);
        return;
      }

      // Compartilha a imagem
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: t('deck.shareTitle'),
      });

      setShowExportModal(false);
    } catch (error) {
      console.error('Erro ao exportar imagem:', error);
      Alert.alert(t('deck.errorExport'), t('deck.errorExportMessage'));
      setShowExportModal(false);
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* HEADER fixo */}
      <View style={{ paddingBottom: 0, paddingHorizontal: 16 }}>
        <ScreenHeader title={t('deck.profile')} onBack={() => router.back()} brandColor={BRAND} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8 }}>
          <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>
            {t('deck.tournamentsCount', { count: tournaments })} · {t('deck.roundsCount', { count: totalRounds })} · {wr}% WR
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
              {t('deck.tournamentsCount', { count: tournaments })}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>{t('tournament.record')}</Text>
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
          <Text style={{ fontFamily: 'NotoSans_700Bold', marginBottom: 8 }}>{t('deck.splits')}</Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              rowGap: 12,
            }}
          >
            <SplitTwo
              title={t('deck.order')}
              aLabel="1st"
              aW={splits.orderFirst.wins}
              aL={splits.orderFirst.losses}
              bLabel="2nd"
              bW={splits.orderSecond.wins}
              bL={splits.orderSecond.losses}
            />

            <SplitTwo
              title={t('deck.dice')}
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
          <Text style={{ fontFamily: 'NotoSans_700Bold', marginBottom: 8 }}>{t('deck.matchups')}</Text>
          {matchups.length === 0 ? (
            <Card>
              <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>
                {t('deck.noMatchups')}
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
                  <Text style={{ fontFamily: 'NotoSans_700Bold' }}>{t('deck.viewAll')}</Text>
                  <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold', marginTop: 2 }}>
                    {t('deck.opponentsFaced', { count: matchups.length })}
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
        <Text style={{ fontFamily: 'NotoSans_700Bold', marginBottom: 8 }}>{t('deck.tournamentsWithDeck')}</Text>

        {filtered.length === 0 ? (
          <Card>
            <Text style={{ color: SUB, fontFamily: 'NotoSans_700Bold' }}>
              {t('deck.noTournaments')}
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
      <View style={{ padding: 16, paddingTop: 12, gap: 10 }}>
        <Pressable
          onPress={handleExportImage}
          disabled={exporting}
          android_ripple={{ color: '#00000010' }}
          style={{
            height: 48,
            borderRadius: 0,
            backgroundColor: exporting ? '#cbd5e1' : BRAND,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: exporting ? 0.6 : 1,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 14, letterSpacing: 1, fontFamily: 'NotoSans_700Bold' }}>
            {exporting ? t('common.exporting') : t('deck.exportImage')}
          </Text>
        </Pressable>

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
            {t('common.back')}
          </Text>
        </Pressable>
      </View>

      {/* Modal para renderizar a imagem de exportação */}
      <Modal
        visible={showExportModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={{ position: 'absolute', left: -2000, top: -2000, width: 1200, height: 2000, overflow: 'hidden' }}>
          <ViewShot ref={exportViewRef} options={{ format: 'png', quality: 1.0 }}>
            <DeckExportImage
              deckName={deckName}
              tournaments={filtered}
              matchups={matchups}
              wins={wins}
              losses={losses}
              wr={wr}
              totalTournaments={tournaments}
              orderFirstWr={splits.orderFirst.wr}
              orderSecondWr={splits.orderSecond.wr}
            />
          </ViewShot>
        </View>
      </Modal>
    </View>
  );
}
