// Seeded pseudo-random number generator (Mulberry32)
// Ensures identical data across all three frameworks

export interface StockRow {
  id: number;
  ticker: string;
  company: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  sector: string;
  highlighted: boolean;
}

export interface UpdateEntry {
  rowIndex: number;
  newPrice: number;
  newChange: number;
  newChangePercent: number;
}

function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SECTORS: string[] = [
  'Technology',
  'Healthcare',
  'Finance',
  'Energy',
  'Consumer',
  'Industrial',
  'Materials',
  'Utilities',
];

const COMPANIES: string[] = [
  'Apex Systems', 'Bolt Technologies', 'Crescent Corp', 'Delta Networks',
  'Echo Dynamics', 'Forge Industries', 'Granite Holdings', 'Harbor Tech',
  'Ion Solutions', 'Jade Computing', 'Kite Biomedical', 'Lumen Power',
  'Mesa Analytics', 'Nova Semiconductors', 'Orbit Logistics', 'Pulse Energy',
  'Quartz Financial', 'Ridge Materials', 'Summit Health', 'Tide Commerce',
  'Ultra Manufacturing', 'Vortex Media', 'Wave Robotics', 'Xenon Pharma',
  'Yield Capital', 'Zenith Software', 'Amber Resources', 'Beacon Data',
  'Cipher Security', 'Drift Aerospace', 'Ember Renewables', 'Flux Devices',
  'Globe Ventures', 'Helix Genomics', 'Iris Networks', 'Jolt Electric',
  'Keystone Digital', 'Lattice Systems', 'Monarch Insurance', 'Nexus Cloud',
  'Onyx Minerals', 'Prism Optics', 'Quest Diagnostics', 'Relay Telecom',
  'Spark Motors', 'Trident Defense', 'Union Rail', 'Vertex AI',
  'Wren Biotech', 'Zephyr Aviation',
];

function generateTicker(rng: () => number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let ticker = '';
  for (let i = 0; i < 4; i++) {
    ticker += chars[Math.floor(rng() * chars.length)];
  }
  return ticker;
}

export function generateRows(count: number, seed: number = 42): StockRow[] {
  const rng = mulberry32(seed);
  const rows: StockRow[] = [];

  for (let i = 0; i < count; i++) {
    const price = Math.round((rng() * 500 + 1) * 100) / 100;
    const change = Math.round((rng() * 20 - 10) * 100) / 100;
    const changePercent = Math.round((change / price) * 10000) / 100;
    const volume = Math.floor(rng() * 50000000) + 100000;

    rows.push({
      id: i + 1,
      ticker: generateTicker(rng),
      company: COMPANIES[Math.floor(rng() * COMPANIES.length)],
      price,
      change,
      changePercent,
      volume,
      sector: SECTORS[Math.floor(rng() * SECTORS.length)],
      highlighted: false,
    });
  }

  return rows;
}

// Pre-generate update sequences so all frameworks apply identical mutations
export function generateUpdateSequence(
  rowCount: number,
  updatesPerTick: number,
  totalTicks: number,
  seed: number = 123,
): UpdateEntry[][] {
  const rng = mulberry32(seed);
  const sequence: UpdateEntry[][] = [];

  for (let tick = 0; tick < totalTicks; tick++) {
    const updates: UpdateEntry[] = [];
    for (let u = 0; u < updatesPerTick; u++) {
      const rowIndex = Math.floor(rng() * rowCount);
      const newPrice = Math.round((rng() * 500 + 1) * 100) / 100;
      const newChange = Math.round((rng() * 20 - 10) * 100) / 100;
      const newChangePercent = Math.round((newChange / newPrice) * 10000) / 100;
      updates.push({ rowIndex, newPrice, newChange, newChangePercent });
    }
    sequence.push(updates);
  }

  return sequence;
}

export function formatVolume(vol: number): string {
  return vol.toLocaleString('en-US');
}

export function formatPrice(price: number): string {
  return price.toFixed(2);
}

export function formatChange(change: number): string {
  return (change >= 0 ? '+' : '') + change.toFixed(2);
}

export function formatPercent(pct: number): string {
  return (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
}

export { SECTORS };
