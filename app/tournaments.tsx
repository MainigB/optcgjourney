// app/tournaments.tsx
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { Card, Chip, DeckAvatar, UI } from '../components/ui';
import { computeRecord, deleteTournament, loadTournaments, Tournament } from '../state/app';

// >>> Fonts
import { NotoSans_700Bold, useFonts as useNoto } from '@expo-google-fonts/noto-sans';

function Tag({ label }: { label: string }) {
  return <Chip label={label} />;
}

const CARD_H = 96;

function TournamentCard({ t, onDelete }: { t: Tournament; onDelete: () => void }) {
  const rec = computeRecord(t);
  const tone = rec.wins > rec.losses ? 'ok' : rec.wins < rec.losses ? 'bad' : 'mid';

  const handleLongPress = () => {
    Alert.alert(
      'Deletar Torneio',
      `Tem certeza que deseja deletar "${t.name || '(sem nome)'}"? Todas as informações serão perdidas.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteTournament(t.id);
            if (success) {
              onDelete();
            }
          },
        },
      ]
    );
  };

  return (
    <Pressable 
      onPress={() => router.push(`/t/${t.id}`)} 
      onLongPress={handleLongPress}
      android_ripple={{ color: '#00000010' }}
      delayLongPress={500}
    >
      <Card
        style={{
          height: CARD_H,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginBottom: 8,
          overflow: 'hidden',
        }}
      >
        <DeckAvatar label={t.deck} tone={tone} size={72} imgShiftY={-6} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ fontSize: 18, fontFamily: 'NotoSans_700Bold' }}>
            {t.name || '(sem nome)'}
          </Text>
          <Text style={{ color: UI.color.sub, marginTop: 2, fontFamily: 'NotoSans_700Bold' }}>
            {new Date(t.date).toLocaleDateString()}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            {t.set ? <Tag label={t.set} /> : null}
            {t.type ? <Tag label={t.type} /> : null}
          </View>
        </View>
        <Text style={{ color: UI.color.sub, fontFamily: 'NotoSans_700Bold' }}>›</Text>
      </Card>
    </Pressable>
  );
}

export default function TournamentsScreen() {
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  // Load fonts
  const [notoLoaded] = useNoto({ NotoSans_700Bold });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await loadTournaments();
      // Ordenar por data (mais recente primeiro)
      setTournaments([...data].sort((a, b) => b.date - a.date));
      setLoading(false);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const data = await loadTournaments();
        setTournaments([...data].sort((a, b) => b.date - a.date));
      })();
    }, [])
  );

  const reloadTournaments = async () => {
    const data = await loadTournaments();
    setTournaments([...data].sort((a, b) => b.date - a.date));
  };

  if (!notoLoaded || loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: UI.color.bg }}>
        <Text style={{ fontFamily: notoLoaded ? 'NotoSans_700Bold' : undefined }}>Carregando…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: UI.color.bg }}>
      <Stack.Screen
        options={{
          title: 'Torneios',
          headerStyle: { backgroundColor: UI.color.bg },
          headerTintColor: UI.color.ink,
          headerTitleStyle: { fontFamily: 'NotoSans_700Bold' },
          headerShown: true,
          headerBackVisible: true,
          headerBackTitle: 'Voltar',
        }}
      />
      
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 420,
          alignSelf: 'center',
          padding: 16,
        }}
      >
        {tournaments.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: UI.color.sub, fontFamily: 'NotoSans_700Bold', fontSize: 16 }}>
              Sem torneios ainda.
            </Text>
            <Text style={{ color: UI.color.sub, fontFamily: 'NotoSans_700Bold', fontSize: 14, marginTop: 4 }}>
              Adicione seu primeiro torneio!
            </Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <Text style={{ 
              fontSize: 16, 
              color: UI.color.sub, 
              fontFamily: 'NotoSans_700Bold',
              marginBottom: 12
            }}>
              {tournaments.length} {tournaments.length === 1 ? 'torneio' : 'torneios'}
            </Text>
            <FlatList
              data={tournaments}
              keyExtractor={(t) => t.id}
              renderItem={({ item }) => <TournamentCard t={item} onDelete={reloadTournaments} />}
              showsVerticalScrollIndicator={true}
              bounces={true}
            />
          </View>
        )}
      </View>
    </View>
  );
}

