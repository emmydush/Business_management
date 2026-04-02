class SoundManager {
  constructor() {
    this.audioContext = null;
    this.sounds = {};
    this.initialized = false;
  }

  // Initialize audio context on first user interaction
  init() {
    if (this.initialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (error) {
      console.warn('Audio not supported:', error);
    }
  }

  // Create a simple beep sound
  playBeep(frequency = 800, duration = 150) {
    if (!this.initialized) this.init();
    
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }

  // Play success sound (ascending tones)
  playSuccess() {
    this.playBeep(600, 100);
    setTimeout(() => this.playBeep(800, 100), 100);
  }

  // Play error sound (descending tone)
  playError() {
    this.playBeep(300, 200);
  }

  // Play scan sound (short beep)
  playScan() {
    this.playBeep(1000, 80);
  }
}

// Export singleton instance
export const soundManager = new SoundManager();

// Convenience functions
export const playSuccessSound = () => soundManager.playSuccess();
export const playErrorSound = () => soundManager.playError();
export const playScanSound = () => soundManager.playScan();
