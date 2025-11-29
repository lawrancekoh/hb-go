import { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { xhbParser } from '../services/xhbParser';

function Settings() {
  const [settings, setSettings] = useState({ defaultTag: '' });
  const [cache, setCache] = useState({ categories: [], payees: [] });
  const [importStatus, setImportStatus] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
        setSettings(await storageService.getSettings());
        setCache(await storageService.getCache());
    };
    loadSettings();
  }, []);

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsedData = xhbParser.parse(event.target.result);
        await storageService.saveCache(parsedData);
        setCache(parsedData);
        setImportStatus(`Success! Loaded ${parsedData.categories.length} categories and ${parsedData.payees.length} payees.`);
      } catch (error) {
        console.error(error);
        setImportStatus('Error parsing file.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = async () => {
    if (confirm('Are you sure you want to delete all transactions and settings? This cannot be undone.')) {
      await storageService.clearAll();
      setSettings({ defaultTag: 'mobile-import' });
      setCache({ categories: [], payees: [] });
      setImportStatus('All data cleared.');
    }
  };

  const handleSettingChange = async (e) => {
    const { name, value } = e.target;
    const newSettings = { ...settings, [name]: value };
    setSettings(newSettings);
    await storageService.saveSettings(newSettings);
  };

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-gray-800">Settings</h2>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Data Management</h3>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Import HomeBank File (.xhb)</label>
            <p className="text-xs text-gray-500 mb-2">Import your .xhb file to sync categories and payees.</p>
            <input
              type="file"
              accept=".xhb"
              onChange={handleFileImport}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {importStatus && <p className="text-sm text-green-600 mt-2">{importStatus}</p>}
          </div>

          <div className="text-sm text-gray-600">
             <p>Categories: {cache.categories?.length || 0}</p>
             <p>Payees: {cache.payees?.length || 0}</p>
          </div>

          <hr className="my-2" />
          <button
            onClick={handleClearData}
            className="text-red-600 font-medium text-sm text-left hover:text-red-800"
          >
            Clear All Data
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Defaults</h3>
        <div className="flex flex-col gap-4">
           <div>
            <label className="block text-sm font-medium text-gray-700">Default Tag</label>
            <input
              type="text"
              name="defaultTag"
              value={settings.defaultTag || ''}
              onChange={handleSettingChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              placeholder="mobile-import"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
