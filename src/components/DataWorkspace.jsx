import { useMemo, useState, useEffect } from 'react';
import { Upload, FileText, BarChart3, Wand2, Download, Copy } from 'lucide-react';
import { parseCSV } from '../utils/csv';
import { computeKPIs, formatCurrency, pct } from '../utils/metrics';

function KPIBlock({ kpis, hasData }) {
  const Stat = ({ label, value, note }) => (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm text-neutral-300">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value ?? '—'}</div>
      {note ? <div className="text-xs text-neutral-400 mt-1">{note}</div> : null}
    </div>
  );

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

function DraftGenerator({ kpis, rows, columns }) {
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);
  const disabled = !rows?.length;

  const buildDraft = (kpis, rows) => {
    if (!rows?.length) return '';
    const l = kpis?.meta?.latestPeriod || 'Latest';
    const p = kpis?.meta?.prevPeriod || 'Prior';

    const paragraphs = [];
    paragraphs.push(`Overview: For ${l}, the company reported revenue of ${formatCurrency(kpis.values.revenue)}. Revenue ${kpis.values.revenueGrowth > 0 ? 'increased' : kpis.values.revenueGrowth < 0 ? 'decreased' : 'was flat'} ${pct(kpis.values.revenueGrowth)} compared to ${p}.`);

    paragraphs.push(`Profitability: Gross margin was ${pct(kpis.values.grossMargin)}, reflecting COGS of ${formatCurrency(kpis.values.cogs)} and gross profit of ${formatCurrency(kpis.values.grossProfit)}. Operating margin was ${pct(kpis.values.operatingMargin)}, with operating expenses at ${pct(kpis.values.opexRatio)} of revenue. Net margin was ${pct(kpis.values.netMargin)} with net income of ${formatCurrency(kpis.values.netIncome)}.`);

    const drivers = [];
    if (kpis.values.revenueGrowth > 0.05) drivers.push('volume growth in core offerings');
    if (kpis.values.opexRatio > 0.35) drivers.push('higher operating expenses, including investments in growth and G&A');
    if (kpis.values.grossMargin < 0.4) drivers.push('pressure on unit economics and input costs');
    if (drivers.length) paragraphs.push(`Drivers: The period was influenced by ${drivers.join(' and ')}.`);

    paragraphs.push(`Outlook: Management will focus on disciplined execution, improving unit economics, and efficient allocation of operating expenses while maintaining growth initiatives.`);

    return [
      '# Management Discussion and Analysis',
      `Period: ${l}`,
      '',
      ...paragraphs,
    ].join('\n');
  };

  const generated = useMemo(() => buildDraft(kpis, rows), [kpis, rows]);

  const onGenerate = () => setDraft(generated);

  const download = () => {
    const blob = new Blob([draft || generated], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mdna-draft.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draft || generated);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-xl font-semibold">AI-style MD&A draft</h3>
          <p className="text-sm text-neutral-300">Generate a structured narrative from your KPIs. You can edit before exporting.</p>
        </div>
        <button onClick={onGenerate} disabled={disabled} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition ${disabled ? 'bg-white/10 text-neutral-400 cursor-not-allowed' : 'bg-white text-black hover:bg-neutral-200'}`}>
          <Wand2 className="w-4 h-4" />
          Generate draft
        </button>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <textarea
          value={draft || generated}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full h-64 md:h-80 bg-transparent outline-none resize-none text-neutral-100"
        />
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button onClick={download} disabled={!(draft || generated)} className="inline-flex items-center gap-2 rounded-lg bg-white text-black px-4 py-2 font-medium hover:bg-neutral-200 disabled:opacity-60 disabled:cursor-not-allowed">
          <Download className="w-4 h-4" />
          Download .txt
        </button>
        <button onClick={copy} disabled={!(draft || generated)} className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 font-medium hover:bg-white/20 disabled:opacity-60 disabled:cursor-not-allowed">
          <Copy className="w-4 h-4" />
          {copied ? 'Copied' : 'Copy to clipboard'}
        </button>
        {columns?.length ? (
          <div className="ml-auto text-xs text-neutral-400">Detected columns: {columns.join(', ')}</div>
        ) : null}
      </div>
    </div>
  );
}

export default function DataWorkspace() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ columns: [] });
  const [error, setError] = useState('');

  // Persist uploaded data in localStorage to avoid losing state on refresh
  useEffect(() => {
    const saved = localStorage.getItem('fs_csv_rows');
    const savedMeta = localStorage.getItem('fs_csv_meta');
    if (saved) setRows(JSON.parse(saved));
    if (savedMeta) setMeta(JSON.parse(savedMeta));
  }, []);
  useEffect(() => {
    localStorage.setItem('fs_csv_rows', JSON.stringify(rows));
    localStorage.setItem('fs_csv_meta', JSON.stringify(meta));
  }, [rows, meta]);

  const kpis = useMemo(() => computeKPIs(rows), [rows]);

  const handleText = (text) => {
    try {
      const { rows: r, columns } = parseCSV(text);
      if (!r.length) throw new Error('No rows found');
      setError('');
      setRows(r);
      setMeta({ columns });
    } catch (e) {
      setError(e.message || 'Failed to parse CSV');
    }
  };

  const onDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const text = await file.text();
    handleText(text);
  };

  const onChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    handleText(text);
  };

  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">Upload financial statements (CSV)</h2>
      <p className="text-neutral-300 mb-6 max-w-3xl">Upload a CSV file with columns like: Period, Revenue, COGS, OperatingExpenses, NetIncome. The app will compute key KPIs and generate a structured MD&A draft.</p>

      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        className="relative rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-6 md:p-8"
      >
        <label className="flex items-center gap-4 cursor-pointer">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
            <Upload className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium">Drag & drop your CSV here</h3>
            <p className="text-sm text-neutral-300">or click to browse your files. Max 10MB.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-white text-black px-4 py-2 font-medium hover:bg-neutral-200">
            <FileText className="w-4 h-4" />
            <span>Choose file</span>
          </div>
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={onChange} />
        </label>
        {error ? (
          <div className="mt-3 text-sm text-red-400">{error}</div>
        ) : null}
      </div>

      <div className="mt-4 text-sm text-neutral-300">Expected columns: Period, Revenue, COGS, OperatingExpenses, NetIncome</div>

      <div className="mt-8">
        <KPIBlock kpis={kpis} hasData={rows.length > 0} />
      </div>

      <DraftGenerator kpis={kpis} rows={rows} columns={meta.columns} />
    </div>
  );
}
