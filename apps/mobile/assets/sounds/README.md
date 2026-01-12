# 🔊 Audio Assets - Download Guide

**Status:** ⚠️ Audio files needed (8 files)
**Priority:** CRITICAL
**Time:** 1-2 hours

---

## Required Files

Place these 8 MP3 files in this directory (`apps/mobile/assets/sounds/`):

### 1. card_flip.mp3 (0.2s)
**Sound:** Quick card flipping sound
**When Used:** Card is revealed/flipped
**Freesound:** https://freesound.org/search/?q=card+flip
**Recommended:**
- https://freesound.org/people/f4ngy/sounds/240776/ (Card Flip)
- https://freesound.org/people/Splicesound/sounds/377201/ (Playing Card)

### 2. card_snap.mp3 (0.3s)
**Sound:** Satisfying snap/click when card locks in place
**When Used:** Card successfully placed on foundation or tableau
**Freesound:** https://freesound.org/search/?q=snap+click
**Recommended:**
- https://freesound.org/people/kwahmah_02/sounds/256116/ (Click Snap)
- https://freesound.org/people/InspectorJ/sounds/403012/ (Snap)

### 3. card_slide.mp3 (0.15s)
**Sound:** Soft sliding/swoosh
**When Used:** Card being dragged
**Freesound:** https://freesound.org/search/?q=slide+swoosh
**Recommended:**
- https://freesound.org/people/josepharaoh99/sounds/361636/ (Swoosh)
- https://freesound.org/people/qubodup/sounds/60026/ (Card Slide)

### 4. draw_card.mp3 (0.2s)
**Sound:** Card being drawn from deck
**When Used:** Tapping stock pile
**Freesound:** https://freesound.org/search/?q=card+draw
**Recommended:**
- https://freesound.org/people/f4ngy/sounds/240777/ (Card Draw)
- https://freesound.org/people/Robinhood76/sounds/273332/ (Card Dealing)

### 5. foundation_drop.mp3 (0.4s)
**Sound:** Triumphant chime/ding
**When Used:** Card successfully placed on foundation pile
**Freesound:** https://freesound.org/search/?q=success+chime
**Recommended:**
- https://freesound.org/people/LittleRobotSoundFactory/sounds/270402/ (Success)
- https://freesound.org/people/Leszek_Szary/sounds/133283/ (Bell Ding)

### 6. win_fanfare.mp3 (2-3s)
**Sound:** Victory fanfare/celebration
**When Used:** Game won
**Freesound:** https://freesound.org/search/?q=victory+fanfare
**Recommended:**
- https://freesound.org/people/plasterbrain/sounds/397354/ (Victory Fanfare)
- https://freesound.org/people/LittleRobotSoundFactory/sounds/270333/ (Win Jingle)

### 7. error_buzz.mp3 (0.3s)
**Sound:** Error/wrong buzzer
**When Used:** Invalid move attempted
**Freesound:** https://freesound.org/search/?q=error+buzz
**Recommended:**
- https://freesound.org/people/Bertrof/sounds/351565/ (Wrong Buzzer)
- https://freesound.org/people/distillerystudio/sounds/327738/ (Error)

### 8. button_tap.mp3 (0.1s)
**Sound:** Subtle UI click
**When Used:** Button presses
**Freesound:** https://freesound.org/search/?q=button+click
**Recommended:**
- https://freesound.org/people/LittleRobotSoundFactory/sounds/270303/ (UI Click)
- https://freesound.org/people/Bertrof/sounds/131657/ (Button)

---

## Quick Download Steps

### Method 1: Freesound.org (Free - Recommended)

1. **Create Account** (free)
   - Visit https://freesound.org
   - Sign up (required to download)

2. **Download Each Sound**
   - Click recommended links above
   - Click "Download" button
   - Choose "Preview/Low Quality MP3" (sufficient for mobile)
   - Save to this directory

3. **Rename Files**
   ```bash
   # Rename downloaded files to match required names
   mv downloaded_file.mp3 card_flip.mp3
   # Repeat for all 8 files
   ```

### Method 2: AI Generation (Alternative)

**ElevenLabs Sound Effects** (Free tier available)
- Visit https://elevenlabs.io/sound-effects
- Describe each sound
- Generate and download
- Save as .mp3

**Example prompts:**
- "Quick card flipping sound effect, 0.2 seconds"
- "Satisfying snap click sound, 0.3 seconds"
- "Victory fanfare for game win, 2 seconds"

### Method 3: Purchase (Paid)

**AudioJungle** ($1-5 per sound)
- Visit https://audiojungle.net
- Search for each sound type
- Purchase and download
- Higher quality, commercial license

---

## File Specifications

**Format:** MP3
**Bitrate:** 128 kbps (mobile-optimized)
**Sample Rate:** 44.1 kHz
**Channels:** Mono (saves space)
**Max Size:** 50 KB per file

---

## Testing

After adding files, test in the app:

1. **Start app:**
   ```bash
   cd apps/mobile
   npx expo start
   ```

2. **Test each sound:**
   - Card flip: Tap face-down card
   - Card snap: Move card to foundation
   - Card slide: Drag any card
   - Draw card: Tap stock pile
   - Foundation drop: Successful foundation move
   - Win fanfare: Complete game
   - Error buzz: Try invalid move
   - Button tap: Tap any button

3. **Check console:**
   - Should see "✅ Loaded sound: card_flip.mp3"
   - If errors, check file paths and names

---

## Fallback (Temporary)

**App works WITHOUT audio files!**

Sound service has graceful fallback:
- Attempts to load audio
- If missing, logs warning
- Continues without sound
- No crashes

This allows development/testing without audio.

---

## Licensing

**Important:** Only use royalty-free sounds or sounds with proper license!

**Safe options:**
- ✅ CC0 (Public Domain) on Freesound
- ✅ Sounds you create/record yourself
- ✅ Purchased sounds with commercial license
- ❌ Copyrighted sounds without permission

---

## Future Enhancements

Optional improvements:
- Sound packs (multiple themes)
- Volume controls in settings
- Sound effect toggle
- Custom sound upload
- Different sounds per card theme

---

**Status:** Once 8 MP3 files are in this directory, sound system is 100% complete! 🔊
