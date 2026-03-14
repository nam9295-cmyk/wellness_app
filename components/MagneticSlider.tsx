import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { atelierColors, atelierText } from '@/lib/atelierTheme';
import { spacing } from '@/lib/theme';

interface MagneticSliderProps {
  selectedValue: number;
  onSelect: (value: number) => void;
  leftLabel: string;
  rightLabel: string;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function MagneticSlider({
  selectedValue,
  onSelect,
  leftLabel,
  rightLabel,
  onDragStart,
  onDragEnd,
}: MagneticSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const panX = useRef(new Animated.Value(0)).current;
  const currentPos = useRef(0);
  const isInteracting = useRef(false);
  const numSteps = 5;
  const THUMB_SIZE = 28;

  // Sync internal ref with Animated Value
  useEffect(() => {
    const listenerId = panX.addListener(({ value }) => {
      currentPos.current = value;
    });
    return () => panX.removeListener(listenerId);
  }, [panX]);

  const getPositionForScore = (score: number, width: number) => {
    if (width <= 0) return 0;
    const ratio = (score - 1) / (numSteps - 1);
    return ratio * (width - THUMB_SIZE);
  };

  const getScoreForPosition = (x: number, width: number) => {
    if (width <= 0) return 1;
    const ratio = x / (width - THUMB_SIZE);
    const score = Math.round(ratio * (numSteps - 1)) + 1;
    return Math.max(1, Math.min(score, numSteps));
  };

  const getClampedPosition = (rawX: number) => {
    return Math.max(0, Math.min(trackWidth - THUMB_SIZE, rawX - THUMB_SIZE / 2));
  };

  // Initial and prop-change sync
  useEffect(() => {
    if (trackWidth > 0) {
      const targetX = getPositionForScore(selectedValue, trackWidth);
      Animated.spring(panX, {
        toValue: targetX,
        useNativeDriver: false,
        friction: 7,
        tension: 50,
      }).start();
    }
  }, [selectedValue, trackWidth]);

  const snapToClosestScore = () => {
    onDragEnd?.();
    const score = getScoreForPosition(currentPos.current, trackWidth);
    const snappedX = getPositionForScore(score, trackWidth);

    Animated.spring(panX, {
      toValue: snappedX,
      useNativeDriver: false,
      friction: 5,
      tension: 60,
    }).start(() => {
      onSelect(score);
    });
  };

  const fillWidth = panX.interpolate({
    inputRange: [0, Math.max(1, trackWidth - THUMB_SIZE)],
    outputRange: [THUMB_SIZE / 2, Math.max(THUMB_SIZE / 2, trackWidth - THUMB_SIZE / 2)],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <View
        style={styles.sliderContainer}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        <View
          style={styles.touchLayer}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(event) => {
            if (trackWidth <= 0) return;
            isInteracting.current = true;
            onDragStart?.();
            const pressedPosition = getClampedPosition(event.nativeEvent.locationX);
            panX.setValue(pressedPosition);
          }}
          onResponderMove={(event) => {
            if (!isInteracting.current || trackWidth <= 0) return;
            const nextPosition = getClampedPosition(event.nativeEvent.locationX);
            panX.setValue(nextPosition);
          }}
          onResponderRelease={() => {
            if (!isInteracting.current) return;
            isInteracting.current = false;
            snapToClosestScore();
          }}
          onResponderTerminate={() => {
            if (!isInteracting.current) return;
            isInteracting.current = false;
            snapToClosestScore();
          }}
        />
        <View style={styles.trackBackground}>
          <View style={styles.ticksContainer}>
            {[1, 2, 3, 4, 5].map((s) => <View key={s} style={styles.tick} />)}
          </View>
          {trackWidth > 0 && <Animated.View style={[styles.trackFill, { width: fillWidth }]} />}
        </View>

        {trackWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.thumb,
              {
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                borderRadius: THUMB_SIZE / 2,
                transform: [{ translateX: panX }]
              }
            ]}
          >
            <View style={styles.thumbInner} />
          </Animated.View>
        )}
      </View>

      <View style={styles.labelsRow}>
        <Text style={styles.scaleLabel}>{leftLabel}</Text>
        <Text style={styles.scaleLabel}>{rightLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', paddingVertical: spacing.md },
  sliderContainer: { height: 40, justifyContent: 'center', position: 'relative', marginBottom: spacing.xs },
  touchLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  trackBackground: { width: '100%', height: 6, backgroundColor: atelierColors.surfaceMuted, borderRadius: 3, borderWidth: 1, borderColor: atelierColors.border, justifyContent: 'center', overflow: 'hidden' },
  trackFill: { position: 'absolute', left: 0, top: -1, bottom: -1, backgroundColor: atelierColors.deepGreen, borderRadius: 3 },
  ticksContainer: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12 },
  tick: { width: 4, height: 4, borderRadius: 2, backgroundColor: atelierColors.borderStrong, zIndex: 1 },
  thumb: { position: 'absolute', top: 6, left: 0, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: atelierColors.borderStrong, justifyContent: 'center', alignItems: 'center', shadowColor: atelierColors.deepGreen, shadowOpacity: 0.15, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 3, zIndex: 10 },
  thumbInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: atelierColors.deepGreen },
  labelsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  scaleLabel: { ...atelierText.helper, color: atelierColors.textSoft },
});
