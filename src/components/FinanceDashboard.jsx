import { useEffect, useMemo, useState } from 'react';
import { Plus, CheckCircle2, XCircle, Receipt, DollarSign, TrendingUp, AlertTriangle, Calendar, CreditCard, Building, Globe, Users, Briefcase } from 'lucide-react';

// Utilities
const currencies = ['USD', 'EUR', 'GBP', 'JPY'];
const fxRates = { // base: USD
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 155,
};
const fmtCurrency = (n, ccy='USD') => {
  const v = Number.isFinite(n) ? n : 0;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: ccy, maximumFractionDigits: 2 }).format(v);
  } catch {
    return `${ccy} ${v.toFixed(2)}`;
  }
};
const uid = () => Math.random().toString(36).slice(2, 10);

// Local storage helpers
const useLocalState = (key, initial) => {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initial;
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(state)); }, [key, state]);
  return [state, setState];
};

// Section header
const SectionHeader = ({ icon: Icon, title, subtitle, action }) => (
  <div className="flex items-center justify-between gap-4 mb-3">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-white/10 grid place-items-center"><Icon className="w-5 h-5" /></div>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-neutral-300">{subtitle}</p>
      </div>
    </div>
    {action}
  </div>
);

// Tabs
function Tabs({ tabs, current, onChange }) {
  return (
    <div className="border-b border-white/10 mb-5 overflow-x-auto">
      <div className="flex items-center gap-1">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => onChange(t.key)} className={`px-4 py-2 text-sm rounded-t-lg border-b-2 -mb-[1px] ${current === t.key ? 'border-white text-white' : 'border-transparent text-neutral-400 hover:text-white hover:border-white/30'}`}>{t.label}</button>
        ))}
      </div>
    </div>
  );
}

export default function FinanceDashboard() {
  const [tab, setTab] = useState('expenses');
  const [ccy, setCcy] = useLocalState('fs_ccy', 'USD');

  // Expenses
  const [expenses, setExpenses] = useLocalState('fs_expenses', []);
  const [expenseDraft, setExpenseDraft] = useState({ date: '', category: 'General', amount: '', vendor: '', notes: '' });
  const [receipts, setReceipts] = useLocalState('fs_receipts', {}); // id -> dataURL
  const addExpense = () => {
    if (!expenseDraft.date || !expenseDraft.amount) return;
    const amt = Number(expenseDraft.amount);
    const e = { id: uid(), status: 'Pending', ...expenseDraft, amount: amt };
    setExpenses([ ...expenses, e ]);
    setExpenseDraft({ date: '', category: 'General', amount: '', vendor: '', notes: '' });
  };
  const approveExpense = (id) => setExpenses(expenses.map(e => e.id === id ? { ...e, status: 'Approved' } : e));
  const rejectExpense = (id) => setExpenses(expenses.map(e => e.id === id ? { ...e, status: 'Rejected' } : e));

  // Invoices
  const [invoices, setInvoices] = useLocalState('fs_invoices', []);
  const [invDraft, setInvDraft] = useState({ date: '', due: '', client: '', items: [{ desc: '', qty: 1, price: 0 }], status: 'Draft', currency: 'USD', notes: '' });
  const invTotal = (inv) => inv.items.reduce((s, it) => s + (Number(it.qty) * Number(it.price || 0)), 0);
  const addItem = () => setInvDraft({ ...invDraft, items: [ ...invDraft.items, { desc: '', qty: 1, price: 0 } ] });
  const saveInvoice = () => {
    const inv = { id: uid(), ...invDraft, total: invTotal(invDraft) };
    setInvoices([ ...invoices, inv ]);
    setInvDraft({ date: '', due: '', client: '', items: [{ desc: '', qty: 1, price: 0 }], status: 'Draft', currency: 'USD', notes: '' });
  };
  const markPaid = (id) => setInvoices(invoices.map(i => i.id === id ? { ...i, status: 'Paid', paidOn: new Date().toISOString().slice(0,10) } : i));

  // Budget & Forecast
  const [budgets, setBudgets] = useLocalState('fs_budgets', []); // {period, revenue, cogs, opex}
  const [budgetDraft, setBudgetDraft] = useState({ period: '', revenue: '', cogs: '', opex: '' });
  const addBudget = () => {
    if (!budgetDraft.period) return;
    const b = { id: uid(), period: budgetDraft.period, revenue: Number(budgetDraft.revenue||0), cogs: Number(budgetDraft.cogs||0), opex: Number(budgetDraft.opex||0) };
    setBudgets([ ...budgets, b ]);
    setBudgetDraft({ period: '', revenue: '', cogs: '', opex: '' });
  };
  const variance = (actual, budget) => Number.isFinite(budget) && budget !== 0 ? (actual - budget) / budget : 0;

  // Cash flow
  const [cashProjections, setCashProjections] = useLocalState('fs_cash_proj', []); // {date, inflow, outflow}
  const [cashDraft, setCashDraft] = useState({ date: '', inflow: '', outflow: '' });
  const addCash = () => {
    if (!cashDraft.date) return;
    setCashProjections([ ...cashProjections, { id: uid(), date: cashDraft.date, inflow: Number(cashDraft.inflow||0), outflow: Number(cashDraft.outflow||0) } ]);
    setCashDraft({ date: '', inflow: '', outflow: '' });
  };
  const cashBalance = useMemo(() => cashProjections.reduce((s, r) => s + r.inflow - r.outflow, 0), [cashProjections]);
  const lowCash = cashBalance < 0;

  // Reports (simple P&L/BS/CF from budgets + invoices + expenses)
  const pnl = useMemo(() => {
    const revenue = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.total, 0);
    const cogs = budgets.reduce((s, b) => s + b.cogs, 0); // simplified
    const opex = expenses.filter(e => e.status !== 'Rejected').reduce((s, e) => s + e.amount, 0);
    const gross = revenue - cogs;
    const op = gross - opex;
    const net = op; // simplified
    return { revenue, cogs, opex, gross, op, net };
  }, [invoices, budgets, expenses]);

  const balSheet = useMemo(() => {
    const cash = cashBalance + invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.total, 0);
    const ar = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + i.total, 0);
    const ap = expenses.filter(e => e.status !== 'Rejected').reduce((s, e) => s + e.amount, 0);
    const equity = cash + ar - ap; // ultra simplified
    return { cash, ar, ap, equity };
  }, [cashBalance, invoices, expenses]);

  const cfStatement = useMemo(() => {
    const ops = pnl.net; // simplified
    const investing = 0;
    const financing = 0;
    const netChange = ops + investing + financing;
    return { ops, investing, financing, netChange };
  }, [pnl]);

  // Tax & compliance
  const [taxRate, setTaxRate] = useLocalState('fs_tax_rate', 0.21);
  const estTax = Math.max(0, pnl.net * taxRate);
  const [compliance, setCompliance] = useLocalState('fs_compliance', { filings: false, payroll: false, salesTax: false, corpTax: false });

  // AP/AR
  const [payables, setPayables] = useLocalState('fs_ap', []); // {vendor, amount, due}
  const [receivables, setReceivables] = useLocalState('fs_ar', []); // {client, amount, due}
  const [apDraft, setApDraft] = useState({ vendor: '', amount: '', due: '' });
  const [arDraft, setArDraft] = useState({ client: '', amount: '', due: '' });

  // Goals
  const [goals, setGoals] = useLocalState('fs_goals', []); // {name, target, due, progress}
  const [goalDraft, setGoalDraft] = useState({ name: '', target: '', due: '', progress: 0 });

  // Payroll
  const [employees, setEmployees] = useLocalState('fs_employees', []); // {name, salary, payCycle}
  const [empDraft, setEmpDraft] = useState({ name: '', salary: '', payCycle: 'Monthly' });

  // Assets & depreciation
  const [assets, setAssets] = useLocalState('fs_assets', []); // {name, cost, lifeYears, start}
  const [assetDraft, setAssetDraft] = useState({ name: '', cost: '', lifeYears: '3', start: '' });
  const depreciationPerYear = (a) => (Number(a.cost||0) / Number(a.lifeYears||1));

  // Conversion helper
  const convert = (amount, from, to) => {
    const usd = amount / (fxRates[from] || 1);
    return usd * (fxRates[to] || 1);
  };

  const tabs = [
    { key: 'expenses', label: 'Expenses' },
    { key: 'invoices', label: 'Invoices' },
    { key: 'planning', label: 'Budget & Forecast' },
    { key: 'cash', label: 'Cash Flow' },
    { key: 'reports', label: 'Reports' },
    { key: 'tax', label: 'Tax & Compliance' },
    { key: 'apar', label: 'AP/AR' },
    { key: 'goals', label: 'Goals' },
    { key: 'payroll', label: 'Payroll' },
    { key: 'assets', label: 'Assets' },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold">Financial Operations Suite</h2>
          <p className="text-sm text-neutral-300">Track expenses, manage invoices, plan budgets, project cash flow, handle tax and more.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-neutral-400">Currency:</span>
          <select value={ccy} onChange={(e) => setCcy(e.target.value)} className="bg-white/10 border border-white/10 rounded px-2 py-1 outline-none">
            {currencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <Tabs tabs={tabs} current={tab} onChange={setTab} />

      {tab === 'expenses' && (
        <div>
          <SectionHeader icon={DollarSign} title="Expense Tracking & Approvals" subtitle="Categorize expenses, attach receipts, and manage approvals" action={
            <button onClick={addExpense} className="inline-flex items-center gap-2 rounded-lg bg-white text-black px-3 py-2 text-sm font-medium hover:bg-neutral-200"><Plus className="w-4 h-4" /> Add Expense</button>
          } />

          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-1 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="grid gap-2 text-sm">
                <label className="grid gap-1">
                  <span className="text-neutral-300">Date</span>
                  <input value={expenseDraft.date} onChange={(e)=>setExpenseDraft({...expenseDraft,date:e.target.value})} type="date" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                </label>
                <label className="grid gap-1">
                  <span className="text-neutral-300">Category</span>
                  <select value={expenseDraft.category} onChange={(e)=>setExpenseDraft({...expenseDraft,category:e.target.value})} className="bg-white/10 border border-white/10 rounded px-2 py-1">
                    <option>General</option>
                    <option>Travel</option>
                    <option>Software</option>
                    <option>Marketing</option>
                    <option>Payroll</option>
                    <option>Facilities</option>
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="text-neutral-300">Amount ({ccy})</span>
                  <input value={expenseDraft.amount} onChange={(e)=>setExpenseDraft({...expenseDraft,amount:e.target.value})} type="number" step="0.01" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                </label>
                <label className="grid gap-1">
                  <span className="text-neutral-300">Vendor</span>
                  <input value={expenseDraft.vendor} onChange={(e)=>setExpenseDraft({...expenseDraft,vendor:e.target.value})} type="text" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                </label>
                <label className="grid gap-1">
                  <span className="text-neutral-300">Notes</span>
                  <input value={expenseDraft.notes} onChange={(e)=>setExpenseDraft({...expenseDraft,notes:e.target.value})} type="text" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                </label>
                <label className="grid gap-1">
                  <span className="text-neutral-300">Receipt (image)</span>
                  <input type="file" accept="image/*" onChange={async (e)=>{
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const url = URL.createObjectURL(f);
                    const id = 'tmp';
                    setExpenseDraft({ ...expenseDraft, receiptId: id });
                    setTimeout(()=>URL.revokeObjectURL(url), 10000);
                  }} className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                </label>
              </div>
            </div>
            <div className="md:col-span-2 rounded-xl border border-white/10 bg-white/5 p-4 overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-neutral-300">
                  <tr>
                    <th className="text-left font-medium pb-2">Date</th>
                    <th className="text-left font-medium pb-2">Category</th>
                    <th className="text-left font-medium pb-2">Vendor</th>
                    <th className="text-left font-medium pb-2">Amount</th>
                    <th className="text-left font-medium pb-2">Status</th>
                    <th className="text-left font-medium pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(e => (
                    <tr key={e.id} className="border-t border-white/10">
                      <td className="py-2">{e.date}</td>
                      <td className="py-2">{e.category}</td>
                      <td className="py-2">{e.vendor}</td>
                      <td className="py-2">{fmtCurrency(e.amount, ccy)}</td>
                      <td className="py-2">{e.status}</td>
                      <td className="py-2 flex items-center gap-2">
                        <button onClick={()=>approveExpense(e.id)} className="inline-flex items-center gap-1 text-green-400 hover:text-green-300"><CheckCircle2 className="w-4 h-4" />Approve</button>
                        <button onClick={()=>rejectExpense(e.id)} className="inline-flex items-center gap-1 text-red-400 hover:text-red-300"><XCircle className="w-4 h-4" />Reject</button>
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-neutral-400">No expenses yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'invoices' && (
        <div>
          <SectionHeader icon={Receipt} title="Invoice Generator & Management" subtitle="Create invoices, set templates, and track payments" action={
            <button onClick={saveInvoice} className="inline-flex items-center gap-2 rounded-lg bg-white text-black px-3 py-2 text-sm font-medium hover:bg-neutral-200"><Plus className="w-4 h-4" /> Save Invoice</button>
          } />

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="grid gap-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1">
                    <span className="text-neutral-300">Date</span>
                    <input value={invDraft.date} onChange={(e)=>setInvDraft({...invDraft,date:e.target.value})} type="date" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-neutral-300">Due</span>
                    <input value={invDraft.due} onChange={(e)=>setInvDraft({...invDraft,due:e.target.value})} type="date" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                  </label>
                </div>
                <label className="grid gap-1">
                  <span className="text-neutral-300">Client</span>
                  <input value={invDraft.client} onChange={(e)=>setInvDraft({...invDraft,client:e.target.value})} type="text" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                </label>
                <label className="grid gap-1">
                  <span className="text-neutral-300">Currency</span>
                  <select value={invDraft.currency} onChange={(e)=>setInvDraft({...invDraft,currency:e.target.value})} className="bg-white/10 border border-white/10 rounded px-2 py-1">
                    {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-neutral-300">Items</span>
                    <button onClick={addItem} className="text-sm text-white/80 hover:text-white inline-flex items-center gap-1"><Plus className="w-4 h-4" />Add</button>
                  </div>
                  <div className="grid gap-2">
                    {invDraft.items.map((it, idx) => (
                      <div key={idx} className="grid grid-cols-6 gap-2">
                        <input value={it.desc} onChange={(e)=>{
                          const items = [...invDraft.items]; items[idx] = { ...items[idx], desc: e.target.value }; setInvDraft({...invDraft, items});
                        }} placeholder="Description" className="col-span-3 bg-white/10 border border-white/10 rounded px-2 py-1 text-sm" />
                        <input value={it.qty} type="number" onChange={(e)=>{
                          const items = [...invDraft.items]; items[idx] = { ...items[idx], qty: Number(e.target.value) }; setInvDraft({...invDraft, items});
                        }} className="col-span-1 bg-white/10 border border-white/10 rounded px-2 py-1 text-sm" />
                        <input value={it.price} type="number" onChange={(e)=>{
                          const items = [...invDraft.items]; items[idx] = { ...items[idx], price: Number(e.target.value) }; setInvDraft({...invDraft, items});
                        }} className="col-span-2 bg-white/10 border border-white/10 rounded px-2 py-1 text-sm" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-neutral-300 mt-2">Total: {fmtCurrency(invTotal(invDraft), invDraft.currency)}</div>
                <label className="grid gap-1 mt-2">
                  <span className="text-neutral-300">Notes</span>
                  <textarea value={invDraft.notes} onChange={(e)=>setInvDraft({...invDraft,notes:e.target.value})} className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                </label>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-neutral-300">
                  <tr>
                    <th className="text-left font-medium pb-2">Client</th>
                    <th className="text-left font-medium pb-2">Date</th>
                    <th className="text-left font-medium pb-2">Due</th>
                    <th className="text-left font-medium pb-2">Total</th>
                    <th className="text-left font-medium pb-2">Status</th>
                    <th className="text-left font-medium pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} className="border-t border-white/10">
                      <td className="py-2">{inv.client}</td>
                      <td className="py-2">{inv.date}</td>
                      <td className="py-2">{inv.due}</td>
                      <td className="py-2">{fmtCurrency(convert(inv.total, inv.currency, ccy), ccy)}</td>
                      <td className="py-2">{inv.status}</td>
                      <td className="py-2">
                        <button onClick={()=>markPaid(inv.id)} className="text-green-400 hover:text-green-300 text-sm">Mark paid</button>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-neutral-400">No invoices yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'planning' && (
        <div>
          <SectionHeader icon={TrendingUp} title="Budget Planning & Forecasting" subtitle="Create budgets and track variances against results" />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="grid gap-2 text-sm">
                <label className="grid gap-1">
                  <span className="text-neutral-300">Period</span>
                  <input value={budgetDraft.period} onChange={(e)=>setBudgetDraft({...budgetDraft,period:e.target.value})} type="text" placeholder="e.g., 2025-01 or Q1-2025" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <label className="grid gap-1">
                    <span className="text-neutral-300">Revenue</span>
                    <input value={budgetDraft.revenue} onChange={(e)=>setBudgetDraft({...budgetDraft,revenue:e.target.value})} type="number" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-neutral-300">COGS</span>
                    <input value={budgetDraft.cogs} onChange={(e)=>setBudgetDraft({...budgetDraft,cogs:e.target.value})} type="number" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-neutral-300">OPEX</span>
                    <input value={budgetDraft.opex} onChange={(e)=>setBudgetDraft({...budgetDraft,opex:e.target.value})} type="number" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                  </label>
                </div>
                <button onClick={addBudget} className="mt-2 inline-flex items-center gap-2 rounded-lg bg-white text-black px-3 py-2 text-sm font-medium hover:bg-neutral-200"><Plus className="w-4 h-4" /> Add Budget</button>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-neutral-300">
                  <tr>
                    <th className="text-left font-medium pb-2">Period</th>
                    <th className="text-left font-medium pb-2">Revenue</th>
                    <th className="text-left font-medium pb-2">COGS</th>
                    <th className="text-left font-medium pb-2">OPEX</th>
                    <th className="text-left font-medium pb-2">Variance (Net)</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map(b => {
                    const netBudget = b.revenue - b.cogs - b.opex;
                    const netActual = pnl.net; // simplified single-period comparison
                    return (
                      <tr key={b.id} className="border-t border-white/10">
                        <td className="py-2">{b.period}</td>
                        <td className="py-2">{fmtCurrency(b.revenue, ccy)}</td>
                        <td className="py-2">{fmtCurrency(b.cogs, ccy)}</td>
                        <td className="py-2">{fmtCurrency(b.opex, ccy)}</td>
                        <td className="py-2">{(variance(netActual, netBudget) * 100).toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                  {budgets.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-neutral-400">No budgets yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'cash' && (
        <div>
          <SectionHeader icon={CreditCard} title="Cash Flow Management" subtitle="Project cash flows and set alerts for low balances" />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="grid gap-2 text-sm">
                <label className="grid gap-1">
                  <span className="text-neutral-300">Date</span>
                  <input value={cashDraft.date} onChange={(e)=>setCashDraft({...cashDraft,date:e.target.value})} type="date" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1">
                    <span className="text-neutral-300">Inflow</span>
                    <input value={cashDraft.inflow} onChange={(e)=>setCashDraft({...cashDraft,inflow:e.target.value})} type="number" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-neutral-300">Outflow</span>
                    <input value={cashDraft.outflow} onChange={(e)=>setCashDraft({...cashDraft,outflow:e.target.value})} type="number" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                  </label>
                </div>
                <button onClick={addCash} className="mt-2 inline-flex items-center gap-2 rounded-lg bg-white text-black px-3 py-2 text-sm font-medium hover:bg-neutral-200"><Plus className="w-4 h-4" /> Add Projection</button>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 overflow-auto">
              <div className={`mb-3 inline-flex items-center gap-2 text-sm ${cashBalance < 0 ? 'text-red-300' : 'text-green-300'}`}>
                <AlertTriangle className="w-4 h-4" /> Balance: {fmtCurrency(cashBalance, ccy)} {cashBalance < 0 ? '(Alert: negative projected balance)' : ''}
              </div>
              <table className="w-full text-sm">
                <thead className="text-neutral-300">
                  <tr>
                    <th className="text-left font-medium pb-2">Date</th>
                    <th className="text-left font-medium pb-2">Inflow</th>
                    <th className="text-left font-medium pb-2">Outflow</th>
                    <th className="text-left font-medium pb-2">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {cashProjections.map(r => (
                    <tr key={r.id} className="border-t border-white/10">
                      <td className="py-2">{r.date}</td>
                      <td className="py-2">{fmtCurrency(r.inflow, ccy)}</td>
                      <td className="py-2">{fmtCurrency(r.outflow, ccy)}</td>
                      <td className="py-2">{fmtCurrency(r.inflow - r.outflow, ccy)}</td>
                    </tr>
                  ))}
                  {cashProjections.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-neutral-400">No projections yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div>
          <SectionHeader icon={Building} title="Financial Reporting Suite" subtitle="P&L, Balance Sheet, and Cash Flow statements (simplified)" />
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h4 className="font-semibold mb-2">Profit & Loss</h4>
              <div className="text-sm grid gap-1">
                <div className="flex justify-between"><span className="text-neutral-300">Revenue</span><span>{fmtCurrency(pnl.revenue, ccy)}</span></div>
                <div className="flex justify-between"><span className="text-neutral-300">COGS</span><span>{fmtCurrency(pnl.cogs, ccy)}</span></div>
                <div className="flex justify-between"><span className="text-neutral-300">Gross Profit</span><span>{fmtCurrency(pnl.gross, ccy)}</span></div>
                <div className="flex justify-between"><span className="text-neutral-300">Operating Expenses</span><span>{fmtCurrency(pnl.opex, ccy)}</span></div>
                <div className="flex justify-between font-medium"><span>Net Income</span><span>{fmtCurrency(pnl.net, ccy)}</span></div>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h4 className="font-semibold mb-2">Balance Sheet</h4>
              <div className="text-sm grid gap-1">
                <div className="flex justify-between"><span className="text-neutral-300">Cash</span><span>{fmtCurrency(balSheet.cash, ccy)}</span></div>
                <div className="flex justify-between"><span className="text-neutral-300">Accounts Receivable</span><span>{fmtCurrency(balSheet.ar, ccy)}</span></div>
                <div className="flex justify-between"><span className="text-neutral-300">Accounts Payable</span><span>{fmtCurrency(balSheet.ap, ccy)}</span></div>
                <div className="flex justify-between font-medium"><span>Equity</span><span>{fmtCurrency(balSheet.equity, ccy)}</span></div>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h4 className="font-semibold mb-2">Cash Flow Statement</h4>
              <div className="text-sm grid gap-1">
                <div className="flex justify-between"><span className="text-neutral-300">Cash from Operations</span><span>{fmtCurrency(cfStatement.ops, ccy)}</span></div>
                <div className="flex justify-between"><span className="text-neutral-300">Investing</span><span>{fmtCurrency(cfStatement.investing, ccy)}</span></div>
                <div className="flex justify-between"><span className="text-neutral-300">Financing</span><span>{fmtCurrency(cfStatement.financing, ccy)}</span></div>
                <div className="flex justify-between font-medium"><span>Net Change</span><span>{fmtCurrency(cfStatement.netChange, ccy)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'tax' && (
        <div>
          <SectionHeader icon={Calendar} title="Tax Calculator & Compliance" subtitle="Estimate corporate tax and track compliance tasks" />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm grid gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-300">Corporate tax rate</span>
                  <input value={taxRate} onChange={(e)=>setTaxRate(Number(e.target.value))} type="number" step="0.01" className="bg-white/10 border border-white/10 rounded px-2 py-1 w-24" />
                </div>
                <div className="text-neutral-300">Estimated tax on current net income: <span className="text-white font-medium">{fmtCurrency(estTax, ccy)}</span></div>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm grid gap-2">
                {[
                  { key: 'filings', label: 'Annual filings prepared' },
                  { key: 'payroll', label: 'Payroll taxes up to date' },
                  { key: 'salesTax', label: 'Sales tax registered/remitted' },
                  { key: 'corpTax', label: 'Corporate tax prepared' },
                ].map(item => (
                  <label key={item.key} className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={!!compliance[item.key]} onChange={(e)=>setCompliance({...compliance, [item.key]: e.target.checked})} />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'apar' && (
        <div>
          <SectionHeader icon={Globe} title="Accounts Payable / Receivable" subtitle="Manage vendor bills and customer receivables" />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h4 className="font-semibold mb-2">Payables</h4>
              <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                <input value={apDraft.vendor} onChange={(e)=>setApDraft({...apDraft,vendor:e.target.value})} placeholder="Vendor" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                <input value={apDraft.amount} onChange={(e)=>setApDraft({...apDraft,amount:e.target.value})} placeholder="Amount" type="number" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                <input value={apDraft.due} onChange={(e)=>setApDraft({...apDraft,due:e.target.value})} type="date" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
              </div>
              <button onClick={()=>{ if(!apDraft.vendor) return; setPayables([...payables, { id: uid(), ...apDraft, amount: Number(apDraft.amount||0) }]); setApDraft({ vendor:'', amount:'', due:''}); }} className="mb-3 inline-flex items-center gap-2 rounded-lg bg-white text-black px-3 py-2 text-sm font-medium hover:bg-neutral-200"><Plus className="w-4 h-4" /> Add</button>
              <div className="text-sm grid gap-1">
                {payables.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-1 border-b border-white/10">
                    <span className="text-neutral-300">{p.vendor} · Due {p.due}</span>
                    <span>{fmtCurrency(p.amount, ccy)}</span>
                  </div>
                ))}
                {payables.length === 0 && <div className="text-neutral-400">No payables.</div>}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h4 className="font-semibold mb-2">Receivables</h4>
              <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                <input value={arDraft.client} onChange={(e)=>setArDraft({...arDraft,client:e.target.value})} placeholder="Client" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                <input value={arDraft.amount} onChange={(e)=>setArDraft({...arDraft,amount:e.target.value})} placeholder="Amount" type="number" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                <input value={arDraft.due} onChange={(e)=>setArDraft({...arDraft,due:e.target.value})} type="date" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
              </div>
              <button onClick={()=>{ if(!arDraft.client) return; setReceivables([...receivables, { id: uid(), ...arDraft, amount: Number(arDraft.amount||0) }]); setArDraft({ client:'', amount:'', due:''}); }} className="mb-3 inline-flex items-center gap-2 rounded-lg bg-white text-black px-3 py-2 text-sm font-medium hover:bg-neutral-200"><Plus className="w-4 h-4" /> Add</button>
              <div className="text-sm grid gap-1">
                {receivables.map(r => (
                  <div key={r.id} className="flex items-center justify-between py-1 border-b border-white/10">
                    <span className="text-neutral-300">{r.client} · Due {r.due}</span>
                    <span>{fmtCurrency(r.amount, ccy)}</span>
                  </div>
                ))}
                {receivables.length === 0 && <div className="text-neutral-400">No receivables.</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'goals' && (
        <div>
          <SectionHeader icon={TargetIcon} title="Financial Goals & Milestones" subtitle="Set targets and track progress" />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="grid gap-2 text-sm">
                <input value={goalDraft.name} onChange={(e)=>setGoalDraft({...goalDraft,name:e.target.value})} placeholder="Goal name" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={goalDraft.target} onChange={(e)=>setGoalDraft({...goalDraft,target:e.target.value})} placeholder="Target Amount" type="number" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                  <input value={goalDraft.due} onChange={(e)=>setGoalDraft({...goalDraft,due:e.target.value})} type="date" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                </div>
                <input value={goalDraft.progress} onChange={(e)=>setGoalDraft({...goalDraft,progress:Number(e.target.value)})} type="range" min="0" max="100" className="w-full" />
                <button onClick={()=>{ if(!goalDraft.name) return; setGoals([...goals, { id: uid(), ...goalDraft, target: Number(goalDraft.target||0) }]); setGoalDraft({ name:'', target:'', due:'', progress:0}); }} className="mt-1 inline-flex items-center gap-2 rounded-lg bg-white text-black px-3 py-2 text-sm font-medium hover:bg-neutral-200"><Plus className="w-4 h-4" /> Add Goal</button>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="grid gap-2">
                {goals.map(g => (
                  <div key={g.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{g.name}</div>
                      <div className="text-sm text-neutral-300">Target: {fmtCurrency(g.target, ccy)}</div>
                    </div>
                    <div className="text-xs text-neutral-400">Due {g.due || '—'}</div>
                    <div className="mt-2 h-2 bg-white/10 rounded">
                      <div className="h-2 bg-white rounded" style={{ width: `${g.progress}%` }} />
                    </div>
                  </div>
                ))}
                {goals.length === 0 && <div className="text-neutral-400 text-sm">No goals created.</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'payroll' && (
        <div>
          <SectionHeader icon={Users} title="Payroll Management" subtitle="Track employees and recurring payroll" />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="grid gap-2 text-sm">
                <input value={empDraft.name} onChange={(e)=>setEmpDraft({...empDraft,name:e.target.value})} placeholder="Employee name" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={empDraft.salary} onChange={(e)=>setEmpDraft({...empDraft,salary:e.target.value})} placeholder="Annual Salary" type="number" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                  <select value={empDraft.payCycle} onChange={(e)=>setEmpDraft({...empDraft,payCycle:e.target.value})} className="bg-white/10 border border-white/10 rounded px-2 py-1">
                    <option>Monthly</option>
                    <option>Bi-Weekly</option>
                    <option>Weekly</option>
                  </select>
                </div>
                <button onClick={()=>{ if(!empDraft.name) return; setEmployees([...employees, { id: uid(), name: empDraft.name, salary: Number(empDraft.salary||0), payCycle: empDraft.payCycle }]); setEmpDraft({ name:'', salary:'', payCycle:'Monthly'}); }} className="mt-1 inline-flex items-center gap-2 rounded-lg bg-white text-black px-3 py-2 text-sm font-medium hover:bg-neutral-200"><Plus className="w-4 h-4" /> Add Employee</button>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <table className="w-full text-sm">
                <thead className="text-neutral-300">
                  <tr>
                    <th className="text-left font-medium pb-2">Name</th>
                    <th className="text-left font-medium pb-2">Salary</th>
                    <th className="text-left font-medium pb-2">Cycle</th>
                    <th className="text-left font-medium pb-2">Paycheck</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => {
                    const perYear = emp.salary;
                    const divisor = emp.payCycle === 'Monthly' ? 12 : emp.payCycle === 'Bi-Weekly' ? 26 : 52;
                    const paycheck = perYear / divisor;
                    return (
                      <tr key={emp.id} className="border-t border-white/10">
                        <td className="py-2">{emp.name}</td>
                        <td className="py-2">{fmtCurrency(perYear, ccy)}</td>
                        <td className="py-2">{emp.payCycle}</td>
                        <td className="py-2">{fmtCurrency(paycheck, ccy)}</td>
                      </tr>
                    );
                  })}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-neutral-400">No employees added.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'assets' && (
        <div>
          <SectionHeader icon={Briefcase} title="Asset Management & Depreciation" subtitle="Track fixed assets and straight-line depreciation" />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="grid gap-2 text-sm">
                <input value={assetDraft.name} onChange={(e)=>setAssetDraft({...assetDraft,name:e.target.value})} placeholder="Asset name" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={assetDraft.cost} onChange={(e)=>setAssetDraft({...assetDraft,cost:e.target.value})} placeholder="Cost" type="number" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                  <input value={assetDraft.lifeYears} onChange={(e)=>setAssetDraft({...assetDraft,lifeYears:e.target.value})} placeholder="Life (years)" type="number" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                </div>
                <input value={assetDraft.start} onChange={(e)=>setAssetDraft({...assetDraft,start:e.target.value})} type="date" className="bg-white/10 border border-white/10 rounded px-2 py-1" />
                <button onClick={()=>{ if(!assetDraft.name) return; setAssets([...assets, { id: uid(), name: assetDraft.name, cost: Number(assetDraft.cost||0), lifeYears: Number(assetDraft.lifeYears||1), start: assetDraft.start }]); setAssetDraft({ name:'', cost:'', lifeYears:'3', start:''}); }} className="mt-1 inline-flex items-center gap-2 rounded-lg bg-white text-black px-3 py-2 text-sm font-medium hover:bg-neutral-200"><Plus className="w-4 h-4" /> Add Asset</button>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <table className="w-full text-sm">
                <thead className="text-neutral-300">
                  <tr>
                    <th className="text-left font-medium pb-2">Asset</th>
                    <th className="text-left font-medium pb-2">Cost</th>
                    <th className="text-left font-medium pb-2">Life</th>
                    <th className="text-left font-medium pb-2">Annual Deprec.</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map(a => (
                    <tr key={a.id} className="border-t border-white/10">
                      <td className="py-2">{a.name}</td>
                      <td className="py-2">{fmtCurrency(a.cost, ccy)}</td>
                      <td className="py-2">{a.lifeYears}y</td>
                      <td className="py-2">{fmtCurrency(depreciationPerYear(a), ccy)}</td>
                    </tr>
                  ))}
                  {assets.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-neutral-400">No assets added.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div>
          <SectionHeader icon={Globe} title="Multi-currency & Preferences" subtitle="Select your default currency and view current rates (static demo)" />
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
            <div className="mb-2 text-neutral-300">Exchange rates (base USD):</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(fxRates).map(([k,v]) => (
                <div key={k} className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 flex items-center justify-between">
                  <span>{k}</span>
                  <span className="text-neutral-300">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-neutral-400">Note: Rates are static for demo purposes. Integrate a live FX API for production.</div>
          </div>
        </div>
      )}
    </div>
  );
}

function TargetIcon(props){return (<svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${props.className||''}`}><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>);} 
