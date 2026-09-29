import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const subscribe = () => () => {};

/**
 * Static rendering has no color scheme, so the server and the first client render
 * use light, and the real scheme applies once hydrated. useSyncExternalStore
 * reports the server snapshot during hydration and the client one after, without
 * a setState inside an effect.
 */
export function useColorScheme() {
  const hasHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const colorScheme = useRNColorScheme();

  return hasHydrated ? colorScheme : 'light';
}
