/**
 * Programmatic school bell audio synthesizer using Web Audio API. 
 * Allows reliable, authentic sound synthesis entirely client-side.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Synthesizes a beautiful, cheerful, melodic chime for the Lesson Started (Green) notification.
 * Plays a bright rising arpeggio (E5 -> G#5 -> B5 -> E6) with crystalline decay.
 */
export function playLessonStartBell(volumeValue: number = 0.8) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Frequencies of E Major chords for a bright, clean, premium vibe
    const notes = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6
    const delayBetween = 0.15; // seconds
    const duration = 1.5; // seconds decay

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + (index * delayBetween));
      
      // Add subtle harmonics to sound metallic / crystalline
      const harmonic = ctx.createOscillator();
      const harmonicGain = ctx.createGain();
      harmonic.type = 'triangle';
      harmonic.frequency.setValueAtTime(freq * 2, now + (index * delayBetween));
      
      const startTime = now + (index * delayBetween);
      
      // Envelope setup
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volumeValue * 0.25, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      
      harmonicGain.gain.setValueAtTime(0, startTime);
      harmonicGain.gain.linearRampToValueAtTime(volumeValue * 0.05, startTime + 0.03);
      harmonicGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.8);
      
      osc.connect(gainNode);
      harmonic.connect(harmonicGain);
      
      gainNode.connect(ctx.destination);
      harmonicGain.connect(ctx.destination);
      
      osc.start(startTime);
      harmonic.start(startTime);
      
      osc.stop(startTime + duration);
      harmonic.stop(startTime + duration);
    });
  } catch (error) {
    console.error("Audio Synthesis Error: ", error);
  }
}

/**
 * Synthesizes a realistic, high-visibility mechanical school bell for the Lesson Finished (Red) notification.
 * It combines detuned oscillators and rapid amplitude modulation to recreate the metallic "clank-ring" of a classical school bell.
 */
export function playLessonEndBell(volumeValue: number = 0.8) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const duration = 2.5; // Rings for 2.5 seconds

    // Multi-frequency metallic synthesis for deep retro school bell ring
    // Detuned frequencies to represent rich iron/bronze resonance
    const frequencies = [440, 554, 659, 880, 1200];
    const oscillators: OscillatorNode[] = [];
    
    // Main Master Gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(volumeValue * 0.4, now + 0.05);
    // Exponential decay
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    masterGain.connect(ctx.destination);

    // Rapid Amplitudinal Modulator (Tremolo) to simulate the physical clapper striking the bell
    const tremolo = ctx.createOscillator();
    const tremoloGain = ctx.createGain();
    tremolo.type = 'sine';
    tremolo.frequency.setValueAtTime(15, now); // 15Hz rapid hammer strikes
    
    tremoloGain.gain.setValueAtTime(0.5, now);
    tremolo.connect(tremoloGain.gain);
    
    frequencies.forEach((freq) => {
      const osc = ctx.createOscillator();
      // Mix of sine/triangle/sawtooth to sound authentic
      osc.type = freq > 800 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      
      // Detune slightly for chorusing realism
      osc.detune.setValueAtTime((Math.random() - 0.5) * 30, now);
      
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(600, now);
      bandpass.Q.setValueAtTime(1.5, now);
      
      osc.connect(bandpass);
      bandpass.connect(masterGain);
      
      osc.start(now);
      oscillators.push(osc);
      osc.stop(now + duration);
    });

    tremolo.start(now);
    tremolo.stop(now + duration);
  } catch (error) {
    console.error("Audio Synthesis Error: ", error);
  }
}
