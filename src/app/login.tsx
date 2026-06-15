import { useAuth } from '@/context/AuthContext';
import { useSocialAuth } from '@/hooks/useSocialAuth';
import { twColors, twFonts, twRadius } from '@/constants/tailwind-runtime-theme';
import { Dumbbell, Eye, EyeOff, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

type Mode = 'home' | 'signin' | 'signup';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const { signInWithGoogle } = useSocialAuth();
  const [mode, setMode] = useState<Mode>('home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/operation-not-allowed') {
        Alert.alert('No habilitado', 'Activá Google en Firebase Console → Authentication → Sign-in methods.');
      } else if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        Alert.alert('Error', 'No se pudo iniciar sesión con Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
    const trimEmail = email.trim();
    const trimPass = password.trim();
    const trimName = name.trim();
    if (!trimEmail || !trimPass) {
      Alert.alert('Campos requeridos', 'Completá el email y la contraseña.');
      return;
    }
    if (mode === 'signup' && !trimName) {
      Alert.alert('Campos requeridos', 'Ingresá tu nombre.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(trimEmail, trimPass);
      } else {
        await signUp(trimEmail, trimPass, trimName);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ocurrió un error.';
      let userMsg = 'Algo salió mal. Intentá de nuevo.';
      if (msg.includes('invalid-credential') || msg.includes('wrong-password')) {
        userMsg = 'Email o contraseña incorrectos.';
      } else if (msg.includes('user-not-found')) {
        userMsg = 'No encontramos una cuenta con ese email.';
      } else if (msg.includes('email-already-in-use')) {
        userMsg = 'Ya existe una cuenta con ese email. Iniciá sesión.';
      } else if (msg.includes('weak-password')) {
        userMsg = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (msg.includes('invalid-email')) {
        userMsg = 'El email no es válido.';
      }
      Alert.alert('Error', userMsg);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setMode('home');
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={twColors.background} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.logoArea}>
            <View style={styles.iconCircle}>
              <Dumbbell size={32} color={twColors.primary} />
            </View>
            <Text style={styles.appName}>GymLink</Text>
            <Text style={styles.tagline}>Tu compañero de gym</Text>
          </Animated.View>

          {mode === 'home' && (
            <>
              <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.headlineArea}>
                <Text style={styles.headline}>Empezá hoy.</Text>
                <Text style={styles.subheadline}>
                  Únete a miles de personas que ya mejoran cada día en el gym.
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.buttonsArea}>
                <Pressable
                  style={({ pressed }) => [styles.authButton, styles.googleButton, pressed && styles.pressed]}
                  onPress={handleGoogleSignIn}
                  disabled={loading}
                >
                  <Text style={styles.googleG}>G</Text>
                  <Text style={styles.authButtonTextDark}>Continuar con Google</Text>
                </Pressable>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>o</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Pressable
                  style={({ pressed }) => [styles.authButton, styles.emailButton, pressed && styles.pressed]}
                  onPress={() => setMode('signin')}
                >
                  <Mail size={18} color={twColors.foreground} />
                  <Text style={styles.authButtonTextWhite}>Continuar con email</Text>
                </Pressable>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(450).duration(600)} style={styles.footer}>
                <Text style={styles.footerText}>
                  ¿No tenés cuenta?{' '}
                  <Text style={styles.footerLink} onPress={() => setMode('signup')}>
                    Registrate
                  </Text>
                </Text>
                <Text style={styles.termsText}>
                  Al continuar aceptás los{' '}
                  <Text style={styles.termsLink}>Términos de uso</Text>
                  {' y '}
                  <Text style={styles.termsLink}>Privacidad</Text>
                </Text>
              </Animated.View>
            </>
          )}

          {(mode === 'signin' || mode === 'signup') && (
            <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.formArea}>
              <Text style={styles.formTitle}>
                {mode === 'signin' ? 'Iniciá sesión' : 'Creá tu cuenta'}
              </Text>

              {mode === 'signup' && (
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>Tu nombre</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Jose Ivorra"
                    placeholderTextColor={twColors.muted}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              )}

              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="tu@email.com"
                  placeholderTextColor={twColors.muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Contraseña</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, borderRightWidth: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor={twColors.muted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable
                    style={styles.eyeBtn}
                    onPress={() => setShowPass((v) => !v)}
                  >
                    {showPass
                      ? <EyeOff size={18} color={twColors.muted} />
                      : <Eye size={18} color={twColors.muted} />
                    }
                  </Pressable>
                </View>
              </View>

              <Pressable
                style={[styles.authButton, styles.submitButton, loading && styles.pressed]}
                onPress={handleEmailSubmit}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={twColors.background} />
                  : <Text style={styles.submitText}>
                      {mode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
                    </Text>
                }
              </Pressable>

              <View style={styles.switchRow}>
                <Text style={styles.switchText}>
                  {mode === 'signin' ? '¿No tenés cuenta? ' : '¿Ya tenés cuenta? '}
                </Text>
                <Pressable onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
                  <Text style={styles.switchLink}>
                    {mode === 'signin' ? 'Registrate' : 'Iniciá sesión'}
                  </Text>
                </Pressable>
              </View>

              <Pressable style={styles.backBtn} onPress={goBack}>
                <Text style={styles.backBtnText}>← Volver</Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: twColors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-evenly',
    paddingVertical: 24,
    gap: 20,
  },
  logoArea: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 20,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: twColors.primary + '20',
    borderWidth: 1.5,
    borderColor: twColors.primary + '60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 36,
    fontFamily: twFonts.bold,
    color: twColors.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    fontFamily: twFonts.regular,
    color: twColors.muted,
  },
  headlineArea: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  headline: {
    fontSize: 32,
    fontFamily: twFonts.bold,
    color: twColors.foreground,
    textAlign: 'center',
  },
  subheadline: {
    fontSize: 14,
    fontFamily: twFonts.regular,
    color: twColors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonsArea: { gap: 12 },
  pressed: { opacity: 0.75 },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: twRadius.sm,
    gap: 10,
  },
  googleButton: { backgroundColor: '#ffffff' },
  emailButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: twColors.border },
  submitButton: { backgroundColor: twColors.primary, marginTop: 4 },
  authButtonTextDark: { fontSize: 15, fontFamily: twFonts.medium, color: '#111111' },
  authButtonTextWhite: { fontSize: 15, fontFamily: twFonts.medium, color: twColors.foreground },
  submitText: { fontSize: 15, fontFamily: twFonts.bold, color: twColors.background },
  googleG: { fontSize: 18, fontFamily: twFonts.bold, color: '#4285F4' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: twColors.border },
  dividerText: { fontSize: 12, fontFamily: twFonts.regular, color: twColors.muted },
  footer: { alignItems: 'center', gap: 8, paddingBottom: 16 },
  footerText: { fontSize: 14, fontFamily: twFonts.regular, color: twColors.muted },
  footerLink: { color: twColors.primary, fontFamily: twFonts.medium },
  termsText: { fontSize: 11, fontFamily: twFonts.regular, color: twColors.muted, textAlign: 'center', lineHeight: 16 },
  termsLink: { color: twColors.muted, textDecorationLine: 'underline' },
  // Form
  formArea: { gap: 16, paddingTop: 8 },
  formTitle: { fontSize: 26, fontFamily: twFonts.bold, color: twColors.foreground },
  inputWrap: { gap: 6 },
  inputLabel: { fontSize: 13, fontFamily: twFonts.medium, color: twColors.mutedForeground },
  input: {
    backgroundColor: twColors.card,
    borderWidth: 1,
    borderColor: twColors.border,
    borderRadius: twRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: twFonts.regular,
    color: twColors.foreground,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'stretch' },
  eyeBtn: {
    backgroundColor: twColors.card,
    borderWidth: 1,
    borderColor: twColors.border,
    borderTopRightRadius: twRadius.sm,
    borderBottomRightRadius: twRadius.sm,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchText: { fontSize: 14, fontFamily: twFonts.regular, color: twColors.muted },
  switchLink: { fontSize: 14, fontFamily: twFonts.medium, color: twColors.primary },
  backBtn: { alignSelf: 'center', paddingVertical: 8 },
  backBtnText: { fontSize: 13, fontFamily: twFonts.medium, color: twColors.muted },
});
