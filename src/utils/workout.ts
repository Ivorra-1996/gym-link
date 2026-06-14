export function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

export function calculateVolume(weight: number, reps: number): number {
  return weight * reps;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatRestTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function parseWeight(value: string): number {
  return parseFloat(value.replace(',', '.')) || 0;
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function calculateStreak(sessions: { startedAt: number }[]): number {
  if (sessions.length === 0) return 0;

  const DAY = 86400000;
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  let cursor = todayMidnight.getTime();

  const trainedDays = new Set(
    sessions.map((s) => {
      const d = new Date(s.startedAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  // If didn't train today, start checking from yesterday
  if (!trainedDays.has(cursor)) cursor -= DAY;

  let streak = 0;
  while (trainedDays.has(cursor)) {
    streak++;
    cursor -= DAY;
  }
  return streak;
}

export interface PR {
  name: string;
  libraryId: string;
  weight: number;
}

export function detectPRs(
  newSession: { exercises: { libraryId: string; name: string; sets: { weight: number }[] }[] },
  previousSessions: { exercises: { libraryId: string; sets: { weight: number }[] }[] }[]
): PR[] {
  const prs: PR[] = [];
  for (const ex of newSession.exercises) {
    const newMax = Math.max(...ex.sets.map((s) => s.weight));
    if (newMax <= 0) continue;
    let prevMax = 0;
    for (const prev of previousSessions) {
      const prevEx = prev.exercises.find((e) => e.libraryId === ex.libraryId);
      if (prevEx) {
        const m = Math.max(...prevEx.sets.map((s) => s.weight));
        if (m > prevMax) prevMax = m;
      }
    }
    if (newMax > prevMax) prs.push({ name: ex.name, libraryId: ex.libraryId, weight: newMax });
  }
  return prs;
}

export function countWeekSessions(sessions: { startedAt: number }[]): number {
  const now = new Date();
  const dow = now.getDay();
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysFromMonday);
  weekStart.setHours(0, 0, 0, 0);
  return sessions.filter((s) => s.startedAt >= weekStart.getTime()).length;
}

export function getWeekTrainingDays(sessions: { startedAt: number }[]): number[] {
  const now = new Date();
  const dow = now.getDay(); // 0 = Sunday
  const daysFromMonday = dow === 0 ? 6 : dow - 1;

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysFromMonday);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const active = new Set<number>();
  sessions.forEach((s) => {
    const d = new Date(s.startedAt);
    if (d >= weekStart && d < weekEnd) {
      const day = d.getDay();
      active.add(day === 0 ? 6 : day - 1); // Mon=0..Sun=6
    }
  });
  return Array.from(active);
}

export function getPercentageTable(oneRM: number): { pct: number; weight: number; reps: number }[] {
  const table = [
    { pct: 100, reps: 1 },
    { pct: 95, reps: 2 },
    { pct: 90, reps: 4 },
    { pct: 85, reps: 5 },
    { pct: 80, reps: 6 },
    { pct: 75, reps: 8 },
    { pct: 70, reps: 10 },
    { pct: 65, reps: 12 },
    { pct: 60, reps: 15 },
  ];
  return table.map((row) => ({
    ...row,
    weight: Math.round((oneRM * row.pct) / 100),
  }));
}
