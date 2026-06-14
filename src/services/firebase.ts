import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyDKh1tFXHB8I7P9RQdilXNYV7uqb7TxzAI',
  authDomain: 'gym-link-api.firebaseapp.com',
  projectId: 'gym-link-api',
  storageBucket: 'gym-link-api.firebasestorage.app',
  messagingSenderId: '303836816300',
  appId: '1:303836816300:web:cf0adf96ba38a7fe479009',
};

const isFirstInit = getApps().length === 0;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();

// Web uses localStorage automatically; native needs AsyncStorage for persistence across restarts
export const auth =
  isFirstInit && Platform.OS !== 'web'
    ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
    : getAuth(app);

// On web: enable IndexedDB offline cache so writes resolve from local cache (not waiting for server ACK)
// On native: use default memory cache (Firestore native SDK handles its own persistence)
export const db =
  isFirstInit && Platform.OS === 'web'
    ? initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      })
    : getFirestore(app);
