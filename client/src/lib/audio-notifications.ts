// Audio notification utility for cafe manager dashboard

class AudioNotificationManager {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private customAudio: HTMLAudioElement | null = null;
  private isInitialized = false;
  private useCustomAudio = true; // Always use custom audio file
  private audioSrcBase = '/assets/ck-app-audio.wav';
  private cacheBuster = `${Date.now()}`;
  private activationAttached = false;

  // Initialize the audio context and create the notification sound
  async initialize() {
    if (this.isInitialized) return;

    try {
      if (this.useCustomAudio) {
        // Use hardcoded custom audio file with cache-busting query param (once per load)
        this.customAudio = new Audio(`${this.audioSrcBase}?v=${this.cacheBuster}`);
        this.customAudio.preload = 'auto';
        
        // Set volume to 100% for maximum notification impact
        this.customAudio.volume = 1.0;
        this.customAudio.muted = false;
        
        console.log("🔊 Hardcoded custom audio notification system initialized");

        // Attach one-time user-gesture activation to satisfy autoplay policies
        this.attachActivationHandler();
      } else {
        // Use generated sound (fallback)
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.audioBuffer = this.createTingSound();
        console.log("🔊 Generated audio notification system initialized");
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error("❌ Failed to initialize audio notifications:", error);
      // Fallback to generated sound if custom audio fails
      this.useCustomAudio = false;
      await this.initializeGeneratedSound();
    }
  }

  // Initialize generated sound as fallback
  private async initializeGeneratedSound() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.audioBuffer = this.createTingSound();
      this.isInitialized = true;
      console.log("🔊 Fallback generated audio notification system initialized");
    } catch (error) {
      console.error("❌ Failed to initialize fallback audio:", error);
    }
  }

  // Create a simple "ting" notification sound using Web Audio API
  private createTingSound(): AudioBuffer {
    if (!this.audioContext) throw new Error("Audio context not initialized");

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.3; // 300ms
    const frequency = 800; // 800Hz for a pleasant "ting" sound
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const channelData = buffer.getChannelData(0);

    // Generate a simple sine wave with fade in/out
    for (let i = 0; i < buffer.length; i++) {
      const time = i / sampleRate;
      const fadeIn = Math.min(time / 0.05, 1); // 50ms fade in
      const fadeOut = Math.min((duration - time) / 0.1, 1); // 100ms fade out
      const envelope = fadeIn * fadeOut;
      
      channelData[i] = Math.sin(2 * Math.PI * frequency * time) * envelope * 0.3;
    }

    return buffer;
  }

  // Play the notification sound
  async playNotification() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      if (this.useCustomAudio && this.customAudio) {
        // Ensure audio is ready before playing
        const ensureReady = () => new Promise<void>((resolve) => {
          if (this.customAudio!.readyState >= 3) {
            resolve();
            return;
          }
          const onReady = () => {
            this.customAudio?.removeEventListener('canplaythrough', onReady);
            resolve();
          };
          this.customAudio!.addEventListener('canplaythrough', onReady, { once: true });
          // Fallback in case event doesn't fire quickly
          setTimeout(() => {
            this.customAudio?.removeEventListener('canplaythrough', onReady);
            resolve();
          }, 1000);
        });

        // Reset to start and play
        await ensureReady();
        this.customAudio.currentTime = 0;
        this.customAudio.muted = false;
        try {
          await this.customAudio.play();
        } catch (e) {
          // If autoplay is blocked, try to resume via activation handler
          console.warn('⚠️ Audio play blocked, waiting for user activation...', e);
          this.attachActivationHandler();
          return;
        }
        console.log("🔊 Played custom notification sound");
      } else if (this.audioContext && this.audioBuffer) {
        // Play generated sound
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffer;
        source.connect(this.audioContext.destination);
        source.start(0);
        console.log("🔊 Played generated notification sound");
      } else {
        console.warn("⚠️ Audio notification system not available");
      }
    } catch (error) {
      console.error("❌ Failed to play notification sound:", error);
      // Try fallback to generated sound
      if (this.useCustomAudio && !this.audioBuffer) {
        console.log("🔄 Trying fallback to generated sound...");
        this.useCustomAudio = false;
        await this.initializeGeneratedSound();
        await this.playNotification();
      }
    }
  }

  // Attach a one-time activation handler to unlock audio on first user gesture
  private attachActivationHandler() {
    if (this.activationAttached) return;
    const handler = async () => {
      try {
        if (!this.customAudio) return;
        const savedVolume = this.customAudio.volume;
        this.customAudio.volume = 0; // silent unlock
        this.customAudio.currentTime = 0;
        await this.customAudio.play();
        // Immediately pause after unlocking
        this.customAudio.pause();
        this.customAudio.volume = savedVolume;
        console.log('✅ Audio unlocked after user gesture');
      } catch (err) {
        console.warn('⚠️ Failed to unlock audio on gesture:', err);
      } finally {
        window.removeEventListener('pointerdown', handler);
        window.removeEventListener('keydown', handler);
        this.activationAttached = false;
      }
    };
    window.addEventListener('pointerdown', handler, { once: true });
    window.addEventListener('keydown', handler, { once: true });
    this.activationAttached = true;
  }

  // Play notification with user interaction (required by some browsers)
  async playNotificationWithUserInteraction() {
    await this.playNotification();
  }

  // Set custom audio file
  setCustomAudio(audioUrl: string) {
    if (this.customAudio) {
      this.customAudio.src = audioUrl;
      this.customAudio.load();
    } else {
      this.customAudio = new Audio(audioUrl);
      this.customAudio.preload = 'auto';
      this.customAudio.volume = 0.5;
    }
    this.useCustomAudio = true;
    console.log("🔊 Custom audio file set:", audioUrl);
  }

  // Set volume for custom audio (0.0 to 1.0)
  setVolume(volume: number) {
    if (this.customAudio) {
      this.customAudio.volume = Math.max(0, Math.min(1, volume));
      console.log("🔊 Volume set to:", volume);
    }
  }

  // Toggle between custom and generated audio
  toggleAudioType() {
    this.useCustomAudio = !this.useCustomAudio;
    console.log("🔊 Audio type switched to:", this.useCustomAudio ? "custom" : "generated");
  }

  // Clean up resources
  dispose() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.customAudio) {
      this.customAudio.pause();
      this.customAudio.src = '';
      this.customAudio = null;
    }
    this.audioBuffer = null;
    this.isInitialized = false;
  }
}

// Create a singleton instance
export const audioNotificationManager = new AudioNotificationManager();

// Export convenience functions
export const playNotificationSound = () => audioNotificationManager.playNotification();
export const initializeAudioNotifications = () => audioNotificationManager.initialize();
export const disposeAudioNotifications = () => audioNotificationManager.dispose();
export const setCustomNotificationSound = (audioUrl: string) => audioNotificationManager.setCustomAudio(audioUrl);
export const setNotificationVolume = (volume: number) => audioNotificationManager.setVolume(volume);
export const toggleAudioType = () => audioNotificationManager.toggleAudioType();
