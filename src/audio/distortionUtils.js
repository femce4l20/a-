// Soft clipping curve (sigmoid)
export function makeDistortionCurve(amount) {
  const k = typeof amount === "number" ? amount : 50;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

// Hard clipping curve
export function makeHardClippingCurve(amount) {
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const threshold = 1 - (amount / 1000); // amount 0-1000, threshold 1-0
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = Math.max(-threshold, Math.min(threshold, x));
  }
  return curve;
}

// Simple bitcrusher node
export function makeBitcrusher(ctx, bits = 4) {
  const node = ctx.createScriptProcessor(4096, 1, 1);
  const step = Math.pow(0.5, bits);
  node.onaudioprocess = function(e) {
    const input = e.inputBuffer.getChannelData(0);
    const output = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < input.length; i++) {
      output[i] = Math.round(input[i] / step) * step;
    }
  };
  return node;
}
