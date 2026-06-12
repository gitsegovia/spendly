import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../../src/lib/supabase/client';
import { useAuth } from '../../src/contexts/AuthContext';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { t } = useTranslation();
  const { loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const redirectTo = Linking.createURL('auth/callback');
  console.log('[Spendly] redirectTo:', redirectTo);

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

  async function handleOAuth(provider: 'google' | 'apple') {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data?.url) return;

      // openAuthSessionAsync cierra el browser automáticamente al recibir el redirect
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success') {
        const resultUrl = result.url;

        // Implicit flow: tokens en hash fragment
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

        // PKCE flow: code en query params
        const parsed = Linking.parse(resultUrl);
        const code = parsed.queryParams?.code as string | undefined;
        if (code) {
          const { error: err } = await supabase.auth.exchangeCodeForSession(code);
          if (err) throw err;
        }
      }
      // Android fallback: si openAuthSessionAsync no intercepta, el deep link
      // llega a _layout.tsx → Linking.addEventListener → setSession
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setLoading(false);
    }
  }

  // authLoading cubre el gap entre browser close y loadProfile complete
  if (authLoading) {
    return (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t('auth.welcome')}</Text>
        <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
      </View>

      {/* Email / Contraseña */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
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
          style={[styles.button, styles.primaryButton]}
          onPress={handleEmailAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
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

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>o</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* OAuth */}
      <View style={styles.oauthButtons}>
        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={() => handleOAuth('google')}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{t('auth.sign_in_google')}</Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={[styles.button, styles.appleButton]}
            onPress={() => handleOAuth('apple')}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{t('auth.sign_in_apple')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    gap: 12,
    marginBottom: 24,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
  },
  toggle: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  toggleText: {
    fontSize: 14,
    color: '#4F46E5',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  oauthButtons: {
    gap: 12,
  },
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  appleButton: {
    backgroundColor: '#000',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
