import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { auth } from '@/services/firebase';

WebBrowser.maybeCompleteAuthSession();

// ─── Configuración Google Sign-In (native) ────────────────────────────────────
// 1. Firebase Console → Authentication → Sign-in method → Google
// 2. Expandí "Configuración del SDK web"
// 3. Copiá el "ID de cliente web" y pegalo acá
// 4. En Google Cloud Console → Credenciales → ese mismo cliente web →
//    Agregá el redirect URI que aparece en los logs de Metro cuando iniciás la app
const GOOGLE_WEB_CLIENT_ID = '303836816300-s0qerrp02uan7ad032hvf833pgfi9s7b.apps.googleusercontent.com';

export function useSocialAuth() {
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
        Alert.alert('Error', 'No se recibió el token de Google.');
        return;
      }
      const credential = GoogleAuthProvider.credential(idToken);
      signInWithCredential(auth, credential).catch(() => {
        Alert.alert('Error', 'No se pudo completar el inicio de sesión con Google.');
      });
    } else if (response?.type === 'error') {
      Alert.alert('Error', 'No se pudo iniciar sesión con Google.');
    }
  }, [response]);

  const signInWithGoogle = async () => {
    if (GOOGLE_WEB_CLIENT_ID === 'TU_WEB_CLIENT_ID.apps.googleusercontent.com') {
      Alert.alert(
        'Falta configurar',
        'Reemplazá GOOGLE_WEB_CLIENT_ID en src/hooks/useSocialAuth.ts con tu ID de cliente web de Firebase Console.'
      );
      return;
    }
    await promptAsync();
  };

  const signInWithApple = () => {
    Alert.alert(
      'Apple Sign-In',
      'Apple Sign-In en dispositivos nativos requiere un dev build y una cuenta de Apple Developer.'
    );
  };

  return { signInWithGoogle, signInWithApple };
}
