import { Routine } from '@/types';

export function setupNotificationHandler() {}
export async function setupAndroidChannels() {}
export async function requestNotificationPermissions(): Promise<boolean> { return false; }
export async function checkNotificationPermissions(): Promise<boolean> { return false; }
export async function scheduleHydrationReminders(_intervalHours = 2): Promise<void> {}
export async function scheduleWorkoutReminders(_routines: Routine[]): Promise<void> {}
export async function enableNotifications(_routines: Routine[] = [], _intervalHours = 2): Promise<boolean> { return false; }
export async function cancelAllNotifications(): Promise<void> {}
