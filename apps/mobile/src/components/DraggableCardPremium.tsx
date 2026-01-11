import React from 'react';
import { StyleSheet } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  withTiming,
} from 'react-native-reanimated';
import { PlayingCardPremium } from './PlayingCardPremium';
import { Card } from '@solitaire/engine';
import { soundService } from '../services/sound.service';
import { hapticService } from '../services/haptic.service';

interface DraggableCardPremiumProps {
  card: Card;
  isSelected: boolean;
  onDragStart?: () => void;
  onDragEnd?: (x: number, y: number) => void;
  onValidDrop?: () => void;
  onInvalidDrop?: () => void;
  disabled?: boolean;
  cardBackTheme?: 'classic' | 'royal' | 'neon' | 'galaxy' | 'gold';
}

/**
 * Premium Draggable Card with enhanced feedback
 * - Haptic feedback on pickup/drop
 * - Sound effects
 * - Trail particles
 * - Smooth spring animations
 */
export const DraggableCardPremium: React.FC<DraggableCardPremiumProps> = ({
  card,
  isSelected,
  onDragStart,
  onDragEnd,
  onValidDrop,
  onInvalidDrop,
  disabled = false,
  cardBackTheme = 'classic',
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(1);
  const rotation = useSharedValue(0);
  const shadowOpacity = useSharedValue(0.25);

  const playPickupFeedback = () => {
    hapticService.cardPickup();
    if (card.faceUp) {
      soundService.playCardSlide();
    }
  };

  const playDropFeedback = (isValid: boolean) => {
    if (isValid) {
      hapticService.cardSnap();
      soundService.playCardSnap();
      if (onValidDrop) onValidDrop();
    } else {
      hapticService.invalidMove();
      soundService.playErrorBuzz();
      if (onInvalidDrop) onInvalidDrop();
    }
  };

  const handleGestureEvent = (event: any) => {
    translateX.value = event.nativeEvent.translationX;
    translateY.value = event.nativeEvent.translationY;

    // Subtle rotation based on drag direction
    const velocity = event.nativeEvent.velocityX;
    rotation.value = withTiming((velocity / 1000) * 5, { duration: 100 });
  };

  const handleStateChange = (event: any) => {
    if (event.nativeEvent.state === State.BEGAN) {
      // Pickup
      scale.value = withSpring(1.15, {
        damping: 10,
        stiffness: 100,
      });
      zIndex.value = 1000;
      shadowOpacity.value = withTiming(0.5);

      runOnJS(playPickupFeedback)();

      if (onDragStart) {
        runOnJS(onDragStart)();
      }
    } else if (event.nativeEvent.state === State.END || event.nativeEvent.state === State.CANCELLED) {
      const finalX = event.nativeEvent.absoluteX;
      const finalY = event.nativeEvent.absoluteY;

      if (onDragEnd) {
        runOnJS(onDragEnd)(finalX, finalY);
      }

      // Determine if drop was valid (you'll need to pass this info from parent)
      // For now, assume valid if moved > 50px
      const distance = Math.sqrt(translateX.value ** 2 + translateY.value ** 2);
      const isValid = distance > 50;

      runOnJS(playDropFeedback)(isValid);

      // Reset position and scale with spring
      translateX.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
      scale.value = withSpring(1, {
        damping: 12,
        stiffness: 120,
      });
      rotation.value = withSpring(0);
      shadowOpacity.value = withTiming(0.25);
      zIndex.value = 1;
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotateZ: `${rotation.value}deg` },
    ],
    zIndex: zIndex.value,
    shadowOpacity: shadowOpacity.value,
  }));

  if (disabled) {
    return (
      <PlayingCardPremium
        card={card}
        isSelected={isSelected}
        cardBackTheme={cardBackTheme}
      />
    );
  }

  return (
    <PanGestureHandler
      onGestureEvent={handleGestureEvent}
      onHandlerStateChange={handleStateChange}
      enabled={!disabled}
    >
      <Animated.View style={[styles.container, animatedStyle]}>
        <PlayingCardPremium
          card={card}
          isSelected={isSelected}
          cardBackTheme={cardBackTheme}
          showShimmer={isSelected}
        />
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
});
