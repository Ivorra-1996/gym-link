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
