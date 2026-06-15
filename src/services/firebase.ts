import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { Persistence, getAuth, initializeAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyDKh1tFXHB8I7P9RQdilXNYV7uqb7TxzAI",
  authDomain: "gym-link-api.firebaseapp.com",
  projectId: "gym-link-api",
  storageBucket: "gym-link-api.firebasestorage.app",
  messagingSenderId: "303836816300",
  appId: "1:303836816300:web:cf0adf96ba38a7fe479009",
  measurementId: "G-0NLD1YGT2N",
};

const isFirstInit = getApps().length === 0;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();

// Web uses localStorage automatically; native needs AsyncStorage for persistence across restarts.
// getReactNativePersistence only exists in the Metro/RN build of firebase/auth (not the web TS types),
// so we require() it dynamically to avoid a compile-time type error.
function buildAuth() {
  if (!isFirstInit) return getAuth(app);
  if (Platform.OS === "web") return getAuth(app);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getReactNativePersistence } = require("firebase/auth") as {
    getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
  };
  return initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export const auth = buildAuth();

export const db = isFirstInit
  ? initializeFirestore(app, { experimentalForceLongPolling: true }, 'default')
  : getFirestore(app, 'default');
