/**
 * Solitaire Game Plugin
 *
 * Exports game configuration and components.
 */

export { solitaireConfig } from './config';
export { default as SolitaireGameScreen } from './screens/SolitaireGameScreen';

// Export components for potential reuse
export { PlayingCard } from './components/PlayingCard';
export { PlayingCardPremium } from './components/PlayingCardPremium';
export { DraggableCard } from './components/DraggableCard';
export { DraggableCardPremium } from './components/DraggableCardPremium';
export { WinCelebration } from './components/WinCelebration';
export { ParticleSystem } from './components/ParticleSystem';
