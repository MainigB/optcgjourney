// components/deck-export-image.tsx
import React from 'react';
import { Image, Text, View } from 'react-native';
import { UI } from './ui';
import { Tournament, matchupsForDeck, computeRecord, wrPercent } from '../state/app';
import { getLeaderImageURL } from '../data/leaderImages';

const BRAND = '#8E7D55';
const INK = UI?.color?.ink ?? '#0f172a';
const SUB = UI?.color?.sub ?? '#64748b';
const LINE = UI?.color?.line ?? '#e5e7eb';

interface DeckExportImageProps {
  deckName: string;
  tournaments: Tournament[];
  matchups: ReturnType<typeof matchupsForDeck>;
  wins: number;
  losses: number;
  wr: number;
  totalTournaments: number;
  orderFirstWr: number;
  orderSecondWr: number;
}

export function DeckExportImage({
  deckName,
  tournaments,
  matchups,
  wins,
  losses,
  wr,
  totalTournaments,
  orderFirstWr,
  orderSecondWr,
}: DeckExportImageProps) {
  const totalMatches = wins + losses;

  // Top 3 melhores matchups (maior % de vitória, mínimo 1 partida, WR > 0%)
  const bestMatchups = matchups
    .filter((m) => m.rounds >= 1 && m.wr > 0)
    .sort((a, b) => b.wr - a.wr)
    .slice(0, 3);

  // Top 3 piores matchups (menor % de vitória, mínimo 1 partida, apenas negativos)
  const worstMatchups = matchups
    .filter((m) => m.rounds >= 1 && m.wr < 50) // Apenas matchups negativos (WR < 50%)
    .sort((a, b) => a.wr - b.wr)
    .slice(0, 3);

  // Líderes enfrentados (todos os líderes únicos)
  const allOpponents = new Set<string>();
  tournaments.forEach((t) => {
    (t.rounds || []).forEach((r) => {
      if (r.opponentLeader && !r.isBye) {
        allOpponents.add(r.opponentLeader);
      }
    });
  });
  const leadersFaced = Array.from(allOpponents).sort();

  return (
    <View
      style={{
        width: 1200,
        backgroundColor: '#fff',
        padding: 60,
        position: 'relative',
      }}
      collapsable={false}
    >
      {/* Título */}
      <Text
        style={{
          fontSize: 48,
          fontFamily: 'NotoSans_700Bold',
          color: INK,
          marginBottom: 20,
          textAlign: 'center',
        }}
      >
        Estatísticas com o deck{'\n'}{deckName}
      </Text>

      {/* Subtítulo: X partidas em Y torneios - Z%WR */}
      <Text
        style={{
          fontSize: 28,
          fontFamily: 'NotoSans_700Bold',
          color: SUB,
          marginBottom: 40,
          textAlign: 'center',
        }}
      >
        {totalMatches} partida(s) em {totalTournaments} torneio(s) - {wr}% WR
      </Text>

      {/* Record total com o deck */}
      <View style={{ marginBottom: 40, alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 32,
            fontFamily: 'NotoSans_700Bold',
            color: INK,
            marginBottom: 16,
          }}
        >
          Record total com o deck
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
          {/* Avatar com imagem completa do líder */}
          <View
            style={{
              width: 200,
              height: 200,
              borderRadius: 0,
              overflow: 'hidden',
              borderWidth: 3,
              borderColor: wins > losses ? '#16a34a' : wins < losses ? '#dc2626' : '#94a3b8',
              backgroundColor: 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {getLeaderImageURL(deckName) ? (
              <Image
                source={{ uri: getLeaderImageURL(deckName) }}
                resizeMode="cover"
                style={{
                  width: '100%',
                  height: '100%',
                }}
              />
            ) : (
              <View
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: UI.color.ink,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: 'white', fontSize: 32, fontFamily: 'NotoSans_700Bold' }}>
                  {deckName.replace(/[^\w\s]/g, '').slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 56, fontFamily: 'NotoSans_700Bold', color: INK }}>
              {wins}-{losses}
            </Text>
            <Text style={{ fontSize: 24, fontFamily: 'NotoSans_700Bold', color: SUB }}>{wr}% WR</Text>
          </View>
        </View>
      </View>

      {/* Ordem: WR indo 1º vs indo 2º */}
      <View style={{ marginBottom: 40 }}>
        <Text
          style={{
            fontSize: 32,
            fontFamily: 'NotoSans_700Bold',
            color: INK,
            marginBottom: 20,
          }}
        >
          Ordem:
        </Text>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            paddingVertical: 24,
            borderWidth: 2,
            borderColor: LINE,
            backgroundColor: '#f8fafc',
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontFamily: 'NotoSans_700Bold', color: SUB, marginBottom: 8 }}>
              Indo 1º a WR é
            </Text>
            <Text style={{ fontSize: 40, fontFamily: 'NotoSans_700Bold', color: INK }}>{orderFirstWr}%</Text>
          </View>
          <View style={{ width: 2, backgroundColor: LINE }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontFamily: 'NotoSans_700Bold', color: SUB, marginBottom: 8 }}>
              Indo 2º a WR é
            </Text>
            <Text style={{ fontSize: 40, fontFamily: 'NotoSans_700Bold', color: INK }}>{orderSecondWr}%</Text>
          </View>
        </View>
      </View>

      {/* Top 3 melhores Matchups */}
      {bestMatchups.length > 0 && (
        <View style={{ marginBottom: 40 }}>
          <Text
            style={{
              fontSize: 32,
              fontFamily: 'NotoSans_700Bold',
              color: INK,
              marginBottom: 20,
            }}
          >
            Top 3 melhores Matchups
          </Text>
          {bestMatchups.map((m, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderBottomWidth: 1,
                borderBottomColor: LINE,
                backgroundColor: idx === 0 ? '#f0fdf4' : '#fff',
              }}
            >
              <Text style={{ width: 60, fontSize: 24, fontFamily: 'NotoSans_700Bold', color: SUB }}>
                {idx + 1}.
              </Text>
              <Text style={{ flex: 1, fontSize: 24, fontFamily: 'NotoSans_700Bold', color: INK }} numberOfLines={1}>
                {m.opponent}
              </Text>
              <Text style={{ fontSize: 24, fontFamily: 'NotoSans_700Bold', color: INK, marginRight: 20 }}>
                {m.wins}-{m.losses}
              </Text>
              <Text
                style={{
                  fontSize: 28,
                  fontFamily: 'NotoSans_700Bold',
                  color: '#16a34a',
                  width: 80,
                  textAlign: 'right',
                }}
              >
                {m.wr}%
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Top 3 piores Matchups */}
      {worstMatchups.length > 0 && (
        <View style={{ marginBottom: 40 }}>
          <Text
            style={{
              fontSize: 32,
              fontFamily: 'NotoSans_700Bold',
              color: INK,
              marginBottom: 20,
            }}
          >
            Top 3 piores Matchups
          </Text>
          {worstMatchups.map((m, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderBottomWidth: 1,
                borderBottomColor: LINE,
                backgroundColor: idx === 0 ? '#fef2f2' : '#fff',
              }}
            >
              <Text style={{ width: 60, fontSize: 24, fontFamily: 'NotoSans_700Bold', color: SUB }}>
                {idx + 1}.
              </Text>
              <Text style={{ flex: 1, fontSize: 24, fontFamily: 'NotoSans_700Bold', color: INK }} numberOfLines={1}>
                {m.opponent}
              </Text>
              <Text style={{ fontSize: 24, fontFamily: 'NotoSans_700Bold', color: INK, marginRight: 20 }}>
                {m.wins}-{m.losses}
              </Text>
              <Text
                style={{
                  fontSize: 28,
                  fontFamily: 'NotoSans_700Bold',
                  color: '#dc2626',
                  width: 80,
                  textAlign: 'right',
                }}
              >
                {m.wr}%
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Líderes enfrentados */}
      {/*{leadersFaced.length > 0 && (
        <View style={{ marginBottom: 40 }}>
          <Text
            style={{
              fontSize: 32,
              fontFamily: 'NotoSans_700Bold',
              color: INK,
              marginBottom: 20,
            }}
          >
            Líderes enfrentados
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {leadersFaced.map((leader, idx) => (
              <View
                key={idx}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: LINE,
                  backgroundColor: '#f8fafc',
                }}
              >
                <Text style={{ fontSize: 18, fontFamily: 'NotoSans_700Bold', color: INK }} numberOfLines={1}>
                  {leader}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}*/}

      {/* Footer */}
      <View style={{ marginTop: 40, alignItems: 'center', borderTopWidth: 1, borderTopColor: LINE, paddingTop: 20 }}>
        <Text style={{ fontSize: 16, fontFamily: 'NotoSans_700Bold', color: SUB }}>
          Gerado em {new Date().toLocaleDateString('pt-BR')} · OPTCG Journey
        </Text>
      </View>

      {/* Logo no canto inferior direito */}
      <View
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          width: 60,
          height: 60,
        }}
      >
        <Image
          source={require('../assets/images/logo.png')}
          resizeMode="contain"
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </View>
    </View>
  );
}
