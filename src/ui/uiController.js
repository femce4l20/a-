import { getAllInputs, setAllInputs, saveAllPresets, loadAllPresets } from '../presets/presetManager.js';
import { processAudio } from '../audio/audioProcessor.js';

function refreshPresetList(presetList) {
  const store = loadAllPresets();
  presetList.innerHTML = "";
  Object.keys(store).forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    presetList.appendChild(opt);
  });
}

// Update slider value displays
function setupSliderLabels() {
  const sliders = document.querySelectorAll("input[type=range]");
  sliders.forEach(slider => {
    const valEl = document.getElementById(slider.id + "Val");
    if (valEl) {
      slider.addEventListener("input", () => {
        valEl.textContent = slider.value;
      });
      // Set initial value
      valEl.textContent = slider.value;
    }
  });
}

export function initializeUI(presets = {}) {
  const fileInput = document.getElementById("audioFile");
  const processBtn = document.getElementById("process");
  const player = document.getElementById("player");
  const presetName = document.getElementById("presetName");
  const savePreset = document.getElementById("savePreset");
  const presetList = document.getElementById("presetList");
  const loadPreset = document.getElementById("loadPreset");
  const deletePreset = document.getElementById("deletePreset");
  let arrayBuffer;

  setupSliderLabels();

  savePreset.addEventListener("click", () => {
    const name = presetName.value.trim();
    if (!name) return;
    const store = loadAllPresets();
    store[name] = getAllInputs();
    saveAllPresets(store);
    refreshPresetList(presetList);
    presetName.value = "";
  });

  loadPreset.addEventListener("click", () => {
    const name = presetList.value;
    const store = loadAllPresets();
    if (store[name]) setAllInputs(store[name]);
  });

  deletePreset.addEventListener("click", () => {
    const name = presetList.value;
    const store = loadAllPresets();
    delete store[name];
    saveAllPresets(store);
    refreshPresetList(presetList);
  });

  refreshPresetList(presetList);

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    arrayBuffer = await file.arrayBuffer();
  });

  processBtn.addEventListener("click", async () => {
    if (!arrayBuffer) return;
    const params = getAllInputs();
    const { blob, size } = await processAudio(arrayBuffer, params);
    const url = URL.createObjectURL(blob);
    player.src = url;
    document.getElementById("fileSize").innerText = `Processed file size: ${size} bytes`;
    document.getElementById("recommendation").innerText =
      size >= 20 * 1024 * 1024 ? "File ≥ 20 MB. Try lower bit depth or sample rate." : "";
  });
}
