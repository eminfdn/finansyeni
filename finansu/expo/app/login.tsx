import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  TrendingUp,
  ArrowRight,
  ChevronRight,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';

export default function LoginScreen() {
  const { login, register, googleLogin, loginError, registerError, isLoggingIn, isRegistering } = useUser();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const formSlide = useRef(new Animated.Value(30)).current;
  const formFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(formFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(formSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    });
  }, [fadeAnim, slideAnim, logoScale, formFade, formSlide]);

  const switchMode = useCallback(() => {
    formFade.setValue(0);
    formSlide.setValue(20);
    setMode(prev => prev === 'login' ? 'register' : 'login');
    setPassword('');
    setConfirmPassword('');
    Animated.parallel([
      Animated.timing(formFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(formSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [formFade, formSlide]);

  const handleSubmit = useCallback(() => {
    if (mode === 'login') {
      if (!email.trim() || !password.trim()) {
        Alert.alert('Hata', 'Lütfen e-posta ve şifrenizi girin.');
        return;
      }
      login(email.trim(), password);
    } else {
      if (!name.trim() || !email.trim() || !password.trim()) {
        Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Hata', 'Şifreler eşleşmiyor.');
        return;
      }
      register(name.trim(), email.trim(), password);
    }
  }, [mode, name, email, password, confirmPassword, login, register]);

  const handleGoogleLogin = useCallback(() => {
    googleLogin();
  }, [googleLogin]);

  const isLoading = isLoggingIn || isRegistering;
  const errorMsg = mode === 'login' ? loginError : registerError;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#050810', '#0A1628', '#0F1D35']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <Animated.View
                style={[
                  styles.logoSection,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }, { scale: logoScale }],
                  },
                ]}
              >
                <View style={styles.logoContainer}>
                  <LinearGradient
                    colors={['#0EA5E9', '#0284C7']}
                    style={styles.logoGradient}
                  >
                    <TrendingUp color="#fff" size={32} />
                  </LinearGradient>
                </View>
                <Text style={styles.appName}>YatırımPro</Text>
                <Text style={styles.appTagline}>Akıllı yatırımın adresi</Text>
              </Animated.View>

              <Animated.View
                style={[
                  styles.formCard,
                  {
                    opacity: formFade,
                    transform: [{ translateY: formSlide }],
                  },
                ]}
              >
                <View style={styles.tabRow}>
                  <TouchableOpacity
                    style={[styles.tab, mode === 'login' && styles.tabActive]}
                    onPress={() => mode !== 'login' && switchMode()}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
                      Giriş Yap
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tab, mode === 'register' && styles.tabActive]}
                    onPress={() => mode !== 'register' && switchMode()}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
                      Kayıt Ol
                    </Text>
                  </TouchableOpacity>
                </View>

                {mode === 'register' && (
                  <View style={styles.inputGroup}>
                    <View style={styles.inputRow}>
                      <User color={Colors.dark.textMuted} size={18} />
                      <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Adınız"
                        placeholderTextColor={Colors.dark.textMuted}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <View style={styles.inputRow}>
                    <Mail color={Colors.dark.textMuted} size={18} />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="E-posta adresiniz"
                      placeholderTextColor={Colors.dark.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.inputRow}>
                    <Lock color={Colors.dark.textMuted} size={18} />
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Şifre"
                      placeholderTextColor={Colors.dark.textMuted}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? (
                        <EyeOff color={Colors.dark.textMuted} size={18} />
                      ) : (
                        <Eye color={Colors.dark.textMuted} size={18} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {mode === 'register' && (
                  <View style={styles.inputGroup}>
                    <View style={styles.inputRow}>
                      <Lock color={Colors.dark.textMuted} size={18} />
                      <TextInput
                        style={styles.input}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Şifre tekrar"
                        placeholderTextColor={Colors.dark.textMuted}
                        secureTextEntry={!showPassword}
                      />
                    </View>
                  </View>
                )}

                {errorMsg ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isLoading ? ['#374151', '#374151'] : ['#0EA5E9', '#0284C7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitGradient}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Text style={styles.submitText}>
                          {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
                        </Text>
                        <ArrowRight color="#fff" size={18} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>veya</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.googleBtn}
                  onPress={handleGoogleLogin}
                  activeOpacity={0.7}
                  disabled={isLoading}
                >
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={styles.googleText}>Google ile devam et</Text>
                  <ChevronRight color={Colors.dark.textMuted} size={16} />
                </TouchableOpacity>
              </Animated.View>

              <Animated.View style={[styles.footer, { opacity: formFade }]}>
                <Text style={styles.footerText}>
                  {mode === 'login' ? 'Hesabın yok mu? ' : 'Zaten hesabın var mı? '}
                </Text>
                <TouchableOpacity onPress={switchMode}>
                  <Text style={styles.footerLink}>
                    {mode === 'login' ? 'Kayıt Ol' : 'Giriş Yap'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              <View style={{ height: 30 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.authBg,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 36,
    gap: 12,
  },
  logoContainer: {
    marginBottom: 4,
  },
  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.dark.text,
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 15,
    color: Colors.dark.textMuted,
    letterSpacing: 0.5,
  },
  formCard: {
    backgroundColor: 'rgba(17,24,39,0.8)',
    borderRadius: 24,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 14,
    padding: 4,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 11,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.dark.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.textMuted,
  },
  tabTextActive: {
    color: '#fff',
  },
  inputGroup: {},
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.dark.text,
    paddingVertical: 16,
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  errorText: {
    fontSize: 13,
    color: Colors.dark.danger,
    textAlign: 'center',
  },
  submitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderRadius: 14,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.dark.border,
  },
  dividerText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#4285F4',
  },
  googleText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: Colors.dark.textMuted,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.dark.primary,
  },
});
