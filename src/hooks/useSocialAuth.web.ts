import { GoogleAuthProvider, OAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/services/firebase';

export function useSocialAuth() {
  const signInWithGoogle = async () => {
    await signInWithPopup(auth, new GoogleAuthProvider());
  };

  const signInWithApple = async () => {
    await signInWithPopup(auth, new OAuthProvider('apple.com'));
  };

  return { signInWithGoogle, signInWithApple };
}
