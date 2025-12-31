// components/feedback-modal.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '../i18n';
import { UI } from './ui';

const STORAGE_KEY_DISABLED = 'feedback_modal_disabled';
const STORAGE_KEY_FIRST_USE = 'app_first_use_date';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.ginithekid.optcgtracker';
const DAYS_BEFORE_SHOWING = 3; // Mostra após 3 dias de uso

const BRAND = '#8E7D55';

export function FeedbackModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    checkIfShouldShow();
  }, []);

  async function checkIfShouldShow() {
    try {
      // Verifica se o usuário desativou o modal
      const disabled = await AsyncStorage.getItem(STORAGE_KEY_DISABLED);
      if (disabled === 'true') {
        return;
      }

      // Verifica quando foi o primeiro uso
      const firstUseStr = await AsyncStorage.getItem(STORAGE_KEY_FIRST_USE);
      const now = Date.now();
      
      if (!firstUseStr) {
        // Primeira vez usando o app - salva a data atual
        await AsyncStorage.setItem(STORAGE_KEY_FIRST_USE, now.toString());
        return;
      }

      // Calcula quantos dias se passaram desde o primeiro uso
      const firstUse = parseInt(firstUseStr, 10);
      const daysSinceFirstUse = Math.floor((now - firstUse) / (1000 * 60 * 60 * 24));

      // Mostra o modal se já passaram os dias necessários
      if (daysSinceFirstUse >= DAYS_BEFORE_SHOWING) {
        setVisible(true);
      }
    } catch (error) {
      // Se houver erro, não mostra o modal
      console.error('Erro ao verificar se deve mostrar modal:', error);
    }
  }

  async function handleRate() {
    try {
      await Linking.openURL(PLAY_STORE_URL);
      // Fecha o modal após abrir a loja
      setVisible(false);
    } catch (error) {
      console.error('Erro ao abrir Play Store:', error);
    }
  }

  async function handleLater() {
    setVisible(false);
  }

  async function handleDontShow() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_DISABLED, 'true');
      setVisible(false);
    } catch (error) {
      console.error('Erro ao salvar preferência:', error);
      setVisible(false);
    }
  }

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleLater}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{t('feedback.title')}</Text>
          <Text style={styles.message}>{t('feedback.message')}</Text>
          
          <View style={styles.buttonsContainer}>
            <Pressable
              onPress={handleRate}
              android_ripple={{ color: '#ffffff22' }}
              style={[styles.button, styles.primaryButton]}
            >
              <Text style={styles.primaryButtonText}>{t('feedback.rateButton')}</Text>
            </Pressable>
            
            <Pressable
              onPress={handleLater}
              android_ripple={{ color: '#00000010' }}
              style={[styles.button, styles.secondaryButton]}
            >
              <Text style={styles.secondaryButtonText}>{t('feedback.laterButton')}</Text>
            </Pressable>
            
            <Pressable
              onPress={handleDontShow}
              android_ripple={{ color: '#00000010' }}
              style={[styles.button, styles.tertiaryButton]}
            >
              <Text style={styles.tertiaryButtonText}>{t('feedback.dontShowButton')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: UI.color.card,
    borderRadius: UI.radius.md, // Segue o padrão do app (9)
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: UI.color.ink,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'NotoSans_700Bold',
  },
  message: {
    fontSize: 16,
    color: UI.color.sub,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0, // Segue o padrão do app (sem bordas arredondadas)
    overflow: 'hidden',
  },
  primaryButton: {
    backgroundColor: BRAND,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'NotoSans_700Bold',
  },
  secondaryButton: {
    backgroundColor: UI.color.bg,
    borderWidth: 2,
    borderColor: BRAND,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  secondaryButtonText: {
    color: BRAND,
    fontSize: 16,
    fontFamily: 'NotoSans_700Bold',
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    height: 'auto',
    paddingVertical: 8,
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: 0,
  },
  tertiaryButtonText: {
    color: UI.color.sub,
    fontSize: 14,
    fontFamily: 'NotoSans_700Bold',
  },
});

