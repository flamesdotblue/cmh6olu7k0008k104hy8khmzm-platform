import { useRef } from 'react';
import Header from './components/Header';
import DataWorkspace from './components/DataWorkspace';
import FinanceDashboard from './components/FinanceDashboard';
import Footer from './components/Footer';

export default function App() {
  const dataRef = useRef(null);
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Header onGetStarted={() => dataRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
      <main className="relative z-10">
        <section ref={dataRef} className="container mx-auto px-4 md:px-6 lg:px-8 py-10 md:py-14">
          <DataWorkspace />
        </section>
        <section className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
          <FinanceDashboard />
        </section>
      </main>
      <Footer />
    </div>
  );
}
