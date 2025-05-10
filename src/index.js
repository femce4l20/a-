import { initializeUI } from './ui/uiController.js';

let presets = {};

fetch('presets.json')
  .then(res => res.json())
  .then(data => { presets = data; })
  .catch(() => { presets = {}; })
  .then(() => initializeUI(presets));
