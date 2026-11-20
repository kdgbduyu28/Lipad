/**
 * Rough daily spending per adult in pesos: a share of a room for two, food,
 * and local transport. Kids count at 60%, infants free. Hand-written estimates
 * from typical 2025-26 hostel/hotel and meal prices; always shown as "estimate".
 *
 *   tipid = budget (hostel/fan room, carinderia, jeep/bus)
 *   sakto = mid (3-star or good Airbnb, restaurants, Grab now and then)
 *   sulit = comfort (4-star, nice meals, tours)
 */

export type Style = 'tipid' | 'sakto' | 'sulit';
export type Daily = Record<Style, number>;

export const SPENDING: Record<string, Daily> = {
  // Philippines
  MNL: { tipid: 1500, sakto: 3000, sulit: 6000 },
  CEB: { tipid: 1400, sakto: 2800, sulit: 5500 },
  MPH: { tipid: 2200, sakto: 4200, sulit: 8500 },
  KLO: { tipid: 2200, sakto: 4200, sulit: 8500 },
  PPS: { tipid: 1500, sakto: 3000, sulit: 6000 },
  USU: { tipid: 1800, sakto: 3500, sulit: 7000 },
  ENI: { tipid: 2000, sakto: 4000, sulit: 9000 },
  IAO: { tipid: 1700, sakto: 3300, sulit: 6500 },
  TAG: { tipid: 1500, sakto: 3000, sulit: 6000 },
  DVO: { tipid: 1300, sakto: 2600, sulit: 5000 },
  ILO: { tipid: 1200, sakto: 2400, sulit: 4500 },
  BCD: { tipid: 1200, sakto: 2400, sulit: 4500 },
  DGT: { tipid: 1200, sakto: 2400, sulit: 4500 },
  LAO: { tipid: 1300, sakto: 2500, sulit: 5000 },
  CGY: { tipid: 1200, sakto: 2400, sulit: 4500 },
  BXU: { tipid: 1200, sakto: 2300, sulit: 4300 },
  TAC: { tipid: 1100, sakto: 2200, sulit: 4200 },
  CRK: { tipid: 1300, sakto: 2600, sulit: 5000 },
  // Asia
  TYO: { tipid: 4500, sakto: 8000, sulit: 15000 },
  OSA: { tipid: 4000, sakto: 7200, sulit: 13500 },
  FUK: { tipid: 3500, sakto: 6500, sulit: 12000 },
  NGO: { tipid: 3700, sakto: 6800, sulit: 12500 },
  SPK: { tipid: 3800, sakto: 7000, sulit: 13000 },
  OKA: { tipid: 3700, sakto: 6800, sulit: 12500 },
  SEL: { tipid: 3800, sakto: 7000, sulit: 13000 },
  PUS: { tipid: 3300, sakto: 6000, sulit: 11000 },
  CJU: { tipid: 3300, sakto: 6000, sulit: 11000 },
  HKG: { tipid: 4200, sakto: 7500, sulit: 14000 },
  MFM: { tipid: 4000, sakto: 7000, sulit: 13000 },
  TPE: { tipid: 3200, sakto: 5800, sulit: 11000 },
  SIN: { tipid: 4500, sakto: 8000, sulit: 15000 },
  BKK: { tipid: 2200, sakto: 4200, sulit: 8000 },
  HKT: { tipid: 2500, sakto: 4800, sulit: 9500 },
  KUL: { tipid: 2200, sakto: 4000, sulit: 7500 },
  SGN: { tipid: 1800, sakto: 3500, sulit: 7000 },
  HAN: { tipid: 1800, sakto: 3500, sulit: 7000 },
  DAD: { tipid: 1800, sakto: 3500, sulit: 7000 },
  DPS: { tipid: 2200, sakto: 4200, sulit: 8500 },
  JKT: { tipid: 2000, sakto: 3800, sulit: 7000 },
  PNH: { tipid: 1800, sakto: 3300, sulit: 6500 },
  // Farther
  DXB: { tipid: 5000, sakto: 9000, sulit: 18000 },
  DOH: { tipid: 5000, sakto: 9000, sulit: 17000 },
  SYD: { tipid: 5500, sakto: 9500, sulit: 18000 },
  MEL: { tipid: 5200, sakto: 9000, sulit: 17000 },
  LON: { tipid: 6500, sakto: 11000, sulit: 21000 },
  LAX: { tipid: 6500, sakto: 11000, sulit: 21000 },
  SFO: { tipid: 7000, sakto: 12000, sulit: 22000 },
  NYC: { tipid: 7500, sakto: 13000, sulit: 24000 },
  YVR: { tipid: 6000, sakto: 10000, sulit: 19000 },
  YTO: { tipid: 6000, sakto: 10000, sulit: 19000 },
};

export const KID_SHARE = 0.6;
