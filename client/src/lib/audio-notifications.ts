// Audio notification utility for cafe manager dashboard

class AudioNotificationManager {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private customAudio: HTMLAudioElement | null = null;
  private isInitialized = false;
  private useCustomAudio = true; // Always use custom audio file
  private audioSrcBase = '/assets/ck-app-audio.wav';

  // Initialize the audio context and create the notification sound
  async initialize() {
    if (this.isInitialized) return;

    try {
      if (this.useCustomAudio) {
        // Use hardcoded custom audio file with cache-busting query param
        this.customAudio = new Audio(`${this.audioSrcBase}?v=${Date.now()}`);
        this.customAudio.preload = 'auto';
        
        // Set volume to 100% for maximum notification impact
        this.customAudio.volume = 1.0;
        
        console.log("🔊 Hardcoded custom audio notification system initialized");
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
        // Play custom audio file
        // Force reload latest file in case browser cached the old one
        const ts = Date.now();
        this.customAudio.src = `${this.audioSrcBase}?t=${ts}`;
        this.customAudio.load();
        this.customAudio.currentTime = 0; // Reset to beginning
        await this.customAudio.play();
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
