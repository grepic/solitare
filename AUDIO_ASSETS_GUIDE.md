# 🔊 Audio Assets Guide

## Current Status
✅ Sound service fully implemented
⚠️ Audio files NOT included (placeholders needed)

---

## Required Audio Files

Add these audio files to `/apps/mobile/assets/sounds/`:

### Game Sounds (8 files)
1. **card_flip.mp3** (0.2s) - Card turning over
2. **card_snap.mp3** (0.3s) - Card locking into place
3. **card_slide.mp3** (0.15s) - Card being dragged
4. **draw_card.mp3** (0.2s) - Drawing from stock
5. **foundation_drop.mp3** (0.4s) - Successful foundation placement
6. **win_fanfare.mp3** (2-3s) - Victory celebration
7. **error_buzz.mp3** (0.3s) - Invalid move
8. **button_tap.mp3** (0.1s) - UI button click

---

## Where to Get Sounds

### Option 1: Free Sound Libraries (Recommended)
**Freesound.org** (Creative Commons)
- Search for: "card flip", "snap", "success", "error"
- Filter by license: CC0 (Public Domain)
- Download as MP3 (low file size)

**Example searches:**
- Card flip: https://freesound.org/search/?q=card+flip
- Success sound: https://freesound.org/search/?q=success+chime
- Error: https://freesound.org/search/?q=error+buzz

### Option 2: Premium Libraries (Paid)
- **Epidemic Sound** ($15/month) - High quality, royalty-free
- **AudioJungle** ($1-5 per sound) - Individual purchases
- **Artlist** ($16/month) - Unlimited downloads

### Option 3: Generate with AI (Free)
- **ElevenLabs Sound Effects** - AI-generated sounds
- **Soundraw** - AI music/sound generation

---

## File Specifications

### Format Requirements
- **Format:** MP3 (best compatibility)
- **Sample Rate:** 44.1kHz
- **Bit Rate:** 128kbps (good quality, small size)
- **Channels:** Mono (smaller files)

### Duration Guidelines
| Sound | Ideal Duration | Max Size |
|-------|---------------|----------|
| card_flip | 0.2s | ~5KB |
| card_snap | 0.3s | ~6KB |
| card_slide | 0.15s | ~4KB |
| draw_card | 0.2s | ~5KB |
| foundation_drop | 0.4s | ~8KB |
| win_fanfare | 2-3s | ~50KB |
| error_buzz | 0.3s | ~6KB |
| button_tap | 0.1s | ~3KB |

**Total size:** ~90KB (very small!)

---

## Installation Steps

### 1. Create directory structure
```bash
cd apps/mobile
mkdir -p assets/sounds
```

### 2. Add audio files
Download and place audio files:
```
apps/mobile/assets/sounds/
├── card_flip.mp3
├── card_snap.mp3
├── card_slide.mp3
├── draw_card.mp3
├── foundation_drop.mp3
├── win_fanfare.mp3
├── error_buzz.mp3
└── button_tap.mp3
```

### 3. Update sound.service.ts

Replace the `loadSounds()` function:

```typescript
private async loadSounds() {
  try {
    // Load all audio files
    const sounds = {
      [SoundService.CARD_FLIP]: require('../../assets/sounds/card_flip.mp3'),
      [SoundService.CARD_SNAP]: require('../../assets/sounds/card_snap.mp3'),
      [SoundService.CARD_SLIDE]: require('../../assets/sounds/card_slide.mp3'),
      [SoundService.DRAW_CARD]: require('../../assets/sounds/draw_card.mp3'),
      [SoundService.FOUNDATION_DROP]: require('../../assets/sounds/foundation_drop.mp3'),
      [SoundService.WIN_FANFARE]: require('../../assets/sounds/win_fanfare.mp3'),
      [SoundService.ERROR_BUZZ]: require('../../assets/sounds/error_buzz.mp3'),
      [SoundService.BUTTON_TAP]: require('../../assets/sounds/button_tap.mp3'),
    };

    // Preload all sounds
    for (const [id, source] of Object.entries(sounds)) {
      const { sound } = await Audio.Sound.createAsync(source);
      this.sounds.set(id, sound);
    }

    console.log('✅ All sounds loaded successfully');
  } catch (error) {
    console.warn('Failed to load sounds:', error);
    // App will work without sounds (graceful fallback)
  }
}
```

### 4. Test
```bash
cd apps/mobile
npm start
# Press a key in simulator - should hear button tap
# Play game - should hear card sounds
```

---

## Temporary Workaround (Without Audio Files)

The app **works perfectly without audio files**! The sound service has graceful fallback.

**Current behavior:**
- Sound methods are called ✅
- Haptic feedback works ✅
- No audio plays (silent) ✅
- No crashes ✅

---

## Sound Design Tips

### Card Flip
- Short, crisp paper sound
- No reverb
- Think: flipping a playing card

### Card Snap
- Slightly louder than flip
- "Click" or "snap" sound
- Satisfaction feedback

### Card Slide
- Very subtle
- Continuous/loopable
- Low volume (0.3)

### Draw Card
- Similar to flip but slightly different pitch
- Quick and responsive

### Foundation Drop
- Most satisfying!
- Chime or "ding" sound
- Slightly longer (0.4s)

### Win Fanfare
- Triumphant!
- Multi-layered
- 2-3 seconds
- Celebratory tones

### Error Buzz
- Unpleasant but not annoying
- Low, short buzz
- Clear "no" feedback

### Button Tap
- Very short click
- Minimal, clean
- UI feedback only

---

## Testing Checklist

After adding audio files:

- [ ] Card flip sound plays when flipping card
- [ ] Card snap sound plays on successful drop
- [ ] Card slide sound plays during drag
- [ ] Draw card sound plays when tapping stock
- [ ] Foundation drop sound plays + sparkles appear
- [ ] Win fanfare plays + confetti + haptics
- [ ] Error buzz plays on invalid move
- [ ] Button tap plays on UI interactions
- [ ] Volume control works (Settings)
- [ ] Mute toggle works (Settings)

---

## Performance Optimization

### Lazy Loading (Optional)
Load sounds only when needed:

```typescript
async play(soundId: string) {
  // Check if sound is loaded
  if (!this.sounds.has(soundId)) {
    await this.loadSound(soundId);
  }

  const sound = this.sounds.get(soundId);
  await sound.playAsync();
}
```

### Unload Unused Sounds
```typescript
async unloadSound(soundId: string) {
  const sound = this.sounds.get(soundId);
  if (sound) {
    await sound.unloadAsync();
    this.sounds.delete(soundId);
  }
}
```

---

## Troubleshooting

### Sound not playing

**Check 1:** File exists
```bash
ls -la apps/mobile/assets/sounds/
```

**Check 2:** Metro bundler restarted
```bash
# Kill Metro and restart
npx expo start --clear
```

**Check 3:** Check console
```javascript
// In sound.service.ts
console.log('Playing sound:', soundId);
```

### Sound cuts off

**Solution:** Increase duration or remove fade-out

### Sound too loud/quiet

**Solution:** Adjust volume in play call:
```typescript
soundService.playCardFlip(); // Default volume
soundService.play(SoundService.CARD_FLIP, 0.3); // 30% volume
```

---

## License Compliance

**IMPORTANT:** Ensure audio files have proper licenses!

### Safe Options:
- ✅ CC0 (Public Domain) - No attribution needed
- ✅ CC-BY - Attribution required (add to About screen)
- ✅ Purchased commercial license
- ✅ Self-created sounds

### Avoid:
- ❌ Copyrighted sounds from games/movies
- ❌ Sounds without clear license
- ❌ "Free for personal use only" (this is commercial)

---

## Next Steps

1. **Download sounds** from Freesound.org (30 mins)
2. **Add to assets/sounds/** (5 mins)
3. **Update loadSounds()** in sound.service.ts (5 mins)
4. **Test on device** (10 mins)
5. **Fine-tune volumes** (15 mins)

**Total time: ~1 hour** ⏱️

---

## Optional: Background Music

Want background music during gameplay?

```typescript
// In sound.service.ts
private bgMusic: Sound | null = null;

async playBackgroundMusic() {
  if (this.bgMusic) {
    await this.bgMusic.playAsync();
    await this.bgMusic.setIsLoopingAsync(true);
  }
}

async stopBackgroundMusic() {
  if (this.bgMusic) {
    await this.bgMusic.stopAsync();
  }
}
```

Add to assets:
```
assets/sounds/background_music.mp3 (loopable, 1-2 min)
```

---

## Resources

### Sound Libraries
- 🆓 **Freesound.org** - https://freesound.org
- 💰 **Epidemic Sound** - https://epidemicsound.com
- 💰 **AudioJungle** - https://audiojungle.net
- 🤖 **ElevenLabs** - https://elevenlabs.io/sound-effects

### Tools
- **Audacity** (Free) - Audio editing
- **ffmpeg** - Format conversion
  ```bash
  ffmpeg -i input.wav -b:a 128k output.mp3
  ```

---

**Status:**
- ✅ Sound service ready
- ⚠️ Audio files needed (1 hour task)
- 🎮 Game fully playable without audio

Add sounds when ready - app works perfectly either way! 🔊
