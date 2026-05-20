/**
 * backgroundKeepAlive.ts
 * Reliable client-side background thread keep-alive engine.
 * Leverages the Web Audio API and Media Session API to prevent browsers
 * from aggressively throttling or suspending setInterval timers when 
 * the phone screen is off or the browser is backgrounded.
 */

let backgroundAudioCtx: AudioContext | null = null;
let silentOscillator: OscillatorNode | null = null;

/**
 * Starts the sub-audible mechanical loop to prevent tab termination.
 */
export function startBackgroundKeepAlive() {
  try {
    // If already initialized, wake it up if needed
    if (backgroundAudioCtx) {
      if (backgroundAudioCtx.state === 'suspended') {
        backgroundAudioCtx.resume();
      }
      return;
    }

    // Initialize Web Audio context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('Web Audio API not supported on this device/browser.');
      return;
    }

    backgroundAudioCtx = new AudioContextClass();
    
    // Create an oscillator playing inaudible sub-sonic frequency (1Hz)
    const osc = backgroundAudioCtx.createOscillator();
    const gainNode = backgroundAudioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1, backgroundAudioCtx.currentTime); // 1Hz sub-audible wave
    gainNode.gain.setValueAtTime(0.000001, backgroundAudioCtx.currentTime); // Near-infinite silence
    
    osc.connect(gainNode);
    gainNode.connect(backgroundAudioCtx.destination);
    
    osc.start();
    silentOscillator = osc;

    // Register active media session state for OS media routing.
    // Tells the mobile OS (iOS/Android) that this app is playing media, hence preventing thread freezing.
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing';
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Öğretmen Sınıf Zili Arka Plan Motoru',
        artist: 'EkolZil.io Zaman Denetleyici',
        album: 'Arka Planda Kesintisiz Çan Zamanı'
      });
      
      // Hook up mock action handlers to keep session active
      const noop = () => {};
      navigator.mediaSession.setActionHandler('play', () => {
        if (backgroundAudioCtx && backgroundAudioCtx.state === 'suspended') {
          backgroundAudioCtx.resume();
        }
      });
      navigator.mediaSession.setActionHandler('pause', noop);
    }
    
    console.log('EkolZil background media engine has started successfully.');
  } catch (err) {
    console.error('Failed to start EkolZil background media engine:', err);
  }
}

/**
 * Stops the background keep-alive loop to save energy when logged out or explicitly turned off.
 */
export function stopBackgroundKeepAlive() {
  try {
    if (silentOscillator) {
      silentOscillator.stop();
      silentOscillator = null;
    }
    if (backgroundAudioCtx) {
      backgroundAudioCtx.close();
      backgroundAudioCtx = null;
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
    console.log('EkolZil background media engine has been deactivated.');
  } catch (err) {
    console.error('Error stopping background keep-alive:', err);
  }
}
