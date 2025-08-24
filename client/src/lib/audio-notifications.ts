// Audio notification utility for cafe manager dashboard

class AudioNotificationManager {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private isInitialized = false;

  // Initialize the audio context and create the notification sound
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a simple "ting" notification sound
      this.audioBuffer = this.createTingSound();
      
      this.isInitialized = true;
      console.log("🔊 Audio notification system initialized");
    } catch (error) {
      console.error("❌ Failed to initialize audio notifications:", error);
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

    if (!this.audioContext || !this.audioBuffer) {
      console.warn("⚠️ Audio notification system not available");
      return;
    }

    try {
      // Resume audio context if it's suspended (required by browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create and play the sound
      const source = this.audioContext.createBufferSource();
      source.buffer = this.audioBuffer;
      source.connect(this.audioContext.destination);
      source.start(0);

      console.log("🔊 Played notification sound");
    } catch (error) {
      console.error("❌ Failed to play notification sound:", error);
    }
  }

  // Play notification with user interaction (required by some browsers)
  async playNotificationWithUserInteraction() {
    // Try to play immediately
    await this.playNotification();
  }

  // Clean up resources
  dispose() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
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
