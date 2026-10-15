import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Redirect, Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/lib/auth-client';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  };
}

export default function TabsLayout() {
  const theme = useTheme();
  const { data: session, isPending } = useSession();

  if (!isPending && !session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.brand,
        tabBarInactiveTintColor: theme.locked,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          borderTopWidth: 2,
        },
      }}
    >
      <Tabs.Screen name="learn" options={{ title: 'Learn', tabBarIcon: tabIcon('home-variant') }} />
      <Tabs.Screen
        name="leaderboard"
        options={{ title: 'Leaderboard', tabBarIcon: tabIcon('trophy') }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('account') }} />
    </Tabs>
  );
}
