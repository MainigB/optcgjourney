// components/ui.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Platform, Pressable, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLeaderImageURL } from '../data/leaderImages';

/* ========= Design tokens (flat) ========= */
export const UI = {
  color: {
    bg: '#f1f5f9',       // slate-100
    card: '#ffffff',
    line: '#e5e7eb',
    ink: '#0f172a',      // slate-900
    sub: '#64748b',      // slate-500
    ok:  '#16a34a',
    bad: '#dc2626',
    mid: '#94a3b8',
    primary: '#0f172a',
  },
  // zeramos todos os raios p/ estilo “quadrado”
  radius: {
    xs: 0, sm: 9, md: 9, lg: 0, xl: 0
  },
  // removemos sombra para um look mais flat
  shadow: Platform.select<ViewStyle>({
    ios:     {},
    android: {},
    default: {},
  }) as ViewStyle,
};

export default UI;

/* ========= Primitives ========= */
export function ScreenHeader({
  title,
  onBack,
  brandColor = '#8E7D55',
  titleSize = 24,
  paddingTop = 12,
  showBottomLine = true,
}: {
  title: string;
  onBack: () => void;
  brandColor?: string;
  titleSize?: number;
  paddingTop?: number;
  showBottomLine?: boolean;
}) {
  return (
    <View style={{ paddingTop, paddingHorizontal: 16, paddingBottom: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <Pressable
          onPress={onBack}
          hitSlop={16}
          android_ripple={{ color: '#00000010', borderless: true }}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 4, marginLeft: -8 }}
        >
          <Ionicons name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} size={30} color={brandColor} />
        </Pressable>
        <Text
          style={{
            fontSize: titleSize,
            color: UI.color.ink,
            fontFamily: 'Oswald_400Regular',
            letterSpacing: 0.5,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>
      {showBottomLine ? (
        <View style={{ height: 1, backgroundColor: UI.color.line, position: 'absolute', left: 16, right: 16, bottom: 0 }} />
      ) : null}
    </View>
  );
}

export function HeaderBar({
  title,
  leftLabel,
  onLeftPress,
  rightSlot,
}: {
  title: string;
  leftLabel?: string;
  onLeftPress?: () => void;
  rightSlot?: React.ReactNode;
}) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: UI.color.primary }}>
      <View
        style={{
          height: 56,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {onLeftPress ? (
          <Pressable
            onPress={onLeftPress}
            android_ripple={{ color: '#ffffff22', radius: 28 }}
            style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: UI.radius.sm }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>{leftLabel ?? '← Voltar'}</Text>
          </Pressable>
        ) : <View style={{ width: 80 }} />}

        <Text numberOfLines={1} style={{ color: 'white', fontWeight: '800', fontSize: 16, maxWidth: '60%', textAlign: 'center' }}>
          {title}
        </Text>

        <View style={{ minWidth: 80, alignItems: 'flex-end' }}>{rightSlot}</View>
      </View>
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View
      style={[
        {
          backgroundColor: UI.color.card,
          borderRadius: UI.radius.lg, // = 0 (flat)
          borderWidth: 1,
          borderColor: UI.color.line,
          padding: 12,
        },
        UI.shadow, // {} (sem sombra)
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Chip({ label }: { label: string }) {
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: UI.color.line,
        borderRadius: UI.radius.xs, // = 0 (sem pílula)
        backgroundColor: '#fff',
      }}
    >
      <Text style={{ fontSize: 12 }}>{label}</Text>
    </View>
  );
}

/* ========= Avatares ========= */
export function initialsFromDeck(label: string) {
  const clean = label.replace(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic}|\p{Emoji}|\s)+/u, '');
  return (clean.slice(0, 2).toUpperCase() || 'DK');
}

export function DeckAvatar({
  label,
  badge,
  tone = 'mid',
  size = 64,
  zoom = 1.5,
  crop = 'top',
  imgShiftY = 0
}: {
  label: string;
  badge?: string;
  tone?: 'ok' | 'bad' | 'mid';
  size?: number;
  zoom?: number;
  crop?: 'top' | 'center' | 'bottom';
  imgShiftY?: number;
}) {
  const borderColor =
    tone === 'ok' ? UI.color.ok :
    tone === 'bad' ? UI.color.bad :
    UI.color.mid;

  const img = getLeaderImageURL(label);

  // viewport é o quadrado visível; a imagem é renderizada maior (zoom) e recortada
  const viewport = size;
  const safeZoom = Math.max(1, zoom);
  const imgBox = viewport * safeZoom;

  // centraliza horizontalmente a imagem maior dentro do viewport
  const left = (viewport - imgBox) / 2;

  // calcula posição vertical conforme âncora e aplica ajuste fino
  const EPS = 0.5;
  let baseTop = 0;
  if (crop === 'center') baseTop = (viewport - imgBox) / 2;
  if (crop === 'bottom') baseTop = viewport - imgBox;
  baseTop += imgShiftY;

  const top = Math.max(viewport - imgBox, Math.min(-EPS, baseTop));

  return (
    <View
      style={{
        width: viewport,
        height: viewport,
        borderRadius: UI.radius.md, // = 0 (quadrado)
        overflow: 'hidden',
        borderWidth: 3,
        borderColor,
        backgroundColor: UI.color.ink,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {img ? (
        <Image
          source={{ uri: img }}
          resizeMode="cover"
          style={{
            position: 'absolute',
            width: imgBox + 1,
            height: imgBox + 1,
            left: left - 0.5,
            top,
          }}
        />
      ) : (
        <Text style={{ color: 'white', fontWeight: '800' }}>
          {initialsFromDeck(label)}
        </Text>
      )}

      {badge ? (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingVertical: 2,
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.6)',
          }}
        >
          <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>
            {badge}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/* ========= Cards de estatística ========= */
export function SplitCard({ title, w, l }: { title: string; w: number; l: number }) {
  const total = w + l;
  const wr = total ? Math.round((w / total) * 100) : 0;
  const tone: 'ok' | 'bad' | 'mid' = w > l ? 'ok' : w < l ? 'bad' : 'mid';

  return (
    <Card style={{ flexBasis: '48%', padding: 12 }}>
      <Text style={{ fontWeight: '800', marginBottom: 8 }}>{title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <DeckAvatar label={title} tone={tone} size={40} />
        <View>
          <Text style={{ fontWeight: '800' }}>{w}-{l}</Text>
          <Text style={{ color: UI.color.sub }}>{wr}% WR</Text>
        </View>
      </View>
    </Card>
  );
}

export function SplitTwo({
  title,
  aLabel, aW, aL,
  bLabel, bW, bL,
}: {
  title: string;
  aLabel: string; aW: number; aL: number;
  bLabel: string; bW: number; bL: number;
}) {
  const aT = aW + aL, aWR = aT ? Math.round((aW / aT) * 100) : 0;
  const bT = bW + bL, bWR = bT ? Math.round((bW / bT) * 100) : 0;

  return (
    <Card style={{ flexBasis: '48%', padding: 12 }}>
      <Text style={{ fontWeight: '800', marginBottom: 8 }}>{title}</Text>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        {/* A */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', marginBottom: 6 }}>{aLabel}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{
              width: 36, height: 36, borderRadius: UI.radius.sm, // = 0
              borderWidth: 3,
              borderColor: aW > aL ? UI.color.ok : aW < aL ? UI.color.bad : UI.color.mid,
              alignItems: 'center', justifyContent: 'center', backgroundColor: UI.color.ink
            }}>
              <Text style={{ color: 'white', fontWeight: '800' }}>{aT || 0}</Text>
            </View>
            <View>
              <Text style={{ fontWeight: '800' }}>{aW}-{aL}</Text>
              <Text style={{ color: UI.color.sub }}>{aWR}%</Text>
            </View>
          </View>
        </View>

        {/* B */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', marginBottom: 6 }}>{bLabel}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{
              width: 36, height: 36, borderRadius: UI.radius.sm, // = 0
              borderWidth: 3,
              borderColor: bW > bL ? UI.color.ok : bW < bL ? UI.color.bad : UI.color.mid,
              alignItems: 'center', justifyContent: 'center', backgroundColor: UI.color.ink
            }}>
              <Text style={{ color: 'white', fontWeight: '800' }}>{bT || 0}</Text>
            </View>
            <View>
              <Text style={{ fontWeight: '800' }}>{bW}-{bL}</Text>
              <Text style={{ color: UI.color.sub }}>{bWR}%</Text>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
}
