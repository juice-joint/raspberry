# Raspberry 🎤

A blazingly fast, on-device karaoke app that just works. Built with Rust + React.

## Features

- Zero cloud dependency - runs 100% locally
- Smart song detection from your music library
- Real-time pitch detection & scoring
- Precise lyrics syncing and display
- Vocal isolation for instrumental tracks
- DASH streaming for smooth playback
- Actually decent UI (we promise)

## Getting Started

### Prerequisites
- Rust (latest stable)
- Node.js 16+
- Your own music files (MP3/WAV/FLAC)

### Quick Start

# Install dependencies
bun install

# Run in dev mode
bun run tauri dev

# Build for production
bun run tauri build

## Tech Stack

- Tauri (Desktop Application Engine)
- React + Vite (Frontend)
- Aubio (Audio processing)
- FFmpeg (Media handling)
- DASH for media streaming

## Contributing

PRs are super welcome!

---
Built with ❤️ by people who got tired of laggy karaoke apps
