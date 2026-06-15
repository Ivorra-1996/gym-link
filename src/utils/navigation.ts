import { router } from 'expo-router';

export function goBack(fallback: string = '/') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback as never);
  }
}
