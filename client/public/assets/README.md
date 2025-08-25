# Custom Notification Sounds

This directory contains audio files for the cafe manager dashboard notifications.

## Current Files:
- `notification-sound.wav` - Default notification sound (you can replace this)

## How to Add Custom Sounds:

### Option 1: Replace the Default Sound
1. Replace `notification-sound.wav` with your custom audio file
2. Keep the same filename: `notification-sound.wav`
3. Ensure the file is in WAV, MP3, or OGG format and under 2MB

### Option 2: Upload via Dashboard
1. Go to the Cafe Manager Dashboard
2. Navigate to "Audio Notifications" section
3. Use the "Custom Audio File" upload feature
4. Select your audio file (MP3, WAV, or OGG format)

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
├── notification-sound.wav    # Default notification sound
└── README.md                 # This file
```

## Technical Notes:
- Audio files are served statically from the `/assets/` directory
- The system supports MP3, WAV, and OGG formats
- Volume control is available in the dashboard
- Fallback to generated sound if custom audio fails
