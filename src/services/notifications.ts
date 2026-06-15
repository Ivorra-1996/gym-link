import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Routine } from '@/types';

// Identificadores para poder cancelar notificaciones individualmente
const HYDRATION_ID = 'gymlink-hydration';
const WORKOUT_PREFIX = 'gymlink-workout-';

// Expo weekday: 1=Dom, 2=Lun, 3=Mar, 4=Mié, 5=Jue, 6=Vie, 7=Sáb
// App days:    0=Lun, 1=Mar, 2=Mié, 3=Jue, 4=Vie, 5=Sáb, 6=Dom
const APP_DAY_TO_EXPO_WEEKDAY = [2, 3, 4, 5, 6, 7, 1];

// ── Inicialización (llamar una sola vez al arrancar la app) ────────────────────

export function setupNotificationHandler() {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function setupAndroidChannels() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('hydration', {
    name: 'Hidratación',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
  });
  await Notifications.setNotificationChannelAsync('workout', {
    name: 'Entrenamientos',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

// ── Permisos ──────────────────────────────────────────────────────────────────

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function checkNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

// ── Hidratación ───────────────────────────────────────────────────────────────

export async function scheduleHydrationReminders(intervalHours = 2): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(HYDRATION_ID);
  } catch {}
  await Notifications.scheduleNotificationAsync({
    identifier: HYDRATION_ID,
    content: {
      title: 'Hidratación 💧',
      body: 'Acordate de tomar agua. Tu cuerpo te lo va a agradecer.',
      ...(Platform.OS === 'android' ? { channelId: 'hydration' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: intervalHours * 3600,
      repeats: true,
    },
  });
}

// ── Entrenamientos ────────────────────────────────────────────────────────────

export async function scheduleWorkoutReminders(routines: Routine[]): Promise<void> {
  if (Platform.OS === 'web') return;

  // Cancelar recordatorios previos
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(WORKOUT_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );

  // Recolectar días únicos con rutina asignada
  const days = new Set<number>();
  for (const routine of routines) {
    for (const day of routine.days ?? []) days.add(day);
  }

  for (const day of days) {
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `${WORKOUT_PREFIX}${day}`,
        content: {
          title: '💪 Día de entrenamiento',
          body: 'Tenés una rutina programada para hoy. ¡A moverla!',
          ...(Platform.OS === 'android' ? { channelId: 'workout' } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: APP_DAY_TO_EXPO_WEEKDAY[day],
          hour: 8,
          minute: 0,
        },
      });
    } catch {
      // Trigger semanal no soportado en este dispositivo — ignorar
    }
  }
}

// ── API principal ─────────────────────────────────────────────────────────────

export async function enableNotifications(
  routines: Routine[] = [],
  intervalHours = 2,
): Promise<boolean> {
  const granted = await requestNotificationPermissions();
  if (!granted) return false;
  await setupAndroidChannels();
  await scheduleHydrationReminders(intervalHours);
  if (routines.length > 0) await scheduleWorkoutReminders(routines);
  return true;
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
