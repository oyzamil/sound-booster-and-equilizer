export interface AudioNodes {
  context: AudioContext;
  source: MediaElementAudioSourceNode;
  gainNode: GainNode;
  filters: BiquadFilterNode[];
  stereoPanner: StereoPannerNode;
  channelMerger?: ChannelMergerNode;
  channelSplitter?: ChannelSplitterNode;
  invertSplitter?: ChannelSplitterNode;
  invertMerger?: ChannelMergerNode;
}

export class AudioProcessor {
  private nodes: Map<HTMLMediaElement, AudioNodes> = new Map();

  connectMedia(media: HTMLMediaElement, settings: AudioSettings): void {
    // If already connected, just update settings
    if (this.nodes.has(media)) {
      this.updateSettings(media, settings);
      return;
    }

    try {
      const context = new AudioContext();
      const source = context.createMediaElementSource(media);
      const gainNode = context.createGain();
      const stereoPanner = context.createStereoPanner();

      // Create EQ filters
      const filters = settings.bands.map((band) => {
        const filter = context.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = band.frequency;
        filter.Q.value = 1;
        filter.gain.value = band.gain;
        return filter;
      });

      // Store nodes first
      const audioNodes: AudioNodes = {
        context,
        source,
        gainNode,
        filters,
        stereoPanner,
      };
      this.nodes.set(media, audioNodes);

      if (settings.playbackRate) {
        media.playbackRate = settings.playbackRate;
      }

      // Build and connect the audio graph
      this.rebuildAudioGraph(media, settings);
    } catch (error) {
      console.error('Failed to connect audio:', error);
    }
  }

  private rebuildAudioGraph(media: HTMLMediaElement, settings: AudioSettings): void {
    const nodes = this.nodes.get(media);
    if (!nodes) return;

    try {
      // Disconnect everything
      nodes.gainNode.disconnect();
      nodes.filters.forEach((f) => f.disconnect());
      nodes.stereoPanner.disconnect();
      nodes.channelMerger?.disconnect();
      nodes.channelSplitter?.disconnect();
      nodes.invertSplitter?.disconnect();
      nodes.invertMerger?.disconnect();
    } catch {}

    let currentNode: AudioNode = nodes.source;

    // Check if effects are enabled
    const effectsEnabled =
      settings.volume !== 1 ||
      settings.bands.some((b) => b.gain !== 0) ||
      settings.balance !== 0 ||
      settings.stereoMode !== 'stereo' ||
      settings.invertChannels;

    if (effectsEnabled) {
      // Connect filters in series
      nodes.filters.forEach((filter) => {
        currentNode.connect(filter);
        currentNode = filter;
      });

      // Stereo/Mono and inversion logic...
      if (settings.stereoMode === 'mono') {
        /* ... */
      }
      if (settings.invertChannels) {
        /* ... */
      }

      // Connect gain and panner
      currentNode.connect(nodes.gainNode);
      nodes.gainNode.connect(nodes.stereoPanner);
      nodes.stereoPanner.connect(nodes.context.destination);

      // Apply current settings
      nodes.gainNode.gain.value = settings.volume;
      nodes.stereoPanner.pan.value = settings.balance;
      settings.bands.forEach((band, index) => {
        if (nodes.filters[index]) nodes.filters[index].gain.value = band.gain;
      });
    } else {
      // ⚡ Bypass mode: connect source directly to destination
      currentNode.connect(nodes.context.destination);
    }
  }

  disconnectMedia(media: HTMLMediaElement): void {
    const nodes = this.nodes.get(media);
    if (!nodes) return;

    try {
      nodes.source.disconnect();
      nodes.gainNode.disconnect();
      nodes.filters.forEach((f) => f.disconnect());
      nodes.stereoPanner.disconnect();
      nodes.channelMerger?.disconnect();
      nodes.channelSplitter?.disconnect();
      nodes.invertSplitter?.disconnect();
      nodes.invertMerger?.disconnect();
      nodes.context.close();
    } catch (error) {
      console.error('Failed to disconnect audio:', error);
    }

    this.nodes.delete(media);
  }

  updateSettings(media: HTMLMediaElement, settings: AudioSettings): void {
    const nodes = this.nodes.get(media);
    if (!nodes) return;

    const needsRebuild = this.needsGraphRebuild(media, settings);

    if (needsRebuild) {
      this.rebuildAudioGraph(media, settings);
    } else {
      // Just update the values
      nodes.gainNode.gain.value = settings.volume;
      nodes.stereoPanner.pan.value = settings.balance;

      settings.bands.forEach((band, index) => {
        if (nodes.filters[index]) {
          nodes.filters[index].gain.value = band.gain;
        }
      });
    }
  }

  private needsGraphRebuild(media: HTMLMediaElement, newSettings: AudioSettings): boolean {
    const nodes = this.nodes.get(media);
    if (!nodes) return false;

    // Check if stereo mode changed
    const currentlyMono = !!nodes.channelMerger;
    const wantsMono = newSettings.stereoMode === 'mono';
    if (currentlyMono !== wantsMono) return true;

    // Check if invert changed
    const currentlyInverted = !!nodes.invertMerger;
    const wantsInverted = newSettings.invertChannels;
    if (currentlyInverted !== wantsInverted) return true;

    return false;
  }

  disconnectAll(): void {
    this.nodes.forEach((_, media) => this.disconnectMedia(media));
  }
}
