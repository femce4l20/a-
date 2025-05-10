export function getAllInputs() {
  const keys = [
    "distType","distAmount","bitDepth","hpFreq","notch1Freq","notch1Q","notch2Freq","notch2Q",
    "midGain","sideGain","midEqFreq","midEqGain","sideEqFreq","sideEqGain",
    "formant1Freq","formant1Q","formant1Gain","formant2Freq","formant2Q","formant2Gain",
    "compThreshold","compRatio","compAttack","compRelease"
  ];
  const o = {};
  keys.forEach(k => { o[k] = document.getElementById(k).value; });
  return o;
}

export function setAllInputs(o) {
  Object.keys(o).forEach(k => {
    const el = document.getElementById(k);
    if (el) el.value = o[k];
    // Also update value displays for sliders
    const valEl = document.getElementById(k + "Val");
    if (valEl) valEl.textContent = o[k];
  });
}

export function saveAllPresets(store) {
  localStorage.setItem("audioPresets", JSON.stringify(store));
}

export function loadAllPresets() {
  const raw = localStorage.getItem("audioPresets");
  return raw ? JSON.parse(raw) : {};
}
