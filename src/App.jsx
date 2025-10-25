import { useState, useMemo, useRef } from 'react';
import Hero from './components/Hero';
import FileUploader from './components/FileUploader';
import KPIResults from './components/KPIResults';
import DraftGenerator from './components/DraftGenerator';
import Footer from './components/Footer';
import { computeKPIs } from './utils/metrics';

export default function App() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ columns: [] });
  const uploadRef = useRef(null);

  const kpis = useMemo(() => computeKPIs(rows), [rows]);

  const handleData = (data, metaInfo) => {
    setRows(data);
    setMeta(metaInfo || { columns: Object.keys(data?.[0] || {}) });
    if (uploadRef.current) {
      uploadRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Hero onCTAClick={() => uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />

      <main className="relative z-10">
        <section ref={uploadRef} className="container mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">Upload financial statements (CSV)</h2>
          <p className="text-neutral-300 mb-6 max-w-3xl">Upload a CSV file with columns like: Period, Revenue, COGS, OperatingExpenses, NetIncome. You can export this from your accounting system or model. The app will compute key KPIs and generate a structured MD&A draft.</p>
          <FileUploader onData={handleData} />
        </section>

        <section className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
          <KPIResults kpis={kpis} hasData={rows.length > 0} />
        </section>

        <section className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
          <DraftGenerator kpis={kpis} rows={rows} columns={meta.columns} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
