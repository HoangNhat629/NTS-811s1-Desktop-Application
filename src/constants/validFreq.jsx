export const validFreq = [
  { min: 30_000_000, max: 43_000_000 },
  { min: 43_000_000, max: 62_000_000 },
  { min: 62_000_000, max: 88_000_000 },
  { min: 108_000_000, max: 174_000_000 },
  { min: 225_000_000, max: 337_000_000 },
  { min: 337_000_000, max: 512_000_000 },
]; // Hz

export const validFreqRange = { min: 30_000_000, max: 512_000_000 };

// VHF: 30 MHz → 150 MHz
// UHF: 150 MHz → 512 MHz
export const VHF_UHF_BOUNDARY_MHZ = 150_000_000; //HZ

//25KHz
export const step_min = 25_000; //Hz
export const BAND = {
  VHF: "vhf",
  UHF: "uhf",
};
