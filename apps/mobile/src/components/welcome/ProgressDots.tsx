// src/components/welcome/ProgressDots.tsx
// 5 dots positioned at the top of every onboarding screen.
// Active = amber 8px, inactive = white-15% 6px, 12px gap.
// "This is short" — reduces drop-off.

import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';

type Props = {
  step: 1 | 2 | 3 | 4 | 5;
  total?: number;
};

export function ProgressDots({ step, total = 5 }: Props) {
  return (
    <View style={s.row} accessibilityLabel={`Step ${step} of ${total}`}>
      {Array.from({ length: total }, (_, i) => {
        const idx = i + 1;
        const isActive = idx === step;
        return (
          <View
            key={idx}
            style={[s.dot, isActive ? s.active : s.inactive]}
          />
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  dot: {
    borderRadius: 999,
  },
  active: {
    width: 8,
    height: 8,
    backgroundColor: colors.amber,
  },
  inactive: {
    width: 6,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});
