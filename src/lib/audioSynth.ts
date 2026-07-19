export type KeyboardSwitchType = 'blue' | 'brown' | 'red';

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const playKeyboardClick = (type: KeyboardSwitchType, volume: number = 0.5) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(volume * 0.45, now);

  // 1. CHERRY MX BLUE (Clicky, crisp metallic click + hollow plastic thud)
  if (type === 'blue') {
    // Snap
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'sine';
    snapOsc.frequency.setValueAtTime(1700, now);
    snapOsc.frequency.exponentialRampToValueAtTime(700, now + 0.01);
    
    snapGain.gain.setValueAtTime(0.65, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.008);
    
    snapOsc.connect(snapGain);
    snapGain.connect(masterGain);
    snapOsc.start(now);
    snapOsc.stop(now + 0.015);

    // Hollow click resonance (using a bandpass noise pop)
    const bufferSize = ctx.sampleRate * 0.02; // 20ms of noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 3500;
    noiseFilter.Q.value = 8;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseSource.start(now);
    noiseSource.stop(now + 0.02);

    // Switch casing thud
    const casingOsc = ctx.createOscillator();
    const casingGain = ctx.createGain();
    casingOsc.type = 'triangle';
    casingOsc.frequency.setValueAtTime(190, now);
    casingOsc.frequency.exponentialRampToValueAtTime(65, now + 0.03);
    
    casingGain.gain.setValueAtTime(0.4, now);
    casingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    
    casingOsc.connect(casingGain);
    casingGain.connect(masterGain);
    casingOsc.start(now);
    casingOsc.stop(now + 0.035);
  } 
  
  // 2. CHERRY MX BROWN (Tactile, warm plastic thud with moderate click)
  else if (type === 'brown') {
    // Soft snap
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'sine';
    snapOsc.frequency.setValueAtTime(950, now);
    snapOsc.frequency.exponentialRampToValueAtTime(280, now + 0.015);
    
    snapGain.gain.setValueAtTime(0.3, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);
    
    snapOsc.connect(snapGain);
    snapGain.connect(masterGain);
    snapOsc.start(now);
    snapOsc.stop(now + 0.02);

    // Deep housing bottom-out thud
    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thudOsc.type = 'triangle';
    thudOsc.frequency.setValueAtTime(145, now);
    thudOsc.frequency.exponentialRampToValueAtTime(50, now + 0.045);
    
    thudGain.gain.setValueAtTime(0.75, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    
    thudOsc.connect(thudGain);
    thudGain.connect(masterGain);
    thudOsc.start(now);
    thudOsc.stop(now + 0.05);
  } 
  
  // 3. CHERRY MX RED (Linear, quiet, deep bottom-out thud only)
  else {
    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thudOsc.type = 'triangle';
    thudOsc.frequency.setValueAtTime(115, now);
    thudOsc.frequency.exponentialRampToValueAtTime(40, now + 0.065);
    
    thudGain.gain.setValueAtTime(0.9, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    
    thudOsc.connect(thudGain);
    thudGain.connect(masterGain);
    thudOsc.start(now);
    thudOsc.stop(now + 0.075);
  }

  masterGain.connect(ctx.destination);
};

// Procedural Synthesizers for Ambient Sounds (Rain and Server Hum)
let rainNode: AudioWorkletNode | ScriptProcessorNode | null = null;
let rainGain: GainNode | null = null;
let humOsc: OscillatorNode | null = null;
let humFilter: BiquadFilterNode | null = null;
let humGain: GainNode | null = null;

// Rain Synthesizer: uses white noise with a bandpass filter
export const startSynthesizedRain = (volume: number) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (rainNode) stopSynthesizedRain();

  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const whiteNoise = ctx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  whiteNoise.loop = true;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 1000;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 600;
  bandpass.Q.value = 1.0;

  rainGain = ctx.createGain();
  rainGain.gain.setValueAtTime(volume * 0.15, ctx.currentTime);

  whiteNoise.connect(lowpass);
  lowpass.connect(bandpass);
  bandpass.connect(rainGain);
  rainGain.connect(ctx.destination);

  whiteNoise.start(0);
  rainNode = whiteNoise as any;
};

export const updateRainVolume = (volume: number) => {
  const ctx = getAudioContext();
  if (ctx && rainGain) {
    rainGain.gain.linearRampToValueAtTime(volume * 0.15, ctx.currentTime + 0.1);
  }
};

export const stopSynthesizedRain = () => {
  if (rainNode) {
    try {
      (rainNode as any).stop();
    } catch (e) {}
    rainNode = null;
  }
  rainGain = null;
};

// Server Hum Synthesizer: low-frequency FM carrier hum
export const startSynthesizedHum = (volume: number) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (humOsc) stopSynthesizedHum();

  // Low hum oscillator
  humOsc = ctx.createOscillator();
  humOsc.type = 'sawtooth';
  humOsc.frequency.setValueAtTime(60, ctx.currentTime); // 60Hz mains hum

  // Bandpass filter to isolate and give depth
  humFilter = ctx.createBiquadFilter();
  humFilter.type = 'lowpass';
  humFilter.frequency.value = 120;

  humGain = ctx.createGain();
  humGain.gain.setValueAtTime(volume * 0.08, ctx.currentTime);

  humOsc.connect(humFilter);
  humFilter.connect(humGain);
  humGain.connect(ctx.destination);

  humOsc.start(0);
};

export const updateHumVolume = (volume: number) => {
  const ctx = getAudioContext();
  if (ctx && humGain) {
    humGain.gain.linearRampToValueAtTime(volume * 0.08, ctx.currentTime + 0.1);
  }
};

export const stopSynthesizedHum = () => {
  if (humOsc) {
    try {
      humOsc.stop();
    } catch (e) {}
    humOsc = null;
  }
  humFilter = null;
  humGain = null;
};

// Cosmic Space Drone Synthesizer: slow LFO-modulated bandpass sweep
let cosmicNode: AudioWorkletNode | ScriptProcessorNode | null = null;
let cosmicGain: GainNode | null = null;
let cosmicLfo: OscillatorNode | null = null;

export const startSynthesizedCosmic = (volume: number) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (cosmicNode) stopSynthesizedCosmic();

  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const whiteNoise = ctx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  whiteNoise.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 350;
  filter.Q.value = 2.0;

  cosmicLfo = ctx.createOscillator();
  cosmicLfo.type = 'sine';
  cosmicLfo.frequency.value = 0.08; 
  
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 180;

  cosmicGain = ctx.createGain();
  cosmicGain.gain.setValueAtTime(volume * 0.12, ctx.currentTime);

  cosmicLfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  whiteNoise.connect(filter);
  filter.connect(cosmicGain);
  cosmicGain.connect(ctx.destination);

  whiteNoise.start(0);
  cosmicLfo.start(0);

  cosmicNode = whiteNoise as any;
};

export const updateCosmicVolume = (volume: number) => {
  const ctx = getAudioContext();
  if (ctx && cosmicGain) {
    cosmicGain.gain.linearRampToValueAtTime(volume * 0.12, ctx.currentTime + 0.1);
  }
};

export const stopSynthesizedCosmic = () => {
  if (cosmicNode) {
    try {
      (cosmicNode as any).stop();
    } catch (e) {}
    cosmicNode = null;
  }
  if (cosmicLfo) {
    try {
      cosmicLfo.stop();
    } catch (e) {}
    cosmicLfo = null;
  }
  cosmicGain = null;
};

// 1. Typewriter Bell (Chime) Synth
export const playTypewriterBell = (volume: number = 0.5) => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(2500, now);
  
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(3200, now);
  
  gainNode.gain.setValueAtTime(volume * 0.25, now);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
  
  osc1.connect(gainNode);
  osc2.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.85);
  osc2.stop(now + 0.85);
};

// 2. Deep Zen Chime Synth
export const playDeepZenChime = (volume: number = 0.5) => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gainNode = ctx.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(110, now); // A2 note
  osc.frequency.linearRampToValueAtTime(55, now + 1.5);
  
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(200, now);
  
  gainNode.gain.setValueAtTime(volume * 0.55, now);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
  
  osc.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + 2.1);
};

// 3. Space Warp Sweep Synth
export const playSpaceWarp = (volume: number = 0.5) => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
  
  gainNode.gain.setValueAtTime(volume * 0.2, now);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
  
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + 0.5);
};

// 4. Laser Pop Synth
export const playLaserPop = (volume: number = 0.5) => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
  
  gainNode.gain.setValueAtTime(volume * 0.15, now);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
  
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + 0.18);
};
