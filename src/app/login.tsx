import { useAuth } from '@/context/AuthContext';
import { twColors, twFonts, twRadius } from '@/constants/tailwind-runtime-theme';
import { Dumbbell, Mail } from 'lucide-react-native';
import React from 'react';
import {
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function LoginScreen() {
  const { signIn } = useAuth();

  const handleSignIn = () => {
    // TODO: conectar con Firebase Auth (Google / Apple / Email)
    signIn({ name: 'Jose Ivorra', email: 'jose@gymlink.app' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={twColors.background} />

      <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.logoArea}>
        <View style={styles.iconCircle}>
          <Dumbbell size={32} color={twColors.primary} />
        </View>
        <Text style={styles.appName}>GymLink</Text>
        <Text style={styles.tagline}>Tu compañero de gym</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.headlineArea}>
        <Text style={styles.headline}>Empezá hoy.</Text>
        <Text style={styles.subheadline}>
          Únete a miles de personas que ya mejoran cada día en el gym.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.buttonsArea}>
        <Pressable
          style={({ pressed }) => [styles.authButton, styles.googleButton, pressed && styles.pressed]}
          onPress={handleSignIn}
        >
          <Text style={styles.googleG}>G</Text>
          <Text style={styles.authButtonTextDark}>Continuar con Google</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.authButton, styles.appleButton, pressed && styles.pressed]}
          onPress={handleSignIn}
        >
          <Text style={styles.appleIcon}></Text>
          <Text style={styles.authButtonTextWhite}>Continuar con Apple</Text>
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          style={({ pressed }) => [styles.authButton, styles.emailButton, pressed && styles.pressed]}
          onPress={handleSignIn}
        >
          <Mail size={18} color={twColors.foreground} />
          <Text style={styles.authButtonTextWhite}>Continuar con email</Text>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(450).duration(600)} style={styles.footer}>
        <Text style={styles.footerText}>
          ¿Ya tenés cuenta?{' '}
          <Text style={styles.footerLink} onPress={handleSignIn}>
            Iniciá sesión
          </Text>
        </Text>
        <Text style={styles.termsText}>
          Al continuar aceptás los{' '}
          <Text style={styles.termsLink}>Términos de uso</Text>
          {' y '}
          <Text style={styles.termsLink}>Privacidad</Text>
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: twColors.background,
    paddingHorizontal: 24,
    justifyContent: 'space-evenly',
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
  buttonsArea: {
    gap: 12,
  },
  pressed: {
    opacity: 0.85,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: twRadius.sm,
    gap: 10,
  },
  googleButton: {
    backgroundColor: '#ffffff',
  },
  appleButton: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  emailButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: twColors.border,
  },
  authButtonTextDark: {
    fontSize: 15,
    fontFamily: twFonts.medium,
    color: '#111111',
  },
  authButtonTextWhite: {
    fontSize: 15,
    fontFamily: twFonts.medium,
    color: twColors.foreground,
  },
  googleG: {
    fontSize: 18,
    fontFamily: twFonts.bold,
    color: '#4285F4',
  },
  appleIcon: {
    fontSize: 18,
    color: '#ffffff',
    lineHeight: 22,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: twColors.border,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: twFonts.regular,
    color: twColors.muted,
  },
  footer: {
    alignItems: 'center',
    gap: 8,
    paddingBottom: 16,
  },
  footerText: {
    fontSize: 14,
    fontFamily: twFonts.regular,
    color: twColors.muted,
  },
  footerLink: {
    color: twColors.primary,
    fontFamily: twFonts.medium,
  },
  termsText: {
    fontSize: 11,
    fontFamily: twFonts.regular,
    color: twColors.muted,
    textAlign: 'center',
    lineHeight: 16,
  },
  termsLink: {
    color: twColors.muted,
    textDecorationLine: 'underline',
  },
});
