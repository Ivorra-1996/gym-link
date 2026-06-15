import { useAuth } from '@/context/AuthContext';
import { useSocialAuth } from '@/hooks/useSocialAuth';
import { twColors, twFonts, twRadius } from '@/constants/tailwind-runtime-theme';
import { Check, Dumbbell, Eye, EyeOff, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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

// ── Seguridad de contraseña ────────────────────────────────────────────────────

const PASSWORD_REQS = [
  { key: 'length', label: 'Mínimo 12 caracteres',  test: (p: string) => p.length >= 12 },
  { key: 'upper',  label: 'Una letra mayúscula',    test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lower',  label: 'Una letra minúscula',    test: (p: string) => /[a-z]/.test(p) },
  { key: 'number', label: 'Un número',              test: (p: string) => /[0-9]/.test(p) },
  { key: 'symbol', label: 'Un símbolo (!@#$…)',     test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

const STRENGTH_LEVELS = [
  { label: 'Muy débil', color: '#ef4444' },
  { label: 'Muy débil', color: '#ef4444' },
  { label: 'Débil',     color: '#f97316' },
  { label: 'Regular',   color: '#eab308' },
  { label: 'Fuerte',    color: '#22c55e' },
  { label: 'Muy fuerte', color: twColors.primary },
];

function getScore(password: string): number {
  return PASSWORD_REQS.filter((r) => r.test(password)).length;
}

// ── Sub-componentes ────────────────────────────────────────────────────────────

function ReqRow({ met, label }: { met: boolean; label: string }) {
  return (
    <View style={styles.reqRow}>
      <View style={[styles.reqDot, met && styles.reqDotMet]}>
        {met && <Check size={8} color={twColors.background} strokeWidth={3} />}
      </View>
      <Text style={[styles.reqText, met && styles.reqTextMet]}>{label}</Text>
    </View>
  );
}

// ── Pantalla principal ─────────────────────────────────────────────────────────

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('home');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signInWithGoogle } = useSocialAuth((msg) => setError(msg));

  const clearError = () => { if (error) setError(null); };

  const score = getScore(password);
  const strength = STRENGTH_LEVELS[score];
  const allReqsMet = score === PASSWORD_REQS.length;
  const confirmMatches = confirmPassword.length > 0 && confirmPassword === password;
  const confirmMismatch = confirmPassword.length > 0 && confirmPassword !== password;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setError('No se pudo iniciar sesión con Google. Intentá de nuevo.');
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
      setError('Completá el email y la contraseña.');
      return;
    }

    if (mode === 'signup') {
      if (!trimName) {
        setError('Ingresá tu nombre.');
        return;
      }
      if (!allReqsMet) {
        setError('La contraseña no cumple todos los requisitos de seguridad.');
        return;
      }
      if (trimPass !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
      }
    }

    setError(null);
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(trimEmail, trimPass);
      } else {
        await signUp(trimEmail, trimPass, trimName);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (mode === 'signin') {
        setError(msg.includes('invalid-email')
          ? 'El email no es válido.'
          : 'Email o contraseña incorrectos.');
      } else {
        if (msg.includes('email-already-in-use')) {
          setError('Ya existe una cuenta con ese email. Iniciá sesión.');
        } else if (msg.includes('invalid-email')) {
          setError('El email no es válido.');
        } else {
          setError('No se pudo crear la cuenta. Intentá de nuevo.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setMode('home');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setShowPass(false);
    setShowConfirmPass(false);
    setError(null);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setShowPass(false);
    setShowConfirmPass(false);
  };

  // ── JSX ─────────────────────────────────────────────────────────────────────

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
          {/* Logo */}
          <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.logoArea}>
            <View style={styles.iconCircle}>
              <Dumbbell size={32} color={twColors.primary} />
            </View>
            <Text style={styles.appName}>GymLink</Text>
            <Text style={styles.tagline}>Tu compañero de gym</Text>
          </Animated.View>

          {/* Modo home */}
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
                  onPress={() => { setMode('signin'); setError(null); }}
                >
                  <Mail size={18} color={twColors.foreground} />
                  <Text style={styles.authButtonTextWhite}>Continuar con email</Text>
                </Pressable>

                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}
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

          {/* Modo signin / signup */}
          {(mode === 'signin' || mode === 'signup') && (
            <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.formArea}>
              <Text style={styles.formTitle}>
                {mode === 'signin' ? 'Iniciá sesión' : 'Creá tu cuenta'}
              </Text>

              {/* Nombre (solo signup) */}
              {mode === 'signup' && (
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>Nombre</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Tu nombre"
                    placeholderTextColor={twColors.muted}
                    value={name}
                    onChangeText={(v) => { setName(v); clearError(); }}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              )}

              {/* Email */}
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="tu@email.com"
                  placeholderTextColor={twColors.muted}
                  value={email}
                  onChangeText={(v) => { setEmail(v); clearError(); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Contraseña */}
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>
                  {mode === 'signup' ? 'Contraseña segura' : 'Contraseña'}
                </Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder={mode === 'signup' ? 'Mínimo 12 caracteres' : 'Tu contraseña'}
                    placeholderTextColor={twColors.muted}
                    value={password}
                    onChangeText={(v) => { setPassword(v); clearError(); }}
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable style={styles.eyeBtn} onPress={() => setShowPass((v) => !v)}>
                    {showPass
                      ? <EyeOff size={18} color={twColors.muted} />
                      : <Eye size={18} color={twColors.muted} />}
                  </Pressable>
                </View>

                {/* Barra de fuerza + requisitos (solo signup) */}
                {mode === 'signup' && password.length > 0 && (
                  <View style={styles.strengthWrap}>
                    {/* Barra */}
                    <View style={styles.strengthBarBg}>
                      <View
                        style={[
                          styles.strengthBarFill,
                          {
                            width: `${(score / PASSWORD_REQS.length) * 100}%` as any,
                            backgroundColor: strength.color,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.strengthLabel, { color: strength.color }]}>
                      {strength.label}
                    </Text>

                    {/* Checklist */}
                    <View style={styles.reqList}>
                      {PASSWORD_REQS.map((r) => (
                        <ReqRow key={r.key} met={r.test(password)} label={r.label} />
                      ))}
                    </View>
                  </View>
                )}
              </View>

              {/* Confirmar contraseña (solo signup) */}
              {mode === 'signup' && (
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>Confirmar contraseña</Text>
                  <View style={styles.passwordRow}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.passwordInput,
                        confirmMismatch && styles.inputError,
                        confirmMatches && styles.inputSuccess,
                      ]}
                      placeholder="Repetí tu contraseña"
                      placeholderTextColor={twColors.muted}
                      value={confirmPassword}
                      onChangeText={(v) => { setConfirmPassword(v); clearError(); }}
                      secureTextEntry={!showConfirmPass}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <Pressable style={styles.eyeBtn} onPress={() => setShowConfirmPass((v) => !v)}>
                      {showConfirmPass
                        ? <EyeOff size={18} color={twColors.muted} />
                        : <Eye size={18} color={twColors.muted} />}
                    </Pressable>
                  </View>
                  {confirmMatches && (
                    <Text style={styles.matchText}>✓ Las contraseñas coinciden</Text>
                  )}
                  {confirmMismatch && (
                    <Text style={styles.mismatchText}>Las contraseñas no coinciden</Text>
                  )}
                </View>
              )}

              {/* Error global */}
              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Botón submit */}
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
                <Pressable onPress={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}>
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
  container: { flex: 1, backgroundColor: twColors.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-evenly',
    paddingVertical: 24,
    gap: 20,
  },

  // Logo
  logoArea: { alignItems: 'center', gap: 10, paddingTop: 20 },
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
  appName: { fontSize: 36, fontFamily: twFonts.bold, color: twColors.primary, letterSpacing: -0.5 },
  tagline: { fontSize: 14, fontFamily: twFonts.regular, color: twColors.muted },

  // Home
  headlineArea: { alignItems: 'center', gap: 8, paddingHorizontal: 8 },
  headline: { fontSize: 32, fontFamily: twFonts.bold, color: twColors.foreground, textAlign: 'center' },
  subheadline: { fontSize: 14, fontFamily: twFonts.regular, color: twColors.muted, textAlign: 'center', lineHeight: 22 },
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

  // Formulario
  formArea: { gap: 16, paddingTop: 8 },
  formTitle: { fontSize: 26, fontFamily: twFonts.bold, color: twColors.foreground },
  inputWrap: { gap: 6 },
  inputLabel: { fontSize: 13, fontFamily: twFonts.medium, color: twColors.muted },
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
  inputError: { borderColor: twColors.destructive },
  inputSuccess: { borderColor: '#22c55e' },
  passwordRow: { flexDirection: 'row', alignItems: 'stretch' },
  passwordInput: {
    flex: 1,
    borderRightWidth: 0,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  eyeBtn: {
    backgroundColor: twColors.card,
    borderWidth: 1,
    borderColor: twColors.border,
    borderTopRightRadius: twRadius.sm,
    borderBottomRightRadius: twRadius.sm,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },

  // Fuerza de contraseña
  strengthWrap: { gap: 8, marginTop: 4 },
  strengthBarBg: {
    height: 4,
    borderRadius: 999,
    backgroundColor: twColors.border,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  strengthLabel: { fontSize: 11, fontFamily: twFonts.bold, textAlign: 'right' },
  reqList: { gap: 4 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reqDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: twColors.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reqDotMet: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  reqText: { fontSize: 12, fontFamily: twFonts.regular, color: twColors.muted },
  reqTextMet: { color: twColors.foreground },

  // Confirmar contraseña
  matchText: { fontSize: 12, fontFamily: twFonts.medium, color: '#22c55e' },
  mismatchText: { fontSize: 12, fontFamily: twFonts.medium, color: twColors.destructive },

  // Errores y navegación
  errorBox: {
    backgroundColor: twColors.destructive + '18',
    borderWidth: 1,
    borderColor: twColors.destructive + '50',
    borderRadius: twRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: { fontSize: 13, fontFamily: twFonts.medium, color: twColors.destructive, textAlign: 'center' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchText: { fontSize: 14, fontFamily: twFonts.regular, color: twColors.muted },
  switchLink: { fontSize: 14, fontFamily: twFonts.medium, color: twColors.primary },
  backBtn: { alignSelf: 'center', paddingVertical: 8 },
  backBtnText: { fontSize: 13, fontFamily: twFonts.medium, color: twColors.muted },
});
