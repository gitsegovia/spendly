import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Platform, KeyboardAvoidingView, ScrollView, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { supabase } from '../../src/lib/supabase/client';
import { useAuth } from '../../src/contexts/AuthContext';

WebBrowser.maybeCompleteAuthSession();

function generateNonce(length = 32): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const { loading: authLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const redirectTo = Linking.createURL('auth/callback');

  async function handleEmailAuth() {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('auth.email_password_required'));
      return;
    }
    try {
      setLoading(true);
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        Alert.alert(t('auth.verify_email'), t('auth.verify_email_message'));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: 'google') {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data?.url) return;

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success') {
        const resultUrl = result.url;

        if (resultUrl.includes('#access_token=')) {
          const hash = resultUrl.split('#')[1] ?? '';
          const params: Record<string, string> = {};
          for (const part of hash.split('&')) {
            const [k, v] = part.split('=');
            if (k) params[k] = decodeURIComponent(v ?? '');
          }
          const { error: err } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (err) throw err;
          return;
        }

        const parsed = Linking.parse(resultUrl);
        const code = parsed.queryParams?.code as string | undefined;
        if (code) {
          const { error: err } = await supabase.auth.exchangeCodeForSession(code);
          if (err) throw err;
        }
      }
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setLoading(false);
    }
  }

  async function signInWithApple() {
    try {
      setLoading(true);
      const rawNonce = generateNonce();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) throw new Error('Apple did not return identity token');

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: rawNonce,
      });
      if (error) throw error;
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert(t('common.error'), e.message);
      }
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.outer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={styles.brand}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>{t('common.app_name')}</Text>
          <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder={t('auth.password')}
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleEmailAuth}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnTextWhite}>
                {isSignUp ? t('auth.sign_up') : t('auth.sign_in')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.toggle}>
            <Text style={styles.toggleText}>
              {isSignUp ? t('auth.sign_in_toggle') : t('auth.sign_up_toggle')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('common.or')}</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* OAuth */}
        <View style={styles.oauth}>
          <TouchableOpacity
            style={[styles.btn, styles.btnGoogle, loading && styles.btnDisabled]}
            onPress={() => handleOAuth('google')}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.btnTextGoogle}>G</Text>
            <Text style={styles.btnTextDark}>{t('auth.sign_in_google')}</Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={14}
              style={styles.appleBtn}
              onPress={signInWithApple}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#fff' },
  loadingOverlay: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },

  content: { paddingHorizontal: 28 },

  // Brand
  brand: { alignItems: 'center', marginBottom: 36, gap: 8 },
  logo: {
    width: 96, height: 96, borderRadius: 24,
    marginBottom: 4,
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
  },
  appName: { fontSize: 32, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center' },

  // Form
  form: { gap: 12, marginBottom: 24 },
  input: {
    height: 52, borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 14, paddingHorizontal: 16,
    fontSize: 16, color: '#111827', backgroundColor: '#F9FAFB',
  },
  toggle: { alignItems: 'center', paddingVertical: 4 },
  toggleText: { fontSize: 14, color: '#4F46E5', fontWeight: '500' },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { fontSize: 13, color: '#9CA3AF' },

  // OAuth
  oauth: { gap: 12 },

  // Shared button
  btn: {
    height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8,
  },
  btnDisabled: { opacity: 0.6 },

  btnPrimary: {
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  btnTextWhite: { color: '#fff', fontSize: 16, fontWeight: '700' },

  btnGoogle: {
    backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  btnTextGoogle: { fontSize: 18, fontWeight: '800', color: '#4285F4' },
  btnTextDark: { fontSize: 15, fontWeight: '600', color: '#111827' },

  appleBtn: { height: 52, width: '100%' },
});
