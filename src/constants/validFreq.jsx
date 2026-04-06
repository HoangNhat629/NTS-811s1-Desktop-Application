export const validFreq = [
  { min: 30, max: 43 },
  { min: 43, max: 62 },
  { min: 62, max: 88 },
  { min: 108, max: 174 },
  { min: 225, max: 337 },
  { min: 337, max: 512 },
]; // MHz

export const validFreqRange = { min: 30, max: 512 };

// VHF: 30 MHz → 150 MHz
// UHF: 150 MHz → 512 MHz
export const VHF_UHF_BOUNDARY_MHZ = 150; //MHZ

//25KHz
export const step_min = 0.025; //MHz

export const BAND = {
  VHF: "vhf",
  UHF: "uhf",
};

export const UNIT_MULTIPLIER = {
  Hz: 1,
  kHz: 1_000,
  MHz: 1_000_000,
};
