import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { UnitSummary } from '@/lib/api-types';
import { nodeState, pathOffset, type NodeState } from '@/lib/skill-path';

const NODE = 64;
const CURRENT_NODE = 76;

/**
 * One unit of the skill tree: a coloured banner, then its lessons as a winding
 * path of round nodes. A locked unit still shows its lessons, greyed out, along
 * with what it is waiting on.
 */
export function UnitPath({
  unit,
  units,
  current,
}: {
  unit: UnitSummary;
  units: UnitSummary[];
  current: string | null;
}) {
  const theme = useTheme();
  // `order` is a sort key and starts at 0, so number units by their position in
  // the tree instead. The API already returns them in tree order.
  const position = units.findIndex((item) => item.id === unit.id) + 1;
  const completed = unit.lessons.filter((lesson) => lesson.status === 'completed').length;
  const requiredUnits = unit.prerequisites.map(
    (id) => `Unit ${units.findIndex((item) => item.id === id) + 1}`,
  );

  return (
    <View style={styles.unit}>
      <View
        accessible
        accessibilityRole="header"
        accessibilityLabel={`Unit ${position}: ${unit.title}. ${completed} of ${unit.lessons.length} lessons complete.`}
        style={[
          styles.banner,
          unit.unlocked
            ? { backgroundColor: theme.brand, borderBottomColor: theme.brandEdge }
            : { backgroundColor: theme.lockedSurface, borderBottomColor: theme.border },
        ]}
      >
        <Text
          style={[styles.bannerKicker, { color: unit.unlocked ? theme.brandText : theme.locked }]}
        >
          {`UNIT ${position} · ${completed}/${unit.lessons.length}`}
        </Text>
        <Text
          style={[styles.bannerTitle, { color: unit.unlocked ? theme.brandText : theme.locked }]}
        >
          {unit.title}
        </Text>
        {!unit.unlocked ? (
          <Text style={[styles.bannerNote, { color: theme.locked }]}>
            {`Complete ${requiredUnits.join(', ')} to unlock`}
          </Text>
        ) : null}
      </View>

      <View style={styles.path}>
        {unit.lessons.map((lesson, index) => (
          <PathNode
            key={lesson.id}
            lesson={lesson}
            state={nodeState(unit, lesson, current)}
            checkpoint={index === unit.lessons.length - 1}
            offset={pathOffset(index)}
          />
        ))}
      </View>
    </View>
  );
}

function PathNode({
  lesson,
  state,
  checkpoint,
  offset,
}: {
  lesson: UnitSummary['lessons'][number];
  state: NodeState;
  checkpoint: boolean;
  offset: number;
}) {
  const theme = useTheme();
  const size = state === 'current' ? CURRENT_NODE : NODE;

  const look = {
    completed: { face: theme.brand, edge: theme.brandEdge, icon: theme.brandText },
    current: { face: theme.brand, edge: theme.brandEdge, icon: theme.brandText },
    open: { face: theme.backgroundElement, edge: theme.elementEdge, icon: theme.brand },
    locked: { face: theme.lockedSurface, edge: theme.border, icon: theme.locked },
  }[state];

  const icon: keyof typeof MaterialCommunityIcons.glyphMap =
    state === 'completed'
      ? 'check-bold'
      : state === 'locked'
        ? 'lock'
        : checkpoint
          ? 'piggy-bank-outline'
          : 'star';

  const status =
    state === 'completed'
      ? `completed, best score ${lesson.bestScore}%`
      : state === 'locked'
        ? 'locked'
        : state === 'current'
          ? 'up next'
          : 'not started';

  const node = (pressed: boolean) => (
    <View style={[styles.nodeColumn, { transform: [{ translateX: offset }] }]}>
      {state === 'current' ? (
        <View
          style={[styles.bubble, { borderColor: theme.border, backgroundColor: theme.background }]}
        >
          <Text style={[styles.bubbleText, { color: theme.brand }]}>START</Text>
        </View>
      ) : null}
      <View
        style={[
          styles.node,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: look.face,
            borderBottomColor: look.edge,
            borderBottomWidth: pressed ? 2 : 6,
            marginTop: pressed ? 4 : 0,
          },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={size * 0.45} color={look.icon} />
      </View>
      <ThemedText
        type="small"
        themeColor={state === 'locked' ? 'locked' : 'textSecondary'}
        style={styles.nodeLabel}
        numberOfLines={2}
      >
        {lesson.title}
      </ThemedText>
    </View>
  );

  if (state === 'locked') {
    return (
      <View
        accessible
        accessibilityLabel={`${lesson.title}, ${status}`}
        accessibilityState={{ disabled: true }}
      >
        {node(false)}
      </View>
    );
  }

  return (
    <Link href={{ pathname: '/lesson/[lessonId]', params: { lessonId: lesson.id } }} asChild>
      <Pressable accessibilityRole="button" accessibilityLabel={`${lesson.title}, ${status}`}>
        {({ pressed }) => node(pressed)}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  unit: { gap: Spacing.four },
  banner: {
    borderRadius: 18,
    borderBottomWidth: 5,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three + Spacing.one,
    gap: Spacing.one,
  },
  bannerKicker: { fontFamily: Fonts.rounded, fontSize: 13, fontWeight: '800', letterSpacing: 0.8 },
  bannerTitle: { fontFamily: Fonts.rounded, fontSize: 20, lineHeight: 26, fontWeight: '800' },
  bannerNote: { fontSize: 14, fontWeight: '600' },
  path: { alignItems: 'center', gap: Spacing.three },
  nodeColumn: { alignItems: 'center', width: 150, gap: Spacing.one },
  node: { alignItems: 'center', justifyContent: 'center' },
  nodeLabel: { textAlign: 'center' },
  bubble: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: Spacing.two + Spacing.one,
    paddingVertical: Spacing.half,
    marginBottom: Spacing.one,
  },
  bubbleText: { fontFamily: Fonts.rounded, fontSize: 13, fontWeight: '800', letterSpacing: 0.8 },
});
