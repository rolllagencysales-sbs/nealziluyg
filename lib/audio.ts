// Web Audio API Synthesizer for school bells and alarm sounds - LOUD & ATTENTION-GRABBING

let activeSources: { oscillator: OscillatorNode; gain: GainNode }[] = [];
let audioCtx: AudioContext | null = null;
let melodyInterval: NodeJS.Timeout | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function stopBell() {
  if (melodyInterval) {
    clearInterval(melodyInterval);
    melodyInterval = null;
  }

  activeSources.forEach(({ oscillator, gain }) => {
    try {
      oscillator.stop();
      oscillator.disconnect();
      gain.disconnect();
    } catch (e) {
      // Already stopped
    }
  });
  activeSources = [];
}

export function playBell(type: string, volume: number = 1.0, durationSeconds: number = 8) {
  stopBell();
  
  const ctx = getAudioContext();
  
  // Use a compressor node to make the alarm sound consistently loud and compressed
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-15, ctx.currentTime);
  compressor.knee.setValueAtTime(30, ctx.currentTime);
  compressor.ratio.setValueAtTime(12, ctx.currentTime);
  compressor.attack.setValueAtTime(0.003, ctx.currentTime);
  compressor.release.setValueAtTime(0.25, ctx.currentTime);
  compressor.connect(ctx.destination);

  const mainGain = ctx.createGain();
  // Boost volume multiplier for attention-grabbing loudness
  mainGain.gain.setValueAtTime(volume * 1.5, ctx.currentTime);
  mainGain.connect(compressor);

  const startTime = ctx.currentTime;

  if (type === 'classic') {
    // PIERCING PHYSICAL SYNTHESIS OF A METALLIC SCHOOL BELL
    // Combining triangle and sine waves for rich clanging harmonics, passing through a high-pass filter
    const frequencies = [480, 590, 710, 830, 1150, 1500, 1950, 2400];
    
    const ringGain = ctx.createGain();
    ringGain.gain.setValueAtTime(0.6, startTime);
    // Exponential fade out only at the very end
    ringGain.gain.setValueAtTime(0.6, startTime + durationSeconds - 1.5);
    ringGain.gain.exponentialRampToValueAtTime(0.001, startTime + durationSeconds);
    ringGain.connect(mainGain);

    // Fast amplitude modulation LFO (hammer strike: 16Hz - rapid vibration)
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(16, startTime);
    
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.4, startTime); // Modulate deep clangs
    lfo.connect(lfoGain);

    // Un-offset LFO to fluctuate between 0.2 and 1.0
    const lfoOffset = ctx.createGain();
    lfoOffset.gain.setValueAtTime(0.6, startTime);

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      
      // Use triangle waves for middle frequencies to add a harsh buzz, sine for high metallic shimmers
      osc.type = idx < 4 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      
      const g = ctx.createGain();
      const baseGain = idx < 3 ? 0.35 : 0.25;
      g.gain.setValueAtTime(baseGain, startTime);
      
      osc.connect(g);
      g.connect(ringGain);
      osc.start(startTime);
      
      activeSources.push({ oscillator: osc, gain: g });
    });

    // LFO controls the clapper strike volume modulation
    lfoGain.connect(ringGain.gain);
    lfo.start(startTime);
    activeSources.push({ oscillator: lfo, gain: lfoGain });

    setTimeout(() => {
      stopBell();
    }, durationSeconds * 1000);

  } else if (type === 'melodic') {
    // LOUD MELODIC CHIME (Higher pitch & bright triangle waves)
    // Westminster chime sequence synthesized using loud triangle waves
    const notes = [
      659.25, // E5
      523.25, // C5
      587.33, // D5
      392.00, // G4
      659.25, // E5
      587.33, // D5
      523.25, // C5
      392.00  // G4
    ];
    let noteIndex = 0;
    const playNote = () => {
      if (ctx.state === 'suspended') return;
      const noteTime = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      
      // Use triangle wave for a bright flute-like/bell tone that cuts through
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(notes[noteIndex % notes.length], noteTime);
      
      g.gain.setValueAtTime(0.9, noteTime);
      g.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.7);
      
      osc.connect(g);
      g.connect(mainGain);
      
      osc.start(noteTime);
      osc.stop(noteTime + 0.7);
      
      activeSources.push({ oscillator: osc, gain: g });
      noteIndex++;
    };

    playNote();
    const intervalTime = 500; // fast melody
    let elapsed = 0;

    melodyInterval = setInterval(() => {
      elapsed += intervalTime;
      if (elapsed >= durationSeconds * 1000) {
        stopBell();
      } else {
        playNote();
      }
    }, intervalTime);

  } else if (type === 'digital') {
    // SHARP PIERCING DIGITAL BEEP
    // Loud, sharp square wave alarm that is impossible to ignore
    const playBeep = () => {
      if (ctx.state === 'suspended') return;
      const beepTime = ctx.currentTime;
      
      // Dual-tone square wave (beeps at 2800 Hz and 2900 Hz, human ear's peak sensitivity range)
      const osc1 = ctx.createOscillator();
      const g1 = ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(2800, beepTime);
      g1.gain.setValueAtTime(0.5, beepTime);
      g1.gain.setValueAtTime(0.001, beepTime + 0.08);
      osc1.connect(g1);
      g1.connect(mainGain);
      osc1.start(beepTime);
      osc1.stop(beepTime + 0.09);
      activeSources.push({ oscillator: osc1, gain: g1 });

      const osc2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(2800, beepTime + 0.12);
      g2.gain.setValueAtTime(0.5, beepTime + 0.12);
      g2.gain.setValueAtTime(0.001, beepTime + 0.20);
      osc2.connect(g2);
      g2.connect(mainGain);
      osc2.start(beepTime + 0.12);
      osc2.stop(beepTime + 0.21);
      activeSources.push({ oscillator: osc2, gain: g2 });
    };

    playBeep();
    const intervalTime = 800; // Repeat rapidly
    let elapsed = 0;

    melodyInterval = setInterval(() => {
      elapsed += intervalTime;
      if (elapsed >= durationSeconds * 1000) {
        stopBell();
      } else {
        playBeep();
      }
    }, intervalTime);

  } else {
    // SYNTH CHIME - ATTENTION VERSION
    // Rich synthesized chime using overlapping sawtooth and triangle waves for full thickness
    const freqs = [329.63, 392.00, 523.25, 659.25]; // E4, G4, C5, E5
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      
      // Alternating sawtooth and triangle to give it a rich synth lead sound
      osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      
      g.gain.setValueAtTime(0.25, startTime);
      g.gain.exponentialRampToValueAtTime(0.001, startTime + durationSeconds);
      
      osc.connect(g);
      g.connect(mainGain);
      
      osc.start(startTime);
      activeSources.push({ oscillator: osc, gain: g });
    });

    setTimeout(() => {
      stopBell();
    }, durationSeconds * 1000);
  }
}
