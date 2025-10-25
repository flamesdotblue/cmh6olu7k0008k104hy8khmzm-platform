import Spline from '@splinetool/react-spline';
import { Rocket } from 'lucide-react';

export default function Hero({ onCTAClick }) {
  return (
    <div className="relative w-full h-[70vh] md:h-[78vh] overflow-hidden">
      <div className="absolute inset-0">
        <Spline scene="https://prod.spline.design/41MGRk-UDPKO-l6W/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/80 pointer-events-none" />

      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 mb-4 backdrop-blur-sm">
              <span className="text-xs text-neutral-200">FinScribe.ai</span>
              <span className="text-xs text-neutral-400">Automated MD&A draft generator</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-semibold leading-tight tracking-tight">
              Turn your financials into investor-ready MD&A drafts
            </h1>
            <p className="mt-4 text-neutral-300 text-lg md:text-xl">
              Upload CSV statements, get instant KPI insights and a structured Management Discussion & Analysis draft.
            </p>
            <div className="mt-8">
              <button onClick={onCTAClick} className="inline-flex items-center gap-2 rounded-lg bg-white text-black px-5 py-3 font-medium hover:bg-neutral-200 transition">
                <Rocket className="w-4 h-4" />
                Get started
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
