import { useMemo, useState } from 'react';
import { Wand2, Download, Copy } from 'lucide-react';
import { formatCurrency, pct } from '../utils/metrics';

function buildDraft(kpis, rows) {
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
}

export default function DraftGenerator({ kpis, rows, columns }) {
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);

  const disabled = !rows?.length;

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
    <div>
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
