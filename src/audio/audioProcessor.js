import { makeDistortionCurve, makeHardClippingCurve, makeBitcrusher } from './distortionUtils.js';
import { bufferToWav } from '../utils/fileConverter.js';

export async function processAudio(arrayBuffer, params) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const decoded = await audioCtx.decodeAudioData(arrayBuffer);
  const oCtx = new OfflineAudioContext(
    decoded.numberOfChannels,
    decoded.length,
    decoded.sampleRate
  );
  const src = oCtx.createBufferSource();
  src.buffer = decoded;

  // Create and configure audio nodes
  const hp = oCtx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = +params.hpFreq;

  const notch1 = oCtx.createBiquadFilter();
  notch1.type = "notch";
  notch1.frequency.value = +params.notch1Freq;
  notch1.Q.value = +params.notch1Q;

  const notch2 = oCtx.createBiquadFilter();
  notch2.type = "notch";
  notch2.frequency.value = +params.notch2Freq;
  notch2.Q.value = +params.notch2Q;

  const inverter = oCtx.createGain();
  inverter.gain.value = -1;

  const splitter = oCtx.createChannelSplitter(2);
  const merger = oCtx.createChannelMerger(2);

  const midGain = oCtx.createGain();
  midGain.gain.value = +params.midGain;
  const sideGain = oCtx.createGain();
  sideGain.gain.value = +params.sideGain;

  const midEQ = oCtx.createBiquadFilter();
  midEQ.type = "peaking";
  midEQ.frequency.value = +params.midEqFreq;
  midEQ.gain.value = +params.midEqGain;

  const sideEQ = oCtx.createBiquadFilter();
  sideEQ.type = "peaking";
  sideEQ.frequency.value = +params.sideEqFreq;
  sideEQ.gain.value = +params.sideEqGain;

  const form1 = oCtx.createBiquadFilter();
  form1.type = "peaking";
  form1.frequency.value = +params.formant1Freq;
  form1.Q.value = +params.formant1Q;
  form1.gain.value = +params.formant1Gain;

  const form2 = oCtx.createBiquadFilter();
  form2.type = "peaking";
  form2.frequency.value = +params.formant2Freq;
  form2.Q.value = +params.formant2Q;
  form2.gain.value = +params.formant2Gain;

  const compressor = oCtx.createDynamicsCompressor();
  compressor.threshold.value = +params.compThreshold;
  compressor.ratio.value = +params.compRatio;
  compressor.attack.value = +params.compAttack;
  compressor.release.value = +params.compRelease;

  const duckGain = oCtx.createGain();
  duckGain.gain.value = 1;

  // Distortion node selection
  let distortionNode;
  if (params.distType === "soft") {
    distortionNode = oCtx.createWaveShaper();
    distortionNode.curve = makeDistortionCurve(+params.distAmount);
    distortionNode.oversample = "4x";
  } else if (params.distType === "hard") {
    distortionNode = oCtx.createWaveShaper();
    distortionNode.curve = makeHardClippingCurve(+params.distAmount);
    distortionNode.oversample = "none";
  } else if (params.distType === "bitcrush") {
    distortionNode = makeBitcrusher(oCtx, 4 + Math.floor((+params.distAmount/1000)*12)); // bits: 4-16
  } else {
    distortionNode = oCtx.createGain();
    distortionNode.gain.value = 1;
  }

  // Connect audio nodes
  src.connect(hp);
  hp.connect(notch1);
  notch1.connect(notch2);
  notch2.connect(inverter);
  inverter.connect(splitter);

  splitter.connect(midGain, 0);
  splitter.connect(sideGain, 1);

  midGain.connect(midEQ);
  sideGain.connect(sideEQ);

  midEQ.connect(merger, 0, 0);
  sideEQ.connect(merger, 0, 1);

  merger.connect(form1);
  form1.connect(form2);
  form2.connect(compressor);
  compressor.connect(duckGain);
  duckGain.connect(distortionNode);
  distortionNode.connect(oCtx.destination);

  // Start processing
  src.start();
  // Ducking (optional, not strictly required)
  const script = oCtx.createScriptProcessor(256, 1, 1);
  compressor.connect(script);
  script.connect(oCtx.destination);
  script.onaudioprocess = () => {
    duckGain.gain.value = 1 - Math.min(1, compressor.reduction / 20);
  };

  // Render and convert the result
  const rendered = await oCtx.startRendering();
  const bitDepth = +params.bitDepth;
  const wav = bufferToWav(rendered, bitDepth);
  const blob = new Blob([wav], { type: "audio/wav" });
  const size = blob.size;
  return { blob, size };
}
