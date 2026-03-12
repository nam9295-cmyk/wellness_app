import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { atelierColors, atelierText } from '@/lib/atelierTheme';
import { spacing } from '@/lib/theme';
import { CWaterBlendResult } from '@/lib/cwaterBlendEngine';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 180;

interface CWaterSwipeDeckProps {
  blends: CWaterBlendResult[];
  onSelect: (blend: CWaterBlendResult) => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

export function CWaterSwipeDeck({ blends, onSelect, onSwipeStart, onSwipeEnd }: CWaterSwipeDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const position = useRef(new Animated.ValueXY()).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const suppressPressRef = useRef(false);
  const blendsSignature = useMemo(() => blends.map((blend) => blend.id).join('|'), [blends]);
  const previousSignatureRef = useRef(blendsSignature);

  useEffect(() => {
    if (previousSignatureRef.current === blendsSignature) {
      return;
    }

    previousSignatureRef.current = blendsSignature;
    setCurrentIndex(0);
    setIsDragging(false);
    position.setValue({ x: 0, y: 0 });
    rotation.setValue(0);
  }, [blendsSignature, position, rotation]);

  const visibleDeck = useMemo(() => {
    if (blends.length === 0) {
      return [];
    }

    const count = Math.min(blends.length, 3);
    return Array.from({ length: count }, (_, stackIndex) => ({
      blend: blends[(currentIndex + stackIndex) % blends.length],
      stackIndex,
    }));
  }, [blends, currentIndex]);

  const topCardOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 0.7, 0, SCREEN_WIDTH * 0.7],
    outputRange: [0.18, 1, 0.18],
    extrapolate: 'clamp',
  });

  const middleOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: [0.98, 0.9, 0.98],
    extrapolate: 'clamp',
  });

  const backOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: [0.9, 0.76, 0.9],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (event, gesture) => {
        // Claim responder ONLY if the gesture is clearly horizontal
        const isHorizontal = Math.abs(gesture.dx) > Math.abs(gesture.dy);
        const isSignificant = Math.abs(gesture.dx) > 10;
        return isHorizontal && isSignificant;
      },
      onMoveShouldSetPanResponderCapture: (event, gesture) => {
        const isHorizontal = Math.abs(gesture.dx) > Math.abs(gesture.dy);
        const isSignificant = Math.abs(gesture.dx) > 10;
        return isHorizontal && isSignificant;
      },
      onPanResponderGrant: () => {
        suppressPressRef.current = false;
        setIsDragging(true);
        onSwipeStart?.();
      },
      onPanResponderTerminationRequest: () => false, // Prevent ScrollView from stealing the gesture once claimed
      onPanResponderMove: (event, gesture) => {
        if (Math.abs(gesture.dx) > 6) {
          suppressPressRef.current = true;
        }

        position.setValue({ x: gesture.dx, y: 0 });
        // Calculate rotation based on drag distance
        const rotateValue = (gesture.dx / SCREEN_WIDTH) * 30; // Max 30 deg rotate
        rotation.setValue(rotateValue);
      },
      onPanResponderRelease: (event, gesture) => {
        setIsDragging(false);
        onSwipeEnd?.();
        if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left');
        } else {
          resetPosition();
        }
        setTimeout(() => {
          suppressPressRef.current = false;
        }, 160);
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        onSwipeEnd?.();
        resetPosition();
        setTimeout(() => {
          suppressPressRef.current = false;
        }, 160);
      }
    })
  ).current;

  const forceSwipe = (direction: 'left' | 'right') => {
    const x = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: true,
    }).start(() => onSwipeComplete());
  };

  const onSwipeComplete = () => {
    position.setValue({ x: 0, y: 0 });
    rotation.setValue(0);
    setCurrentIndex((prevIndex) => {
      if (blends.length === 0) {
        return 0;
      }

      return (prevIndex + 1) % blends.length;
    });
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
    Animated.spring(rotation, {
      toValue: 0,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  if (visibleDeck.length === 0) {
    return null;
  }

  return (
    <View style={styles.deckContainer}>
      {visibleDeck.slice().reverse().map(({ blend, stackIndex }) => {

        // Card 0 (Top)
        if (stackIndex === 0) {
          return (
            <Animated.View
              key={blend.id}
              {...panResponder.panHandlers}
              style={[
                styles.cardStyle,
                { zIndex: 3, position: 'absolute', top: 0, left: 0, right: 0 },
                {
                  opacity: topCardOpacity,
                  transform: [
                    { translateX: position.x },
                    {
                      rotate: rotation.interpolate({
                        inputRange: [-30, 30],
                        outputRange: ['-30deg', '30deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <CWaterCard
                blend={blend}
                disablePress={isDragging}
                onSelect={() => {
                  if (suppressPressRef.current || isDragging) {
                    return;
                  }
                  onSelect(blend);
                }}
              />
            </Animated.View>
          );
        }

        // Card 1 (Middle)
        if (stackIndex === 1) {
          return (
            <Animated.View
              key={blend.id}
              pointerEvents="none"
              style={[
                styles.cardStyle,
                {
                  opacity: middleOpacity,
                  zIndex: 2,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  transform: [
                    { translateY: 20 },
                    { scale: 0.92 },
                  ],
                },
              ]}
            >
              <CWaterCard blend={blend} disablePress onSelect={() => undefined} />
            </Animated.View>
          );
        }

        // Card 2 (Bottom)
        if (stackIndex === 2) {
          return (
            <Animated.View
              key={blend.id}
              pointerEvents="none"
              style={[
                styles.cardStyle,
                {
                  opacity: backOpacity,
                  zIndex: 1,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  transform: [
                    { translateY: 40 },
                    { scale: 0.84 },
                  ],
                },
              ]}
            >
              <CWaterCard blend={blend} disablePress onSelect={() => undefined} />
            </Animated.View>
          );
        }

        // Fallback for any extra cards (hidden)
        return null;
      })}
    </View>
  );
}

function CWaterCard({
  blend,
  onSelect,
  disablePress = false,
}: {
  blend: CWaterBlendResult;
  onSelect: () => void;
  disablePress?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.cWaterItem}
      disabled={disablePress}
      onPress={onSelect}
    >
      <View style={styles.aiBlendHeader}>
        <View style={styles.aiBlendToneWrap}>
          <View style={styles.cWaterToneBadge}>
            <Text style={styles.cWaterToneBadgeText}>C.WATER</Text>
          </View>
        </View>
        <View style={styles.cWaterScoreWrap}>
          <View style={styles.cWaterScorePill}>
            <Text style={styles.cWaterScoreText}>추천 {blend.recommendationScore.toFixed(1)}</Text>
          </View>
          <View style={styles.cWaterScorePill}>
            <Text style={styles.cWaterScoreText}>조화 {blend.harmonyScore.toFixed(1)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.cWaterTitle}>{blend.displayName}</Text>
      <Text style={styles.cWaterSummary} numberOfLines={2}>{blend.summary}</Text>
      <Text style={styles.cWaterDetail} numberOfLines={2}>{blend.detail}</Text>

      <View style={styles.cWaterMetaCard}>
        <Text style={styles.aiBlendMetaLabel}>구성 티</Text>
        <Text style={styles.cWaterIngredients} numberOfLines={1}>
          {blend.teas.map((tea) => tea.displayName).join(' · ')}
        </Text>
      </View>

      <View style={styles.cWaterChipWrap}>
        {blend.dominantTags.slice(0, 3).map((tag) => (
          <View key={tag} style={styles.cWaterChip}>
            <Text style={styles.cWaterChipText}>{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cWaterFooter}>
        <Text style={styles.cWaterFooterHint}>조합 상세 보기</Text>
        <Text style={styles.cWaterFooterArrow}>→</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  deckContainer: {
    // Make sure container is tall enough to hold the stack
    height: 400,
    width: '100%',
    position: 'relative',
  },
  cardStyle: {
    width: '100%',
  },
  cWaterItem: {
    backgroundColor: atelierColors.surface,
    borderRadius: 32,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    width: '100%',
    height: '100%',
  },
  aiBlendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  aiBlendToneWrap: {
    flexShrink: 1,
    gap: 6,
  },
  cWaterToneBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: atelierColors.deepGreen,
  },
  cWaterToneBadgeText: {
    ...atelierText.pill,
    color: atelierColors.surface,
    fontWeight: '600',
  },
  cWaterScoreWrap: {
    flexDirection: 'row',
    gap: 6,
  },
  cWaterScorePill: {
    backgroundColor: atelierColors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cWaterScoreText: {
    ...atelierText.helper,
    color: atelierColors.textSoft,
    fontWeight: '600',
  },
  cWaterTitle: {
    ...atelierText.cardTitleLg,
    fontSize: 26,
    fontWeight: '400',
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  cWaterSummary: {
    ...atelierText.summary,
    fontSize: 16,
    marginBottom: spacing.sm,
    fontWeight: '500',
    color: atelierColors.deepGreen,
    lineHeight: 26,
  },
  cWaterDetail: {
    ...atelierText.bodyMuted,
    fontSize: 14,
    lineHeight: 24,
    color: atelierColors.textSoft,
    marginBottom: spacing.lg,
  },
  cWaterMetaCard: {
    backgroundColor: atelierColors.surfaceMuted,
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  aiBlendMetaLabel: {
    ...atelierText.helper,
    color: atelierColors.textSoft,
    marginBottom: 4,
  },
  cWaterIngredients: {
    ...atelierText.body,
    fontSize: 14,
    color: atelierColors.deepGreen,
    fontWeight: '600',
  },
  cWaterChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  cWaterChip: {
    backgroundColor: atelierColors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: atelierColors.border,
  },
  cWaterChipText: {
    ...atelierText.helper,
    fontSize: 12,
    color: atelierColors.text,
    fontWeight: '500',
  },
  cWaterFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: atelierColors.border,
    marginTop: 'auto', // pushes footer to the bottom
  },
  cWaterFooterHint: {
    ...atelierText.helper,
    color: atelierColors.deepGreen,
    fontWeight: '600',
    fontSize: 13,
  },
  cWaterFooterArrow: {
    fontSize: 18,
    color: atelierColors.deepGreen,
  },
});
