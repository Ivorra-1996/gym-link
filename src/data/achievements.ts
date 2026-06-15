import {
  Calendar,
  Dumbbell,
  Flag,
  Flame,
  Moon,
  Sun,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react-native';
import { WorkoutSession } from '@/types';
import { calculateMaxStreak } from '@/utils/workout';

export interface AchievementProgress {
  current: number;
  total: number;
  unit?: string;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  check: (sessions: WorkoutSession[]) => boolean;
  progress?: (sessions: WorkoutSession[]) => AchievementProgress;
}

function maxWeightEver(sessions: WorkoutSession[]): number {
  return sessions.reduce(
    (max, s) =>
      s.exercises.reduce(
        (eMax, ex) => ex.sets.reduce((sMax, set) => Math.max(sMax, set.weight), eMax),
        max
      ),
    0
  );
}

function maxVolumeInSession(sessions: WorkoutSession[]): number {
  return sessions.reduce((max, s) => Math.max(max, s.totalVolume), 0);
}

function maxWeekSessionCount(sessions: WorkoutSession[]): number {
  if (sessions.length === 0) return 0;
  const weekCounts: Record<string, number> = {};
  for (const s of sessions) {
    const d = new Date(s.startedAt);
    const daysFromMon = d.getDay() === 0 ? 6 : d.getDay() - 1;
    const mon = new Date(d);
    mon.setDate(d.getDate() - daysFromMon);
    mon.setHours(0, 0, 0, 0);
    const key = String(mon.getTime());
    weekCounts[key] = (weekCounts[key] ?? 0) + 1;
  }
  return Math.max(...Object.values(weekCounts));
}

function hadPerfectWeek(sessions: WorkoutSession[]): boolean {
  return maxWeekSessionCount(sessions) >= 5;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_session',
    name: 'Primer paso',
    description: 'Completaste tu primer entrenamiento',
    icon: Flag,
    check: (s) => s.length >= 1,
    progress: (s) => ({ current: Math.min(s.length, 1), total: 1, unit: 'sesión' }),
  },
  {
    id: 'streak_3',
    name: 'En racha',
    description: '3 días seguidos entrenando',
    icon: Flame,
    check: (s) => calculateMaxStreak(s) >= 3,
    progress: (s) => ({ current: Math.min(calculateMaxStreak(s), 3), total: 3, unit: 'días' }),
  },
  {
    id: 'streak_7',
    name: 'Dedicado',
    description: '7 días seguidos sin parar',
    icon: Zap,
    check: (s) => calculateMaxStreak(s) >= 7,
    progress: (s) => ({ current: Math.min(calculateMaxStreak(s), 7), total: 7, unit: 'días' }),
  },
  {
    id: 'sessions_10',
    name: '10 sesiones',
    description: 'Completaste 10 entrenamientos',
    icon: Dumbbell,
    check: (s) => s.length >= 10,
    progress: (s) => ({ current: Math.min(s.length, 10), total: 10, unit: 'sesiones' }),
  },
  {
    id: 'sessions_50',
    name: '50 sesiones',
    description: 'Completaste 50 entrenamientos',
    icon: Trophy,
    check: (s) => s.length >= 50,
    progress: (s) => ({ current: Math.min(s.length, 50), total: 50, unit: 'sesiones' }),
  },
  {
    id: 'early_bird',
    name: 'Madrugador',
    description: 'Completá un entrenamiento antes de las 7am',
    icon: Sun,
    check: (s) => s.some((session) => new Date(session.startedAt).getHours() < 7),
  },
  {
    id: 'night_owl',
    name: 'Nocturno',
    description: 'Completá un entrenamiento después de las 22hs',
    icon: Moon,
    check: (s) => s.some((session) => new Date(session.startedAt).getHours() >= 22),
  },
  {
    id: 'heavy_lifter',
    name: 'Heavy Lifter',
    description: 'Levantá 100kg o más en un ejercicio',
    icon: Target,
    check: (s) => maxWeightEver(s) >= 100,
    progress: (s) => ({ current: Math.min(Math.round(maxWeightEver(s)), 100), total: 100, unit: 'kg' }),
  },
  {
    id: 'big_volume',
    name: 'Volumen bestial',
    description: 'Alcanzá 5.000kg de volumen en una sola sesión',
    icon: TrendingUp,
    check: (s) => s.some((session) => session.totalVolume >= 5000),
    progress: (s) => ({ current: Math.min(Math.round(maxVolumeInSession(s)), 5000), total: 5000, unit: 'kg' }),
  },
  {
    id: 'perfect_week',
    name: 'Semana perfecta',
    description: 'Entrenás 5 o más veces en la misma semana',
    icon: Calendar,
    check: hadPerfectWeek,
    progress: (s) => ({ current: Math.min(maxWeekSessionCount(s), 5), total: 5, unit: 'días' }),
  },
];
