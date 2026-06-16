import { useEffect } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { borderWidth, twColors, twFonts, twRadius } from '@/constants/tailwind-runtime-theme';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: twColors.card,
    borderRadius: 16,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    gap: 8,
  },
  title: { fontSize: 17, fontFamily: twFonts.bold, color: twColors.foreground },
  message: { fontSize: 13, fontFamily: twFonts.regular, color: twColors.muted, lineHeight: 20 },
  error: { fontSize: 12, fontFamily: twFonts.medium, color: twColors.destructive },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: twRadius.sm,
    backgroundColor: twColors.card2 as string,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    alignItems: 'center',
  },
  cancelText: { fontSize: 14, fontFamily: twFonts.medium, color: twColors.foreground },
  confirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: twRadius.sm,
    backgroundColor: twColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destructiveBtn: { backgroundColor: twColors.destructive },
  confirmText: { fontSize: 14, fontFamily: twFonts.bold, color: twColors.background },
  btnDisabled: { opacity: 0.7 },
});

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  destructive,
  loading,
  error,
  onConfirm,
  onCancel,
}: Props) {
  const scale = useSharedValue(0.92);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 18, stiffness: 240 });
      opacity.value = withTiming(1, { duration: 180 });
    } else {
      scale.value = 0.92;
      opacity.value = 0;
    }
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, cardStyle]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.btnRow}>
            <Pressable style={styles.cancelBtn} onPress={onCancel} disabled={loading}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[
                styles.confirmBtn,
                destructive && styles.destructiveBtn,
                loading && styles.btnDisabled,
              ]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={destructive ? '#fff' : twColors.background} />
              ) : (
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
