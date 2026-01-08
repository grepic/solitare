import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { PlayingCard } from './PlayingCard';
import { Card } from '@solitaire/engine';

interface DraggableCardProps {
  card: Card;
  isSelected: boolean;
  onDragStart?: () => void;
  onDragEnd?: (x: number, y: number) => void;
  disabled?: boolean;
}

export const DraggableCard: React.FC<DraggableCardProps> = ({
  card,
  isSelected,
  onDragStart,
  onDragEnd,
  disabled = false,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(1);

  const handleGestureEvent = (event: any) => {
    translateX.value = event.nativeEvent.translationX;
    translateY.value = event.nativeEvent.translationY;
  };

  const handleStateChange = (event: any) => {
    if (event.nativeEvent.state === State.BEGAN) {
      scale.value = withSpring(1.1);
      zIndex.value = 1000;
      if (onDragStart) {
        runOnJS(onDragStart)();
      }
    } else if (event.nativeEvent.state === State.END || event.nativeEvent.state === State.CANCELLED) {
      const finalX = event.nativeEvent.absoluteX;
      const finalY = event.nativeEvent.absoluteY;

      if (onDragEnd) {
        runOnJS(onDragEnd)(finalX, finalY);
      }

      // Reset position and scale
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      zIndex.value = 1;
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
  }));

  if (disabled) {
    return <PlayingCard card={card} isSelected={isSelected} />;
  }

  return (
    <PanGestureHandler
      onGestureEvent={handleGestureEvent}
      onHandlerStateChange={handleStateChange}
      enabled={!disabled}
    >
      <Animated.View style={[animatedStyle]}>
        <PlayingCard card={card} isSelected={isSelected} />
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});
