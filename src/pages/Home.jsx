import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { csvService } from '../services/csv';

function Home() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    const txs = await storageService.getTransactions();
    // Sort by date desc
    txs.sort((a, b) => new Date(b.date) - new Date(a.date));
    setTransactions(txs);
  };

  const handleDelete = async (id) => {
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
    csvService.downloadCSV(csv, filename);

    if (confirm('Export successful! Clear exported transactions?')) {
        await storageService.clearTransactions();
        loadTransactions();
    }
  };

  const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Inbox</h2>
        <Link
          to="/editor/new"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full shadow-lg flex items-center gap-2"
        >
          <span>📸</span> Capture
        </Link>
      </div>

      {transactions.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
            <div>
                <span className="text-gray-500 text-sm">Total Pending</span>
                <p className="text-2xl font-bold text-gray-800">{totalAmount.toFixed(2)}</p>
            </div>
            <button
                onClick={handleExport}
                className="text-blue-600 font-semibold hover:bg-blue-50 px-4 py-2 rounded"
            >
                Export CSV
            </button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {transactions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            <p>No pending transactions.</p>
            <p className="text-sm mt-2">Tap "Capture" to add a receipt.</p>
          </div>
        ) : (
          transactions.map(t => (
            <div key={t.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-start">
              <Link to={`/editor/${t.id}`} className="flex-grow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-800">{t.payee || 'Unknown Payee'}</h3>
                    <p className="text-xs text-gray-500">{t.date} • {t.time}</p>
                    {t.category && <span className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 inline-block">{t.category}</span>}
                  </div>
                  <p className="font-bold text-lg">{parseFloat(t.amount).toFixed(2)}</p>
                </div>
              </Link>
              <button
                onClick={() => handleDelete(t.id)}
                className="ml-4 text-gray-400 hover:text-red-500 p-2"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Home;
