// Thumbnail plates (no HUD): t picks the plate.
const ZH = [-319, 3996], GH = [2902, 2949], YH = [-434, 5655];
export default {
  size: [1920, 1080], duration: 10, final: true, fine: true, hatchA: .35, maxTilt: 34, zoomBlur: false, drift: false, noCaptions: true,
  cam: [{ t: 0, x: 300, z: 1200, w: 30000, rot: -8 }, { t: 4.9, x: 300, z: 1200, w: 30000, rot: -8 }, { t: 5, x: -600, z: 2800, w: 15000, rot: -14 }, { t: 10, x: -600, z: 2800, w: 15000, rot: -14 }],
  tilt: [{ t: 0, v: 32 }, { t: 10, v: 32 }],
  story: [{ t: 0, d: '12-12 10:00' }, { t: 10, d: '12-12 10:00' }],
  dark: [{ t: 0, v: .25 }, { t: 10, v: .25 }],
  hideDate: [[0, 10]], phases: [], legend: [], splash: false,
  items: [
    { type: 'wallGlow', t0: 0, t1: 10, dur: .01 },
    { type: 'blasts', t0: 0, t1: 10, at: ZH, radius: 700, n: 40, seed: 7, scale: 1.6 },
    { type: 'blasts', t0: 0, t1: 10, at: GH, radius: 600, n: 30, seed: 3, scale: 1.4 },
    { type: 'blasts', t0: 0, t1: 10, at: YH, radius: 900, n: 30, seed: 11, scale: 1.3 },
  ],
};
