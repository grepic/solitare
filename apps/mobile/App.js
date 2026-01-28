// IMPORTANT:
// This repo currently contains compiled JS output alongside TS/TSX sources.
// Expo's default resolution prefers `App.js` over `App.tsx`, which caused web
// to load an old compiled entry that imports native-only modules at startup.
//
// Keep App.js as a tiny proxy to ensure the staged TSX bootstrap is used.

export { default } from './App.tsx';