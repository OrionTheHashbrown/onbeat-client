/**
 * LOCK SCREEN + DYNAMIC ISLAND WIDGET – widgets/run-live-activity.tsx
 *
 * REFERENCE FROM
 * https://docs.expo.dev/versions/latest/sdk/widgets/
 * https://docs.expo.dev/versions/latest/sdk/ui/swift-ui/
 */

import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  activityBackgroundTint,
  background,
  font,
  foregroundStyle,
  monospacedDigit,
  padding,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, LiveActivityEnvironment } from 'expo-widgets';

export type RunActivityProps = {
  stageName: string | null;
  clockStartedAt: number; 
  pausedAt: number | null; 
  goalEndsAt: number | null; 
  distance: string;
  pace: string;
  note: string; 
  isWarning: boolean;
};

const RunActivity = (props: RunActivityProps, environment: LiveActivityEnvironment) => {
  'widget';

  const accent = '#FF832B';
  const accentDim = '#BF6220';
  const warn = '#FFD93D';
  const text = '#F6F4F2';
  const textSecondary = '#A19B97';
  const textMuted = '#66605B';
  const cardColour = '#161412';
  const onAccent = '#0B0A09';

  let brightColour = accent;
  if (environment.isLuminanceReduced) {
    brightColour = accentDim;
  }
  const isPaused = props.pausedAt !== null;
  const clockColour = isPaused ? textSecondary : brightColour;
  const clockRange = { lower: new Date(props.clockStartedAt), upper: new Date(props.clockStartedAt + 24 * 60 * 60 * 1000) };
  const pauseTime = props.pausedAt === null ? undefined : new Date(props.pausedAt);

  const runnerIcon = <Image systemName="figure.run" color={clockColour} size={14} />;

  const stageBadge =
    props.stageName === null ? null : (
      <Text
        modifiers={[
          font({ size: 11, weight: 'black' }),
          foregroundStyle(onAccent),
          padding({ horizontal: 7, vertical: 2 }),
          background(isPaused ? textSecondary : brightColour, shapes.capsule()),
        ]}
      >
        {isPaused ? 'PAUSED' : props.stageName}
      </Text>
    );

  const timeLeft =
    props.goalEndsAt === null ? null : (
      <HStack spacing={4}>
        <Text
          timerInterval={{ lower: new Date(props.clockStartedAt), upper: new Date(props.goalEndsAt) }}
          countsDown
          pauseTime={pauseTime}
          modifiers={[font({ size: 13, weight: 'semibold' }), monospacedDigit(), foregroundStyle(text)]}
        />
        <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(textMuted)]}>left</Text>
      </HStack>
    );

  const bigClock = (
    <Text
      timerInterval={clockRange}
      countsDown={false}
      pauseTime={pauseTime}
      modifiers={[font({ size: 38, weight: 'bold', design: 'rounded' }), monospacedDigit(), foregroundStyle(clockColour)]}
    />
  );

  const smallClock = (
    <Text
      timerInterval={clockRange}
      countsDown={false}
      pauseTime={pauseTime}
      modifiers={[font({ size: 13, weight: 'semibold' }), monospacedDigit(), foregroundStyle(clockColour)]}
    />
  );

  const distanceAndPace = (
    <VStack alignment="trailing" spacing={0}>
      <Text modifiers={[font({ size: 17, weight: 'bold' }), monospacedDigit(), foregroundStyle(text)]}>
        {props.distance}
      </Text>
      <Text modifiers={[font({ size: 12, weight: 'semibold' }), monospacedDigit(), foregroundStyle(textMuted)]}>
        {props.pace + ' /km'}
      </Text>
    </VStack>
  );

  const noteLine =
    props.note.length === 0 ? null : (
      <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle(props.isWarning ? warn : textSecondary)]}>
        {props.note}
      </Text>
    );

  return {
    // LOCK SCREEN
    banner: (
      <VStack alignment="leading" spacing={9} modifiers={[padding({ horizontal: 16, vertical: 13 }), activityBackgroundTint(cardColour)]}>
        <HStack spacing={8}>
          {runnerIcon}
          {stageBadge}
          <Spacer />
          {timeLeft}
        </HStack>
        <HStack spacing={10} alignment="lastTextBaseline">
          {bigClock}
          <Spacer />
          {distanceAndPace}
        </HStack>
        {noteLine}
      </VStack>
    ),
    // APPLE WATCH 
    bannerSmall: (
      <HStack spacing={10} modifiers={[padding({ horizontal: 14, vertical: 10 })]}>
        {runnerIcon}
        {smallClock}
        <Spacer />
        {distanceAndPace}
      </HStack>
    ),
    // DYNAMIC ISLAND 
    compactLeading: <Image systemName="figure.run" color={clockColour} size={13} />,
    compactTrailing: smallClock,
    minimal: <Image systemName="figure.run" color={clockColour} size={13} />,
    // DYNAMIC ISLAND 
    expandedLeading: (
      <VStack alignment="leading" spacing={2} modifiers={[padding({ leading: 6 })]}>
        {stageBadge}
        {bigClock}
      </VStack>
    ),
    expandedTrailing: (
      <VStack alignment="trailing" spacing={4} modifiers={[padding({ trailing: 6 })]}>
        {distanceAndPace}
        {timeLeft}
      </VStack>
    ),
    expandedBottom: (
      <VStack alignment="leading" modifiers={[padding({ horizontal: 6, top: 6 })]}>
        {noteLine}
      </VStack>
    ),
  };
};

export default createLiveActivity<RunActivityProps>('RunActivity', RunActivity);
