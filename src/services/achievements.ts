import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { ACHIEVEMENTS } from '@/data/achievements';
import { WorkoutSession } from '@/types';
import { db } from './firebase';

export async function getUnlockedIds(uid: string): Promise<Set<string>> {
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'achievements'));
    return new Set(snap.docs.map((d) => d.id));
  } catch {
    return new Set();
  }
}

export async function checkAndUnlock(
  uid: string,
  sessions: WorkoutSession[]
): Promise<Set<string>> {
  const unlocked = await getUnlockedIds(uid);
  const writes: Promise<void>[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (!unlocked.has(achievement.id) && achievement.check(sessions)) {
      unlocked.add(achievement.id);
      writes.push(
        setDoc(doc(db, 'users', uid, 'achievements', achievement.id), {
          id: achievement.id,
          unlockedAt: Date.now(),
        })
      );
    }
  }

  if (writes.length > 0) await Promise.all(writes);
  return unlocked;
}
