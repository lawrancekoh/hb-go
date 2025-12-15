import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storage';
import { csvService } from '../services/csv';
import { Camera, Trash2, Download, Tag, Plus, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

function Home() {
  const [transactions, setTransactions] = useState([]);
  const [isAiEnabled, setIsAiEnabled] = useState(false);
  const navigate = useNavigate();

  const loadTransactions = useCallback(async () => {
    const txs = await storageService.getTransactions();
    // Sort by date desc, then time desc
    txs.sort((a, b) => {
      const dateDiff = new Date(b.date) - new Date(a.date);
      if (dateDiff !== 0) return dateDiff;
      // If dates are equal, sort by time descending
      return (b.time || '').localeCompare(a.time || '');
    });
    setTransactions(txs);
  }, []);

  const checkAiConfig = useCallback(() => {
      const config = localStorage.getItem('hb_ai_config');
      if (config) {
          try {
            const parsed = JSON.parse(config);
            if (parsed.apiKey) setIsAiEnabled(true);
          } catch (e) {
            // ignore error
          }
      }
  }, []);

  useEffect(() => {
    const init = async () => {
        await loadTransactions();
        checkAiConfig();
    };
    init();
  }, [loadTransactions, checkAiConfig]);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation(); // Stop event bubbling to Card click
    if (confirm('Delete this transaction?')) {
      await storageService.deleteTransaction(id);
      loadTransactions();
    }
  };

  const handleExport = async () => {
    if (transactions.length === 0) {
      alert('No transactions to export.');
      return;
    }
    const csv = csvService.generateCSV(transactions);
    const filename = `hb-go-export-${new Date().toISOString().slice(0,10)}.csv`;

    // Attempt to share (mobile) or download (desktop)
    const success = await csvService.exportCSV(csv, filename);

    if (success) {
      if (confirm('Export successful! Clear exported transactions?')) {
          await storageService.clearTransactions();
          loadTransactions();
      }
    }
  };

  const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  return (
    <div className="flex flex-col gap-6 pb-20 relative min-h-[80vh]">

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white border-none shadow-lg dark:from-slate-800 dark:to-slate-950">
          <CardContent className="p-6 flex justify-between items-center">
              <div>
                  <p className="text-slate-300 text-sm font-medium">Total Pending</p>
                  <p className="text-4xl font-bold mt-1 text-emerald-400">${totalAmount.toFixed(2)}</p>
                  <p className="text-slate-400 text-xs mt-2">{transactions.length} transactions</p>
              </div>
              <div className="flex gap-2">
                <Button
                  href="/editor/new"
                  variant="secondary"
                  size="sm"
                  className="hidden md:inline-flex gap-2 bg-emerald-500 text-white hover:bg-emerald-600 border-0 dark:bg-emerald-600 dark:text-white"
                >
                  <Plus className="h-4 w-4" /> New Transaction
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExport}
                  disabled={transactions.length === 0}
                  className="gap-2 bg-white/10 hover:bg-white/20 text-white border-0"
                >
                    <Download className="h-4 w-4" /> Export
                </Button>
              </div>
          </CardContent>
      </Card>

      {/* Transaction List */}
      <div className="flex flex-col gap-3">
        {transactions.length === 0 ? (
          <Link
            to="/editor/new"
            className="block text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-800/80"
          >
            <div className="bg-white p-3 rounded-full w-fit mx-auto shadow-sm mb-4 group-hover:scale-110 transition-transform relative dark:bg-slate-700">
                <Camera className="h-8 w-8 text-brand-600 dark:text-brand-400" />
                {isAiEnabled && (
                    <div className="absolute -top-1 -right-1 bg-brand-600 text-white rounded-full p-1 border-2 border-white dark:border-slate-700">
                        <Sparkles className="h-3 w-3" />
                    </div>
                )}
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No transactions yet</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto dark:text-slate-400">
              {isAiEnabled ? "Tap here to start an AI receipt scan." : "Tap here or the button below to scan your first receipt."}
            </p>
          </Link>
        ) : (
          transactions.map(t => (
            <div key={t.id} onClick={() => navigate(`/editor/${t.id}`)} className="cursor-pointer group">
                <Card className="hover:shadow-md transition-shadow duration-200 border-l-4 border-l-transparent hover:border-l-brand-600 dark:hover:border-l-brand-400">
                    <CardContent className="p-4 flex justify-between items-center">
                        <div className="flex gap-4 items-center overflow-hidden">
                             {/* Category Icon / Placeholder */}
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                {t.image ? (
                                     <img src={t.image} className="h-full w-full object-cover rounded-full" alt="Receipt" />
                                ) : (
                                    <Tag className="h-5 w-5" />
                                )}
                            </div>

                            <div className="min-w-0">
                                <h3 className="font-semibold text-slate-900 truncate dark:text-slate-100">{t.payee || 'Unknown Payee'}</h3>
                                <p className="text-xs text-slate-500 truncate flex items-center gap-1 dark:text-slate-400">
                                    {t.date}
                                    {t.time && <span>• {t.time}</span>}
                                    {t.category && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 ml-1 dark:bg-slate-800 dark:text-slate-300">{t.category}</span>}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                            <span className="font-bold text-slate-900 text-lg dark:text-slate-100">
                                {parseFloat(t.amount).toFixed(2)}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 -mr-2 dark:text-slate-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                onClick={(e) => handleDelete(e, t.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40 md:hidden">
        <Button
            href="/editor/new"
            className="h-14 w-14 rounded-full shadow-xl bg-emerald-500 hover:bg-emerald-600 p-0 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            aria-label="New Transaction"
        >
            <Plus className="h-8 w-8 text-white" />
        </Button>
      </div>

    </div>
  );
}

export default Home;
