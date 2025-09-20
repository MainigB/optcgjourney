// components/logo.tsx
import React from 'react';
import { View, Image, ViewStyle } from 'react-native';

type Props = {
  size?: number;
  /** Usa formato circular (ignora radius) */
  circle?: boolean;
  /** Raio das bordas quando não for circular */
  radius?: number;
  /** Largura da borda (0 = sem borda) */
  borderWidth?: number;
  /** Cor da borda */
  borderColor?: string;
  /** Cor de fundo atrás da imagem (útil quando resizeMode = contain) */
  backgroundColor?: string;
  /** 'contain' preserva a logo inteira; 'cover' preenche o quadrado sem letterbox */
  mode?: 'contain' | 'cover';
  /** Estilos extras pro wrapper */
  style?: ViewStyle;
};

export function AppLogo({
  size = 96,
  circle = false,
  radius = 16,
  borderWidth = 0,
  borderColor = 'transparent',
  backgroundColor = 'transparent',
  mode = 'contain',
  style,
}: Props) {
  const r = circle ? size / 2 : radius;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: r,
          overflow: 'hidden',
          borderWidth,
          borderColor,
          backgroundColor,
          alignSelf: 'center',
        },
        style,
      ]}
    >
      <Image
        source={require('../assets/images/logo.png')}
        style={{ width: '100%', height: '100%' }}
        resizeMode={mode}
      />
    </View>
  );
}
