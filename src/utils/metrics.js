function toNumber(val) {
  if (val == null) return NaN;
  const s = String(val).replace(/[$,\s]/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

export function formatCurrency(n) {
  if (!Number.isFinite(n)) return '—';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  } catch {
    return `$${Math.round(n).toLocaleString()}`;
  }
}

export function pct(v) {
  if (!Number.isFinite(v)) return '—';
  return `${(v * 100).toFixed(1)}%`;
}

function findCols(row) {
  const keys = Object.keys(row).map((k) => ({ k, kl: k.toLowerCase().trim() }));
  const col = (names) => keys.find(({ kl }) => names.includes(kl))?.k;
  const revenue = col(['revenue', 'sales', 'total revenue']);
  const cogs = col(['cogs', 'cost of goods sold', 'cost of sales']);
  const opex = col(['operatingexpenses', 'operating expenses', 'opex']);
  const netincome = col(['netincome', 'net income', 'profit', 'earnings']);
  const period = col(['period', 'date', 'quarter', 'month', 'year']);
  return { revenue, cogs, opex, netincome, period };
}

export function computeKPIs(rows) {
  if (!rows?.length) {
    return {
      values: {},
      formatted: {},
      meta: { latestPeriod: '', prevPeriod: '' },
    };
  }

  const { period } = findCols(rows[0]);

  let data = [...rows];
  if (period) {
    const parsed = data.map((r, i) => {
      const d = Date.parse(r[period]);
      return { r, i, t: Number.isFinite(d) ? d : i };
    });
    parsed.sort((a, b) => a.t - b.t);
    data = parsed.map((p) => p.r);
  }

  const latest = data[data.length - 1];
  const prev = data[data.length - 2] || {};

  const cols = findCols(latest);

  const R = toNumber(latest[cols.revenue]);
  const Rprev = toNumber(prev[cols.revenue]);
  const COGS = toNumber(latest[cols.cogs]);
  const OPEX = toNumber(latest[cols.opex]);
  const NI = toNumber(latest[cols.netincome]);

  const grossProfit = Number.isFinite(R) && Number.isFinite(COGS) ? R - COGS : NaN;
  const grossMargin = Number.isFinite(R) && R !== 0 ? grossProfit / R : NaN;
  const operatingIncome = Number.isFinite(R) && Number.isFinite(COGS) && Number.isFinite(OPEX) ? R - COGS - OPEX : NaN;
  const operatingMargin = Number.isFinite(R) && R !== 0 ? operatingIncome / R : NaN;
  const netMargin = Number.isFinite(R) && R !== 0 && Number.isFinite(NI) ? NI / R : NaN;
  const revenueGrowth = Number.isFinite(R) && Number.isFinite(Rprev) && Rprev !== 0 ? (R - Rprev) / Rprev : NaN;
  const cogsRatio = Number.isFinite(R) && R !== 0 && Number.isFinite(COGS) ? COGS / R : NaN;
  const opexRatio = Number.isFinite(R) && R !== 0 && Number.isFinite(OPEX) ? OPEX / R : NaN;

  const values = { revenue: R, netIncome: NI, grossProfit, grossMargin, operatingIncome, operatingMargin, netMargin, revenueGrowth, cogs: COGS, opex: OPEX, cogsRatio, opexRatio };

  const formatted = {
    revenue: formatCurrency(R),
    netIncome: formatCurrency(NI),
    grossMargin: pct(grossMargin),
    operatingMargin: pct(operatingMargin),
    netMargin: pct(netMargin),
    revenueGrowth: pct(revenueGrowth),
    cogsRatio: pct(cogsRatio),
    opexRatio: pct(opexRatio),
  };

  const latestPeriod = cols.period ? String(latest[cols.period] || '') : '';
  const prevPeriod = cols.period ? String(prev[cols.period] || '') : '';

  return { values, formatted, meta: { latestPeriod, prevPeriod } };
}
