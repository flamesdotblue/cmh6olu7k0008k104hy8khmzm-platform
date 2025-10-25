import { Rocket, ShieldCheck, BarChart3 } from 'lucide-react';

export default function Header({ onGetStarted }) {
  return (
    <header className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-black via-neutral-950 to-neutral-950">
      <div className="absolute -inset-40 opacity-30 blur-3xl bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,.3),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,.25),transparent_50%)]" />
      <div className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 mb-4 backdrop-blur-sm">
            <span className="text-xs text-neutral-200">FinScribe.ai</span>
            <span className="text-xs text-neutral-400">Automated financial operations & MD&A</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold leading-tight tracking-tight">
            Turn raw financials into insights, automation, and reports
          </h1>
          <p className="mt-4 text-neutral-300 text-lg md:text-xl max-w-2xl">
            Upload CSV statements, compute KPIs, generate MD&A drafts, and manage invoices, expenses, payroll, assets, and more — all in one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button onClick={onGetStarted} className="inline-flex items-center gap-2 rounded-lg bg-white text-black px-5 py-3 font-medium hover:bg-neutral-200 transition">
              <Rocket className="w-4 h-4" />
              Get started
            </button>
            <div className="flex items-center gap-4 text-sm text-neutral-300">
              <div className="inline-flex items-center gap-2"><BarChart3 className="w-4 h-4" /> KPI Engine</div>
              <div className="inline-flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Secure local data</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
