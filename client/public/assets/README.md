# Custom Notification Sounds

This directory contains audio files for the cafe manager dashboard notifications.

## Current Files:
- `ck-app-audio.wav` - **HARDCODED** notification sound (plays at 100% volume)
- `notification-sound.wav` - Backup notification sound (fallback)

## Hardcoded Audio Setup:

### Custom Audio File:
- **File**: `ck-app-audio.wav`
- **Volume**: 100% (hardcoded)
- **Usage**: Automatically plays when new orders arrive
- **No User Control**: Cafe managers cannot modify this setting

### How to Update the Custom Sound:
1. Replace `ck-app-audio.wav` with your custom audio file
2. Keep the same filename: `ck-app-audio.wav`
3. Ensure the file is in WAV format and under 2MB
4. The system will automatically use it at 100% volume

### Recommended Audio Specifications:
- **Format**: MP3, WAV, or OGG
- **Duration**: 1-3 seconds
- **File Size**: Under 2MB
- **Quality**: 44.1kHz, 128kbps or higher
- **Volume**: Normalized to avoid sudden loud sounds

### Popular Notification Sound Types:
- **Bell chime** - Classic notification sound
- **Digital beep** - Modern tech sound
- **Gentle ping** - Soft, pleasant tone
- **Cash register** - Cafe-themed sound
- **Kitchen bell** - Restaurant-style notification

### Free Sound Resources:
- [Freesound.org](https://freesound.org/) - Free sound effects
- [Zapsplat](https://www.zapsplat.com/) - Professional sound library
- [SoundBible](http://soundbible.com/) - Simple sound effects

### Creating Your Own:
You can create custom notification sounds using:
- **Audacity** (free audio editor)
- **GarageBand** (Mac)
- **Online audio generators**
- **Mobile apps** for sound creation

## File Structure:
```
client/public/assets/
├── ck-app-audio.wav          # HARDCODED notification sound (100% volume)
├── notification-sound.wav    # Backup notification sound
└── README.md                 # This file
```

## Technical Notes:
- Audio files are served statically from the `/assets/` directory
- The system uses WAV format for optimal compatibility
- Volume is hardcoded to 100% for maximum notification impact
- Fallback to generated sound if custom audio fails
- No user controls - audio is automatically managed by the system
