import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';

/**
 * TODO(backlog 8, Gustavo): leaderboard.
 * The API route is stubbed in apps/api/src/routes/leaderboard.ts.
 */
export default function LeaderboardScreen() {
  return (
    <Screen>
      <ThemedText type="subtitle">Leaderboard</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Coming soon.
      </ThemedText>
    </Screen>
  );
}
