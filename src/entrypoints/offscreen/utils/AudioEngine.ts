import './Jungle';
import Tuna from './Tuna';

interface AudioSettings {
  isChorus: boolean;
  isConvolver: boolean;
  compressor: CompressorSettings;
  convolver: ConvolverSettings;
  chorus: ChorusSettings;
  isMono: boolean;
  isInvert: boolean;
  isPitch: boolean;
  volume: number;
  balance: number;
  eq: number[];
}

interface CompressorSettings {
  threshold: number;
  attack: number;
  release: number;
  makeupGain: number;
  ratio: number;
  knee: number;
  bypass: boolean;
  automakeup: boolean;
}

interface ConvolverSettings {
  highCut: number;
  lowCut: number;
  dryLevel: number;
  wetLevel: number;
  level: number;
  bypass: boolean;
}

interface ChorusSettings {
  rate: number;
  depth: number;
  feedback: number;
  delay: number;
}

/* =======================================================
   AUDIO ENGINE CLASS
======================================================= */

export class AudioEngine {
  audioContext: AudioContext;
  audioSource: MediaStreamAudioSourceNode;
  audioGain: GainNode;
  tabId: number;

  chorus?: any;
  convolver?: any;
  pitch?: any;
  compressor: any;

  panSplitter: ChannelSplitterNode;
  leftGain: GainNode;
  rightGain: GainNode;
  panMerger: ChannelMergerNode;

  monoSplitter: ChannelSplitterNode;
  monoGain: GainNode;
  monoMerger: ChannelMergerNode;

  // EQ Filters
  twenty: BiquadFilterNode;
  fifty: BiquadFilterNode;
  oneHundred: BiquadFilterNode;
  twoHundred: BiquadFilterNode;
  fiveHundred: BiquadFilterNode;
  oneThousand: BiquadFilterNode;
  twoThousand: BiquadFilterNode;
  fiveThousand: BiquadFilterNode;
  tenThousand: BiquadFilterNode;
  twentyThousand: BiquadFilterNode;

  // Settings state
  private settings: AudioSettings;
  private currentMono = false;
  private currentInvert = false;
  private currentPan = 0;

  constructor(stream: MediaStream, tabId: number, settings: AudioSettings) {
    this.tabId = tabId;
    this.settings = { ...settings };
    this.currentMono = settings.isMono;
    this.currentInvert = settings.isInvert;
    this.currentPan = settings.balance;

    /* -------------------- CONTEXT -------------------- */
    this.audioContext = new AudioContext({ latencyHint: 'playback' });
    this.audioSource = this.audioContext.createMediaStreamSource(stream);
    this.audioGain = this.audioContext.createGain();

    const tunaInstance = new (Tuna as any)(this.audioContext);

    /* -------------------- EFFECTS -------------------- */
    if (settings.isChorus) {
      this.chorus = new tunaInstance.Chorus({
        bypass: 0,
        rate: settings.chorus.rate,
        depth: settings.chorus.depth,
        feedback: settings.chorus.feedback,
        delay: settings.chorus.delay,
      });
    }

    if (settings.isConvolver) {
      this.convolver = new tunaInstance.Convolver({
        bypass: 0,
        highCut: settings.convolver.highCut,
        lowCut: settings.convolver.lowCut,
        dryLevel: settings.convolver.dryLevel,
        wetLevel: settings.convolver.wetLevel,
        level: settings.convolver.level,
      });
    }

    if (settings.isPitch) {
      // @ts-expect-error legacy lib
      this.pitch = new Jungle(this.audioContext);
      this.pitch.value = 0;
      this.pitch.setPitchOffset(0);
    }

    this.compressor = new tunaInstance.Compressor({
      bypass: 0,
      threshold: settings.compressor.threshold,
      attack: settings.compressor.attack,
      release: settings.compressor.release,
      ratio: settings.compressor.ratio,
      knee: settings.compressor.knee,
    });

    /* -------------------- PAN / MONO -------------------- */
    this.panSplitter = this.audioContext.createChannelSplitter(2);
    this.leftGain = this.audioContext.createGain();
    this.rightGain = this.audioContext.createGain();
    this.panMerger = this.audioContext.createChannelMerger(2);
    this.monoSplitter = this.audioContext.createChannelSplitter(2);
    this.monoGain = this.audioContext.createGain();
    this.monoMerger = this.audioContext.createChannelMerger(2);

    /* -------------------- EQ -------------------- */
    this.twenty = this.audioContext.createBiquadFilter();
    this.fifty = this.audioContext.createBiquadFilter();
    this.oneHundred = this.audioContext.createBiquadFilter();
    this.twoHundred = this.audioContext.createBiquadFilter();
    this.fiveHundred = this.audioContext.createBiquadFilter();
    this.oneThousand = this.audioContext.createBiquadFilter();
    this.twoThousand = this.audioContext.createBiquadFilter();
    this.fiveThousand = this.audioContext.createBiquadFilter();
    this.tenThousand = this.audioContext.createBiquadFilter();
    this.twentyThousand = this.audioContext.createBiquadFilter();

    this.setupEQ(settings.eq);

    /* -------------------- INITIAL VALUES -------------------- */
    this.audioGain.gain.setValueAtTime(settings.volume, this.audioContext.currentTime);
    this.monoGain.gain.setValueAtTime(0.6, this.audioContext.currentTime);

    /* -------------------- CONNECTIONS -------------------- */
    this.connectInitialGraph();
    this.connectEffectsChain();
    this.connectEQChain();

    // Apply settings in correct order - pan first, then mono/invert
    this.applyPan(settings.balance);
    this.applyMono(settings.isMono);
    this.applyInvert();
  }

  /* =======================================================
     GRAPH SETUP
  ======================================================= */

  private setupEQ(values: number[]) {
    const currentTime = this.audioContext.currentTime;

    // twenty
    this.twenty.type = 'lowshelf';
    this.twenty.frequency.setValueAtTime(32, currentTime);
    this.twenty.gain.setValueAtTime(Number(values[0]), currentTime);

    // fifty
    this.fifty.type = 'peaking';
    this.fifty.frequency.setValueAtTime(64, currentTime);
    this.fifty.Q.setValueAtTime(5, currentTime);
    this.fifty.gain.setValueAtTime(Number(values[1]), currentTime);

    // oneHundred
    this.oneHundred.type = 'peaking';
    this.oneHundred.frequency.setValueAtTime(125, currentTime);
    this.oneHundred.Q.setValueAtTime(5, currentTime);
    this.oneHundred.gain.setValueAtTime(Number(values[2]), currentTime);

    // twoHundred
    this.twoHundred.type = 'peaking';
    this.twoHundred.frequency.setValueAtTime(250, currentTime);
    this.twoHundred.Q.setValueAtTime(5, currentTime);
    this.twoHundred.gain.setValueAtTime(Number(values[3]), currentTime);

    // fiveHundred
    this.fiveHundred.type = 'peaking';
    this.fiveHundred.frequency.setValueAtTime(500, currentTime);
    this.fiveHundred.Q.setValueAtTime(5, currentTime);
    this.fiveHundred.gain.setValueAtTime(Number(values[4]), currentTime);

    // oneThousand
    this.oneThousand.type = 'peaking';
    this.oneThousand.frequency.setValueAtTime(1000, currentTime);
    this.oneThousand.Q.setValueAtTime(5, currentTime);
    this.oneThousand.gain.setValueAtTime(Number(values[5]), currentTime);

    // twoThousand
    this.twoThousand.type = 'peaking';
    this.twoThousand.frequency.setValueAtTime(2000, currentTime);
    this.twoThousand.Q.setValueAtTime(5, currentTime);
    this.twoThousand.gain.setValueAtTime(Number(values[6]), currentTime);

    // fiveThousand
    this.fiveThousand.type = 'peaking';
    this.fiveThousand.frequency.setValueAtTime(4000, currentTime);
    this.fiveThousand.Q.setValueAtTime(5, currentTime);
    this.fiveThousand.gain.setValueAtTime(Number(values[7]), currentTime);

    // tenThousand
    this.tenThousand.type = 'peaking';
    this.tenThousand.frequency.setValueAtTime(8000, currentTime);
    this.tenThousand.Q.setValueAtTime(5, currentTime);
    this.tenThousand.gain.setValueAtTime(Number(values[8]), currentTime);

    // twentyThousand
    this.twentyThousand.type = 'highshelf';
    this.twentyThousand.frequency.setValueAtTime(16000, currentTime);
    this.twentyThousand.gain.setValueAtTime(Number(values[9]), currentTime);
  }

  private connectInitialGraph() {
    // Basic connections from your working code
    this.audioSource.connect(this.panSplitter);
    this.panSplitter.connect(this.leftGain, 0);
    this.panSplitter.connect(this.rightGain, 1);
    this.leftGain.connect(this.panMerger, 0, 0);
    this.rightGain.connect(this.panMerger, 0, 1);

    // Connect to mono splitter initially (stereo mode)
    this.panMerger.connect(this.monoSplitter);
  }

  private connectEffectsChain() {
    let currentNode: AudioNode = this.monoMerger;

    // Connect in the exact order from your working code
    if (this.settings.isPitch && this.pitch) {
      currentNode.connect(this.pitch);
      currentNode = this.pitch.output;
    }

    if (this.settings.isChorus && this.chorus) {
      currentNode.connect(this.chorus);
      currentNode = this.chorus;
    }

    if (this.settings.isConvolver && this.convolver) {
      currentNode.connect(this.convolver);
      currentNode = this.convolver;
    }

    // Connect to twenty (first EQ filter)
    currentNode.connect(this.twenty);
  }

  private connectEQChain() {
    // Connect EQ chain exactly as in your working code
    this.twenty.connect(this.fifty);
    this.fifty.connect(this.oneHundred);
    this.oneHundred.connect(this.twoHundred);
    this.twoHundred.connect(this.fiveHundred);
    this.fiveHundred.connect(this.oneThousand);
    this.oneThousand.connect(this.twoThousand);
    this.twoThousand.connect(this.fiveThousand);
    this.fiveThousand.connect(this.tenThousand);
    this.tenThousand.connect(this.twentyThousand);
    this.twentyThousand.connect(this.compressor);
    this.compressor.connect(this.audioGain);
    this.audioGain.connect(this.audioContext.destination);
  }

  /* =======================================================
     CONTROLS - CORRECTED VERSION
  ======================================================= */

  setVolume(v: number) {
    this.settings.volume = v;
    this.audioGain.gain.setValueAtTime(v, this.audioContext.currentTime);
  }

  setEQ(values: number[]) {
    this.settings.eq = [...values];
    const currentTime = this.audioContext.currentTime;

    this.twenty.gain.setValueAtTime(Number(values[0]), currentTime);
    this.fifty.gain.setValueAtTime(Number(values[1]), currentTime);
    this.oneHundred.gain.setValueAtTime(Number(values[2]), currentTime);
    this.twoHundred.gain.setValueAtTime(Number(values[3]), currentTime);
    this.fiveHundred.gain.setValueAtTime(Number(values[4]), currentTime);
    this.oneThousand.gain.setValueAtTime(Number(values[5]), currentTime);
    this.twoThousand.gain.setValueAtTime(Number(values[6]), currentTime);
    this.fiveThousand.gain.setValueAtTime(Number(values[7]), currentTime);
    this.tenThousand.gain.setValueAtTime(Number(values[8]), currentTime);
    this.twentyThousand.gain.setValueAtTime(Number(values[9]), currentTime);
  }

  setPan(balance: number) {
    // Update settings and apply
    this.settings.balance = balance;
    this.currentPan = balance;
    this.applyPan(balance);

    // If mono is on, we need to adjust the mono output based on pan
    if (this.currentMono) {
      this.applyMonoPan(balance);
    }
  }

  private applyPan(balance: number) {
    const clampedBalance = Math.max(-1, Math.min(1, balance));
    const currentTime = this.audioContext.currentTime;

    // Using the exact same formula from your working code
    const panLeftGain = Math.cos((Math.PI / 4) * (1 + clampedBalance));
    const panRightGain = Math.sin((Math.PI / 4) * (1 + clampedBalance));

    this.leftGain.gain.setValueAtTime(panLeftGain, currentTime);
    this.rightGain.gain.setValueAtTime(panRightGain, currentTime);

    console.log(
      `[offscreen] Applied pan: ${clampedBalance.toFixed(2)}, L: ${panLeftGain.toFixed(2)}, R: ${panRightGain.toFixed(2)}`
    );
  }

  private applyMonoPan(balance: number) {
    // When mono is enabled, adjust the monoGain based on pan
    const clampedBalance = Math.max(-1, Math.min(1, balance));
    const currentTime = this.audioContext.currentTime;

    // For mono with pan, we create a mono signal then pan it
    // Simple approach: mono gain = 0.6 * (1 - abs(pan)/2) to maintain volume
    const monoPanFactor = 1 - Math.abs(clampedBalance) / 2;
    const monoGainValue = 0.6 * monoPanFactor;

    this.monoGain.gain.setValueAtTime(monoGainValue, currentTime);

    // If invert is also enabled, we might need to handle it differently
    if (this.currentInvert) {
      // For inverted mono with pan, swap the pan direction
      this.applyPan(-balance);
    }
  }

  setMono(enabled: boolean) {
    // Only update if value changed
    if (this.currentMono === enabled) return;

    this.settings.isMono = enabled;
    this.currentMono = enabled;
    this.applyMono(enabled);
  }

  private applyMono(enabled: boolean) {
    try {
      // Always disconnect from monoMerger before reconnecting
      this.monoSplitter.disconnect();
      this.panMerger.disconnect();
      this.monoGain.disconnect();

      if (enabled) {
        // MONO MODE: Connect through monoGain
        this.panMerger.connect(this.monoGain);
        this.monoGain.connect(this.monoSplitter);

        // Create mono signal by mixing both channels to both outputs
        this.monoSplitter.connect(this.monoMerger, 0, 0); // Channel 0 → Output 0
        this.monoSplitter.connect(this.monoMerger, 1, 0); // Channel 1 → Output 0
        this.monoSplitter.connect(this.monoMerger, 0, 1); // Channel 0 → Output 1
        this.monoSplitter.connect(this.monoMerger, 1, 1); // Channel 1 → Output 1

        // Apply pan to mono if needed
        if (this.currentPan !== 0) {
          this.applyMonoPan(this.currentPan);
        }
      } else {
        // STEREO MODE: Connect directly
        this.panMerger.connect(this.monoSplitter);

        // Normal stereo connections
        this.monoSplitter.connect(this.monoMerger, 0, 0); // Left → Left
        this.monoSplitter.connect(this.monoMerger, 1, 1); // Right → Right

        // Reset mono gain
        this.monoGain.gain.setValueAtTime(0.6, this.audioContext.currentTime);
      }

      // Apply current invert state (handles both mono and stereo)
      this.applyInvert();

      console.log(`[offscreen] ${enabled ? 'Enabled' : 'Disabled'} mono mode`);
    } catch (error) {
      console.error('Error applying mono:', error);
    }
  }

  setInvert(enabled: boolean) {
    // Only update if value changed
    if (this.currentInvert === enabled) return;

    this.settings.isInvert = enabled;
    this.currentInvert = enabled;
    this.applyInvert();
  }

  private applyInvert() {
    try {
      // Clear existing connections to monoMerger
      this.monoSplitter.disconnect();

      if (this.currentInvert) {
        // INVERTED: Swap channels
        if (this.currentMono) {
          // Mono + Invert: still mono but with swapped input channels
          this.monoSplitter.connect(this.monoMerger, 1, 0); // Right → Output 0
          this.monoSplitter.connect(this.monoMerger, 0, 0); // Left → Output 0
          this.monoSplitter.connect(this.monoMerger, 1, 1); // Right → Output 1
          this.monoSplitter.connect(this.monoMerger, 0, 1); // Left → Output 1
        } else {
          // Stereo + Invert: swap channels
          this.monoSplitter.connect(this.monoMerger, 1, 0); // Right → Left
          this.monoSplitter.connect(this.monoMerger, 0, 1); // Left → Right
        }
        console.log(`[offscreen] Applied channel invert`);
      } else {
        // NORMAL: Straight connections
        if (this.currentMono) {
          // Mono mode: both channels to both outputs
          this.monoSplitter.connect(this.monoMerger, 0, 0); // Left → Output 0
          this.monoSplitter.connect(this.monoMerger, 1, 0); // Right → Output 0
          this.monoSplitter.connect(this.monoMerger, 0, 1); // Left → Output 1
          this.monoSplitter.connect(this.monoMerger, 1, 1); // Right → Output 1
        } else {
          // Stereo mode: normal stereo
          this.monoSplitter.connect(this.monoMerger, 0, 0); // Left → Left
          this.monoSplitter.connect(this.monoMerger, 1, 1); // Right → Right
        }
        console.log(`[offscreen] Normal stereo`);
      }
    } catch (error) {
      console.error('Error applying invert state:', error);
    }
  }

  /* ==================== EFFECT UPDATES ==================== */

  changeCompressor(compressorValues: any): void {
    this.compressor.automate('threshold', parseFloat(compressorValues.threshold));
    this.compressor.automate('release', parseFloat(compressorValues.release));
    this.compressor.automate('attack', parseFloat(compressorValues.attack));
    this.compressor.automate('ratio', parseFloat(compressorValues.ratio));
    this.compressor.automate('knee', parseFloat(compressorValues.knee));
  }

  changeConvolver(convolverValues: any): void {
    if (this.convolver) {
      this.convolver.automate('lowCut', parseFloat(convolverValues.lowCut));
      this.convolver.automate('highCut', parseFloat(convolverValues.highCut));
      this.convolver.automate('wetLevel', parseFloat(convolverValues.wetLevel));
      this.convolver.automate('level', parseFloat(convolverValues.level));
      this.convolver.automate('dryLevel', parseFloat(convolverValues.dryLevel));
    }
  }

  changePitch(pitchValue: any): void {
    if (this.pitch) {
      const value = pitchValue.value || pitchValue;
      this.pitch.setPitchOffset(value);
      this.pitch.value = value;
    }
  }

  changeChorus(chorusValues: any): void {
    if (this.chorus) {
      this.chorus.rate = parseFloat(chorusValues.rate);
      this.chorus.depth = parseFloat(chorusValues.depth);
      this.chorus.feedback = parseFloat(chorusValues.feedback);
      this.chorus.delay = parseFloat(chorusValues.delay);
    }
  }

  /* =======================================================
     RESET / DESTROY
  ======================================================= */

  reset(settings: AudioSettings) {
    this.settings = { ...settings };
    this.currentMono = settings.isMono;
    this.currentInvert = settings.isInvert;
    this.currentPan = settings.balance;

    this.setVolume(settings.volume);
    this.setEQ(settings.eq);
    this.applyPan(settings.balance);

    // Reapply mono and invert
    this.applyMono(settings.isMono);
    this.applyInvert();

    // Reset effects if they exist
    if (this.pitch) {
      this.pitch.setPitchOffset(0);
      this.pitch.value = 0;
    }
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  async destroy() {
    try {
      // Stop all tracks
      const mediaStream = this.audioSource?.mediaStream;
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }

      // Disconnect nodes
      this.audioSource?.disconnect();

      // Close context
      if (this.audioContext.state !== 'closed') {
        await this.audioContext.close();
      }
    } catch (error) {
      console.error('Error destroying audio engine:', error);
    }
  }
}
