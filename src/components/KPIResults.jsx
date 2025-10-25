import { BarChart3 } from 'lucide-react';

const Stat = ({ label, value, note }) => (
  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
    <div className="text-sm text-neutral-300">{label}</div>
    <div className="text-2xl font-semibold mt-1">{value ?? '—'}</div>
    {note ? <div className="text-xs text-neutral-400 mt-1">{note}</div> : null}
  </div>
);

export default function KPIResults({ kpis, hasData }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-lg bg-white/10 grid place-items-center">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">Key performance indicators</h3>
          <p className="text-neutral-300 text-sm">Calculated from your latest two periods.</p>
        </div>
      </div>

      {!hasData ? (
        <div className="text-neutral-400 text-sm">Upload a CSV to view KPIs.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Revenue (latest)" value={kpis.formatted.revenue} note={kpis.meta.latestPeriod} />
          <Stat label="Revenue growth" value={kpis.formatted.revenueGrowth} note={`${kpis.meta.prevPeriod} → ${kpis.meta.latestPeriod}`} />
          <Stat label="Gross margin" value={kpis.formatted.grossMargin} />
          <Stat label="Operating margin" value={kpis.formatted.operatingMargin} />
          <Stat label="Net margin" value={kpis.formatted.netMargin} />
          <Stat label="COGS as % of revenue" value={kpis.formatted.cogsRatio} />
          <Stat label="Operating expenses %" value={kpis.formatted.opexRatio} />
          <Stat label="Net income (latest)" value={kpis.formatted.netIncome} note={kpis.meta.latestPeriod} />
        </div>
      )}
    </div>
  );
}
