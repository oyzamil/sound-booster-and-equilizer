// Copyright 2012, Google Inc.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//     * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

const delayTime = 0.1;
const fadeTime = 0.05;
const bufferTime = 0.1;
let previousPitch = -1;

function createFadeBuffer(
  context: AudioContext,
  activeTime: number,
  fadeTime: number
): AudioBuffer {
  const length1 = activeTime * context.sampleRate;
  const length2 = (activeTime - 2 * fadeTime) * context.sampleRate;
  const length = length1 + length2;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const p = buffer.getChannelData(0);

  console.log('createFadeBuffer() length = ' + length);

  const fadeLength = fadeTime * context.sampleRate;
  const fadeIndex1 = fadeLength;
  const fadeIndex2 = length1 - fadeLength;

  // 1st part of cycle
  for (let i = 0; i < length1; ++i) {
    let value: number;

    if (i < fadeIndex1) {
      value = Math.sqrt(i / fadeLength);
    } else if (i >= fadeIndex2) {
      value = Math.sqrt(1 - (i - fadeIndex2) / fadeLength);
    } else {
      value = 1;
    }

    p[i] = value;
  }

  // 2nd part
  for (let i = length1; i < length; ++i) {
    p[i] = 0;
  }

  return buffer;
}

function createDelayTimeBuffer(
  context: AudioContext,
  activeTime: number,
  fadeTime: number,
  shiftUp: boolean
): AudioBuffer {
  const length1 = activeTime * context.sampleRate;
  const length2 = (activeTime - 2 * fadeTime) * context.sampleRate;
  const length = length1 + length2;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const p = buffer.getChannelData(0);

  console.log('createDelayTimeBuffer() length = ' + length);

  // 1st part of cycle
  for (let i = 0; i < length1; ++i) {
    if (shiftUp) {
      // This line does shift-up transpose
      p[i] = (length1 - i) / length;
    } else {
      // This line does shift-down transpose
      p[i] = i / length1;
    }
  }

  // 2nd part
  for (let i = length1; i < length; ++i) {
    p[i] = 0;
  }

  return buffer;
}

export default class Jungle {
  context: AudioContext;
  input: GainNode;
  output: GainNode;
  mod1: AudioBufferSourceNode;
  mod2: AudioBufferSourceNode;
  mod1Gain: GainNode;
  mod2Gain: GainNode;
  mod3Gain: GainNode;
  mod4Gain: GainNode;
  modGain1: GainNode;
  modGain2: GainNode;
  fade1: AudioBufferSourceNode;
  fade2: AudioBufferSourceNode;
  mix1: GainNode;
  mix2: GainNode;
  delay1: DelayNode;
  delay2: DelayNode;
  shiftDownBuffer: AudioBuffer;
  shiftUpBuffer: AudioBuffer;
  value: number = 0;

  constructor(context: AudioContext) {
    this.context = context;

    // Create nodes for the input and output of this "module".
    this.input = context.createGain();
    this.output = context.createGain();

    // Delay modulation.
    this.mod1 = context.createBufferSource();
    this.mod2 = context.createBufferSource();
    const mod3 = context.createBufferSource();
    const mod4 = context.createBufferSource();

    this.shiftDownBuffer = createDelayTimeBuffer(context, bufferTime, fadeTime, false);
    this.shiftUpBuffer = createDelayTimeBuffer(context, bufferTime, fadeTime, true);

    this.mod1.buffer = this.shiftDownBuffer;
    this.mod2.buffer = this.shiftDownBuffer;
    mod3.buffer = this.shiftUpBuffer;
    mod4.buffer = this.shiftUpBuffer;
    this.mod1.loop = true;
    this.mod2.loop = true;
    mod3.loop = true;
    mod4.loop = true;

    // for switching between oct-up and oct-down
    this.mod1Gain = context.createGain();
    this.mod2Gain = context.createGain();
    this.mod3Gain = context.createGain();
    this.mod3Gain.gain.value = 0;
    this.mod4Gain = context.createGain();
    this.mod4Gain.gain.value = 0;

    this.mod1.connect(this.mod1Gain);
    this.mod2.connect(this.mod2Gain);
    mod3.connect(this.mod3Gain);
    mod4.connect(this.mod4Gain);

    // Delay amount for changing pitch.
    this.modGain1 = context.createGain();
    this.modGain2 = context.createGain();

    this.delay1 = context.createDelay();
    this.delay2 = context.createDelay();
    this.mod1Gain.connect(this.modGain1);
    this.mod2Gain.connect(this.modGain2);
    this.mod3Gain.connect(this.modGain1);
    this.mod4Gain.connect(this.modGain2);
    this.modGain1.connect(this.delay1.delayTime);
    this.modGain2.connect(this.delay2.delayTime);

    // Crossfading.
    this.fade1 = context.createBufferSource();
    this.fade2 = context.createBufferSource();
    const fadeBuffer = createFadeBuffer(context, bufferTime, fadeTime);
    this.fade1.buffer = fadeBuffer;
    this.fade2.buffer = fadeBuffer;
    this.fade1.loop = true;
    this.fade2.loop = true;

    this.mix1 = context.createGain();
    this.mix2 = context.createGain();
    this.mix1.gain.value = 0;
    this.mix2.gain.value = 0;

    this.fade1.connect(this.mix1.gain);
    this.fade2.connect(this.mix2.gain);

    // Connect processing graph.
    this.input.connect(this.delay1);
    this.input.connect(this.delay2);
    this.delay1.connect(this.mix1);
    this.delay2.connect(this.mix2);
    this.mix1.connect(this.output);
    this.mix2.connect(this.output);

    // Start
    const t = context.currentTime + 0.05;
    const t2 = t + bufferTime - fadeTime;
    this.mod1.start(t);
    this.mod2.start(t2);
    mod3.start(t);
    mod4.start(t2);
    this.fade1.start(t);
    this.fade2.start(t2);

    this.setDelay(delayTime);
  }

  setDelay(delayTime: number): void {
    this.modGain1.gain.setTargetAtTime(0.5 * delayTime, 0, 0.01);
    this.modGain2.gain.setTargetAtTime(0.5 * delayTime, 0, 0.01);
  }

  setPitchOffset(mult: number): void {
    if (mult > 0) {
      // pitch up
      this.mod1Gain.gain.value = 0;
      this.mod2Gain.gain.value = 0;
      this.mod3Gain.gain.value = 1;
      this.mod4Gain.gain.value = 1;
    } else {
      // pitch down
      this.mod1Gain.gain.value = 1;
      this.mod2Gain.gain.value = 1;
      this.mod3Gain.gain.value = 0;
      this.mod4Gain.gain.value = 0;
    }
    this.setDelay(delayTime * Math.abs(mult));
    previousPitch = mult;
    this.value = mult;
  }

  mapPitchFromSemitone(e: number): number {
    if (e < 0) return e / 12;
    switch (e) {
      case 0:
        return 0;
      case 1:
        return 0.15;
      case 2:
        return 0.2396498469723199;
      case 3:
        return 0.3392416223392665;
      case 4:
        return 0.5240613184290452;
      case 5:
        return 0.6938443526464626;
      case 6:
        return 0.8531707712586548;
      case 7:
        return 1.0062309336345026;
      case 8:
        return 1.1572897600301169;
      case 9:
        return 1.3572897600301168;
      case 10:
        return 1.5356230933634503;
      case 11:
        return 1.7056230933634502;
      case 12:
        return 2;
      default:
        return 0;
    }
  }

  setPitchTranspose(e: number, a: number): void {
    const aInt = parseInt(a.toString(), 10);
    const eFloat = parseFloat(e.toString());
    const t = this.mapPitchFromSemitone(aInt) + (1 * eFloat) / 12;
    this.setPitchOffset(t);
  }
}
