import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/services/firebase';

type User = { name: string; email: string; uid: string } | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

async function ensureUserProfile(uid: string, email: string, displayName: string): Promise<void> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      email,
      displayName,
      photoURL: '',
      gymId: '',
      genero: '',
      altura: 0,
      peso: 0,
      distanciaMaxima: 0,
      visibleEnMapa: false,
      compartirUbicacion: false,
      buscarMatches: false,
      notificacionesActivas: false,
      intervaloAgua: 0,
      idioma: 'es',
      tema: 'dark',
      objetivos: [],
      objetivosMatch: [],
      horarios: [],
      fechaNacimiento: null,
      fechaRegistro: new Date().toISOString(),
    });
  } else {
    await setDoc(ref, { uid, email, displayName }, { merge: true });
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const name = fbUser.displayName ?? fbUser.email?.split('@')[0] ?? 'Usuario';
        // Set user immediately — don't block navigation on Firestore
        setUser({ uid: fbUser.uid, email: fbUser.email ?? '', name });
        setLoading(false);
        // Update Firestore profile in background
        ensureUserProfile(fbUser.uid, fbUser.email ?? '', name).catch(() => {});
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await ensureUserProfile(cred.user.uid, email, name);
    setUser({ uid: cred.user.uid, email, name: name });
  };

  const signOut = async () => {
    await fbSignOut(auth);
  };

  const refreshUser = () => {
    const fbUser = auth.currentUser;
    if (fbUser) {
      const name = fbUser.displayName ?? fbUser.email?.split('@')[0] ?? 'Usuario';
      setUser({ uid: fbUser.uid, email: fbUser.email ?? '', name });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
