// src/components/features/Stars.tsx
// Reusable background stars — used on every night-sky screen

import { useState } from 'react';
import { View } from 'react-native';

interface Props {
  count?: number;
  heightPercent?: number;
}

export function Stars({ count = 30, heightPercent = 50 }: Props) {
  const [stars] = useState(() =>
    Array.from({ length: count }, () => ({
      top: Math.random() * heightPercent,
      left: Math.random() * 100,
      size: Math.random() * 2 + 0.4,
      opacity: Math.random() * 0.22 + 0.04,
    }))
  );

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: `${heightPercent}%` as any,
        zIndex: 1,
      }}
      pointerEvents="none"
    >
      {stars.map((s, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: `${s.top}%` as any,
            left: `${s.left}%` as any,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            borderRadius: 10,
            backgroundColor: '#FFF',
          }}
        />
      ))}
    </View>
  );
}