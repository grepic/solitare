# Mobile App Assets

This directory contains all static assets for the mobile application.

## Sound Effects (`sounds/`)

The following sound files are required for full audio functionality:

- **card-flip.mp3** - Played when a card is flipped face-up
- **card-place.mp3** - Played when a card is placed on foundation or tableau
- **card-shuffle.mp3** - Played when deck is shuffled at game start
- **win.mp3** - Played when player wins a match
- **error.mp3** - Played when invalid move is attempted
- **button.mp3** - Played for UI button interactions

### Sound Specifications
- Format: MP3
- Sample rate: 44.1 kHz recommended
- Bitrate: 128-192 kbps
- Duration: 0.1-2 seconds (keep sounds short for responsiveness)

### Sources for Sound Effects
You can find free sound effects at:
- [Freesound.org](https://freesound.org/) (CC licensed)
- [Zapsplat.com](https://www.zapsplat.com/) (free with attribution)
- [Mixkit.co](https://mixkit.co/free-sound-effects/) (royalty-free)

### Graceful Degradation
The app will work without sound files - the `SoundService` has built-in error handling that gracefully fails if assets are missing. Sound features will simply be disabled.

## Images (`images/`)

Directory for app images and icons:
- Card face images (if custom card design is implemented)
- Tutorial illustrations
- Achievement badges
- Profile avatars (default)

## Notes

- Keep file sizes small for mobile performance
- Use compressed formats (MP3 for audio, WebP/PNG for images)
- All assets are loaded at runtime via React Native's `require()` system
- Asset files are bundled into the app during build process
