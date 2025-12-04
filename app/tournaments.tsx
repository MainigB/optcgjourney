// app/tournaments.tsx
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Keyboard, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Card, Chip, DeckAvatar, ScreenHeader, UI } from '../components/ui';
import { computeRecord, deleteTournament, loadTournaments, Tournament, updateTournament } from '../state/app';
import { t } from '../i18n';

// >>> Fonts
import { NotoSans_700Bold, useFonts as useNoto } from '@expo-google-fonts/noto-sans';
import { Oswald_400Regular, useFonts as useOswald } from '@expo-google-fonts/oswald';

function Tag({ label }: { label: string }) {
  return <Chip label={label} />;
}

const CARD_H = 96;

const BRAND = '#8E7D55';
const LINE = UI?.color?.line ?? '#e5e7eb';
const SUB = UI?.color?.sub ?? '#64748b';
const INK = UI?.color?.ink ?? '#0f172a';

function TournamentCard({ tournament, onDelete, onUpdate }: { tournament: Tournament; onDelete: () => void; onUpdate: () => void }) {
  const rec = computeRecord(tournament);
  const tone = rec.wins > rec.losses ? 'ok' : rec.wins < rec.losses ? 'bad' : 'mid';

  const [optionsOpen, setOptionsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(tournament.name || '');
  const [saving, setSaving] = useState(false);
  const getFormattedDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [editDate, setEditDate] = useState(getFormattedDate(tournament.date));

  const handleLongPress = () => {
    setOptionsOpen(true);
  };

  const formatDateInput = (text: string): string => {
    // Remove tudo que não é número
    const numbers = text.replace(/\D/g, '');
    
    // Limita a 8 dígitos (DDMMAAAA)
    const limited = numbers.slice(0, 8);
    
    // Formata: DD/MM/AAAA
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 4) {
      return `${limited.slice(0, 2)}/${limited.slice(2)}`;
    } else {
      return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
    }
  };

  const handleEdit = () => {
    setOptionsOpen(false);
    setEditName(tournament.name || '');
    setEditDate(getFormattedDate(tournament.date));
    setEditOpen(true);
  };

  const handleDelete = async () => {
    setOptionsOpen(false);
    Alert.alert(
      t('tournament.deleteTitle'),
      t('tournament.deleteConfirm', { name: tournament.name || '(sem nome)' }),
      [
        {
          text: t('common.cancelAction'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const success = await deleteTournament(tournament.id);
            if (success) {
              onDelete();
            }
          },
        },
      ]
    );
  };

  const handleSaveEdit = async () => {
    if (saving) return; // Previne múltiplos cliques
    
    setSaving(true);
    
    try {
      const updates: { name?: string; date?: number } = {};
      
      // Atualiza o nome se foi alterado
      const trimmedName = editName.trim();
      if (trimmedName !== tournament.name) {
        updates.name = trimmedName;
      }
      
      // Tenta parsear a data
      const dateParts = editDate.split('/');
      if (dateParts.length === 3) {
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10);
        const year = parseInt(dateParts[2], 10);
        
        // Valida se todos os valores são números válidos
        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && 
            day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
          const testDate = new Date(year, month - 1, day);
          // Verifica se a data é válida
          if (!isNaN(testDate.getTime()) && 
              testDate.getDate() === day && 
              testDate.getMonth() === month - 1 && 
              testDate.getFullYear() === year) {
            const newTimestamp = testDate.getTime();
            // Só atualiza se a data for diferente
            if (newTimestamp !== tournament.date) {
              updates.date = newTimestamp;
            }
          }
        }
      }
      
      // Se não há mudanças, fecha o modal
      if (Object.keys(updates).length === 0) {
        setEditOpen(false);
        setSaving(false);
        return;
      }
      
      // Salva as atualizações
      const updated = await updateTournament(tournament.id, updates);
      if (updated) {
        setEditOpen(false);
        onUpdate();
      } else {
        Alert.alert('Erro', 'Não foi possível atualizar o torneio. Tente novamente.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Pressable 
        onPress={() => router.push(`/t/${tournament.id}`)} 
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
          <DeckAvatar label={tournament.deck} tone={tone} size={72} imgShiftY={-6} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ fontSize: 18, fontFamily: 'NotoSans_700Bold' }}>
              {tournament.name || '(sem nome)'}
            </Text>
            <Text style={{ color: UI.color.sub, marginTop: 2, fontFamily: 'NotoSans_700Bold' }}>
              {new Date(tournament.date).toLocaleDateString()}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              {tournament.set ? <Tag label={tournament.set} /> : null}
              {tournament.type ? <Tag label={tournament.type} /> : null}
            </View>
          </View>
          <Text style={{ color: UI.color.sub, fontFamily: 'NotoSans_700Bold' }}>›</Text>
        </Card>
      </Pressable>

      {/* Modal de Opções */}
      <Modal animationType="fade" transparent visible={optionsOpen} onRequestClose={() => setOptionsOpen(false)}>
        <View style={{ flex: 1, backgroundColor: '#00000055', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ width: '100%', maxWidth: 420, backgroundColor: '#fff', borderWidth: 1, borderColor: LINE }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: LINE }}>
              <Text style={{ fontFamily: 'NotoSans_700Bold', fontSize: 16 }}>{t('tournament.editTitle')}</Text>
            </View>

            <View style={{ padding: 16, gap: 12 }}>
              <Pressable
                onPress={handleEdit}
                android_ripple={{ color: '#ffffff22' }}
                style={{
                  height: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: BRAND,
                }}
              >
                <Text style={{ fontFamily: 'NotoSans_700Bold', color: '#fff' }}>{t('tournament.editTournament')}</Text>
              </Pressable>

              <Pressable
                onPress={handleDelete}
                android_ripple={{ color: '#00000010' }}
                style={{
                  height: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: '#dc2626',
                  backgroundColor: '#fff',
                }}
              >
                <Text style={{ fontFamily: 'NotoSans_700Bold', color: '#dc2626' }}>{t('common.delete')}</Text>
              </Pressable>

              <Pressable
                onPress={() => setOptionsOpen(false)}
                android_ripple={{ color: '#00000010' }}
                style={{
                  height: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: LINE,
                  backgroundColor: '#fff',
                  marginTop: 4,
                }}
              >
                <Text style={{ fontFamily: 'NotoSans_700Bold', color: SUB }}>{t('common.cancel')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Edição */}
      <Modal animationType="fade" transparent visible={editOpen} onRequestClose={() => setEditOpen(false)}>
        <View style={{ flex: 1, backgroundColor: '#00000055', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ width: '100%', maxWidth: 420, backgroundColor: '#fff', borderWidth: 1, borderColor: LINE }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: LINE }}>
              <Text style={{ fontFamily: 'NotoSans_700Bold', fontSize: 16 }}>{t('tournament.editTournament')}</Text>
            </View>

            <View style={{ padding: 16, gap: 16 }}>
              <View>
                <Text style={{ marginBottom: 6, fontFamily: 'NotoSans_700Bold' }}>{t('tournament.editName')}</Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder={t('tournament.namePlaceholder')}
                  placeholderTextColor={SUB}
                  blurOnSubmit={false}
                  returnKeyType="done"
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
              </View>

              <View>
                <Text style={{ marginBottom: 6, fontFamily: 'NotoSans_700Bold' }}>{t('tournament.editDate')}</Text>
                <TextInput
                  value={editDate}
                  onChangeText={(text) => setEditDate(formatDateInput(text))}
                  placeholder={t('tournament.datePlaceholder')}
                  placeholderTextColor={SUB}
                  keyboardType="numeric"
                  maxLength={10}
                  blurOnSubmit={false}
                  returnKeyType="done"
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
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                <Pressable
                  onPress={() => setEditOpen(false)}
                  android_ripple={{ color: '#00000010' }}
                  style={{
                    flex: 1,
                    height: 48,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: LINE,
                    backgroundColor: '#fff',
                  }}
                >
                  <Text style={{ fontFamily: 'NotoSans_700Bold', color: SUB }}>{t('common.cancel')}</Text>
                </Pressable>

                <Pressable
                  onPressIn={() => Keyboard.dismiss()}
                  onPress={() => {
                    // Pequeno delay para garantir que o teclado feche antes
                    setTimeout(() => {
                      handleSaveEdit();
                    }, 50);
                  }}
                  disabled={saving}
                  android_ripple={{ color: saving ? '#00000010' : '#ffffff22' }}
                  style={{
                    flex: 1,
                    height: 48,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: saving ? SUB : BRAND,
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  <Text style={{ fontFamily: 'NotoSans_700Bold', color: '#fff' }}>
                    {saving ? t('common.loading') : t('tournament.save')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function TournamentsScreen() {
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  // Load fonts
  const [notoLoaded] = useNoto({ NotoSans_700Bold });
  const [oswaldLoaded] = useOswald({ Oswald_400Regular });

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

  if (!notoLoaded || !oswaldLoaded || loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: UI.color.bg }}>
        <Text style={{ fontFamily: notoLoaded ? 'NotoSans_700Bold' : undefined }}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: UI.color.bg }}>
      <ScreenHeader title={t('tournament.tournaments')} onBack={() => router.back()} brandColor="#8E7D55" />
      
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
              {t('tournament.noTournaments')}
            </Text>
            <Text style={{ color: UI.color.sub, fontFamily: 'NotoSans_700Bold', fontSize: 14, marginTop: 4 }}>
              {t('tournament.addFirst')}
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
              {tournaments.length} {tournaments.length === 1 ? t('tournament.tournament') : t('tournament.tournamentsPlural')}
            </Text>
            <FlatList
              data={tournaments}
              keyExtractor={(tournament) => tournament.id}
              renderItem={({ item }) => <TournamentCard tournament={item} onDelete={reloadTournaments} onUpdate={reloadTournaments} />}
              showsVerticalScrollIndicator={true}
              bounces={true}
            />
          </View>
        )}
      </View>
    </View>
  );
}

