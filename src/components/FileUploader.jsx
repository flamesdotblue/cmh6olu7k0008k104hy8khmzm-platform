import { useCallback, useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { parseCSV } from '../utils/csv';

export default function FileUploader({ onData }) {
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState([]);

  const handleText = useCallback((text) => {
    try {
      const { rows, columns } = parseCSV(text);
      if (!rows.length) throw new Error('No rows found');
      setPreview(rows.slice(0, 3));
      setError('');
      onData(rows, { columns });
    } catch (e) {
      setError(e.message || 'Failed to parse CSV');
    }
  }, [onData]);

  const onDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    handleText(text);
  };

  const onChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    handleText(text);
  };

  return (
    <div>
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        className="relative rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-6 md:p-8"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
            <Upload className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium">Drag & drop your CSV here</h3>
            <p className="text-sm text-neutral-300">or click to browse your files. Max 10MB.</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white text-black px-4 py-2 font-medium hover:bg-neutral-200">
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={onChange} />
            <FileText className="w-4 h-4" />
            <span>Choose file</span>
          </label>
        </div>
        {fileName ? (
          <div className="mt-4 text-sm text-neutral-300">Selected: {fileName}</div>
        ) : null}
        {error ? (
          <div className="mt-3 text-sm text-red-400">{error}</div>
        ) : null}
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold text-neutral-200 mb-2">Expected columns</h4>
        <div className="text-sm text-neutral-300">Period, Revenue, COGS, OperatingExpenses, NetIncome</div>
        {preview.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-neutral-200 mb-2">Preview (first 3 rows)</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-neutral-300">
                  <tr>
                    {Object.keys(preview[0]).map((h) => (
                      <th key={h} className="text-left font-medium pr-6 pb-2 border-b border-white/10">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r, idx) => (
                    <tr key={idx} className="text-neutral-200">
                      {Object.keys(r).map((h) => (
                        <td key={h} className="pr-6 py-2 border-b border-white/5 whitespace-nowrap">{String(r[h])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
