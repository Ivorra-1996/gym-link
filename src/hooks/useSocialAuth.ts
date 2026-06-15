import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { useEffect, useRef } from 'react';
import { auth } from '@/services/firebase';

WebBrowser.maybeCompleteAuthSession();

// ─── Configuración Google Sign-In (native) ────────────────────────────────────
// 1. Firebase Console → Authentication → Sign-in method → Google
// 2. Expandí "Configuración del SDK web"
// 3. Copiá el "ID de cliente web" y pegalo acá
// 4. En Google Cloud Console → Credenciales → ese mismo cliente web →
//    Agregá el redirect URI que aparece en los logs de Metro cuando iniciás la app
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

export function useSocialAuth(onError?: (msg: string) => void) {
  const onErrorRef = useRef(onError);
  useEffect(() => { onErrorRef.current = onError; });

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (request?.url) {
      const match = request.url.match(/redirect_uri=([^&]+)/);
      if (match) {
        console.log(
          '[GoogleAuth] Agregá este Redirect URI en Google Cloud Console:\n',
          decodeURIComponent(match[1])
        );
      }
    }
  }, [request?.url]);

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params.id_token;
      if (!idToken) {
        onErrorRef.current?.('No se pudo iniciar sesión con Google. Intentá de nuevo.');
        return;
      }
      const credential = GoogleAuthProvider.credential(idToken);
      signInWithCredential(auth, credential).catch(() => {
        onErrorRef.current?.('No se pudo iniciar sesión con Google. Intentá de nuevo.');
      });
    } else if (response?.type === 'error') {
      onErrorRef.current?.('No se pudo iniciar sesión con Google. Intentá de nuevo.');
    }
  }, [response]);

  const signInWithGoogle = async () => {
    if (!GOOGLE_WEB_CLIENT_ID) {
      onErrorRef.current?.('Falta configurar el inicio de sesión con Google.');
      return;
    }
    await promptAsync();
  };

  return { signInWithGoogle };
}
