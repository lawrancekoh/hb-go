import { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { xhbParser } from '../services/xhbParser';
import { Upload, Trash2, Database, Tag, Save, Scan } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';

function Settings() {
  const [settings, setSettings] = useState({ defaultTag: '', ocrProvider: 'auto' });
  const [cache, setCache] = useState({ categories: [], payees: [] });
  const [importStatus, setImportStatus] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
        const storedSettings = await storageService.getSettings();
        setSettings({
            ...storedSettings,
            ocrProvider: storedSettings.ocrProvider || 'auto'
        });
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
    <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-20">
      <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      </div>

      {/* Data Import Section */}
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-brand-600" />
                  Data Import
              </CardTitle>
              <CardDescription>
                  Import your HomeBank (.xhb) file to sync categories and payees.
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                  <Label>Select File</Label>
                  <Input
                    type="file"
                    accept=".xhb"
                    onChange={handleFileImport}
                    className="cursor-pointer file:text-brand-600 file:font-semibold"
                  />
                  {importStatus && (
                      <p className={`text-sm ${importStatus.includes('Error') ? 'text-red-600' : 'text-emerald-600'}`}>
                          {importStatus}
                      </p>
                  )}
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div className="text-center">
                      <p className="text-2xl font-bold text-slate-700">{cache.categories?.length || 0}</p>
                      <p className="text-xs text-slate-500 uppercase font-medium">Categories</p>
                  </div>
                  <div className="text-center">
                      <p className="text-2xl font-bold text-slate-700">{cache.payees?.length || 0}</p>
                      <p className="text-xs text-slate-500 uppercase font-medium">Payees</p>
                  </div>
              </div>
          </CardContent>
      </Card>

      {/* Scanner Settings */}
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Scan className="h-5 w-5 text-brand-600" />
                  Scanner Settings
              </CardTitle>
              <CardDescription>
                  Choose how receipts are processed.
              </CardDescription>
          </CardHeader>
          <CardContent>
               <div className="space-y-3">
                  <Label>OCR Engine</Label>
                  <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                          <input
                              type="radio"
                              name="ocrProvider"
                              value="auto"
                              checked={settings.ocrProvider === 'auto'}
                              onChange={handleSettingChange}
                              className="text-brand-600 focus:ring-brand-500"
                          />
                          <div>
                              <span className="font-medium text-slate-900 block">Auto (Recommended)</span>
                              <span className="text-xs text-slate-500">Use System OCR if available, otherwise PaddleOCR.</span>
                          </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                          <input
                              type="radio"
                              name="ocrProvider"
                              value="system"
                              checked={settings.ocrProvider === 'system'}
                              onChange={handleSettingChange}
                              className="text-brand-600 focus:ring-brand-500"
                          />
                          <div>
                              <span className="font-medium text-slate-900 block">System Only</span>
                              <span className="text-xs text-slate-500">Use device's native text detection. Fast but may vary by device.</span>
                          </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                          <input
                              type="radio"
                              name="ocrProvider"
                              value="paddle"
                              checked={settings.ocrProvider === 'paddle'}
                              onChange={handleSettingChange}
                              className="text-brand-600 focus:ring-brand-500"
                          />
                          <div>
                              <span className="font-medium text-slate-900 block">PaddleOCR (Local)</span>
                              <span className="text-xs text-slate-500">Use built-in PaddleOCR engine. Fast and accurate.</span>
                          </div>
                      </label>
                  </div>
               </div>
          </CardContent>
      </Card>

      {/* Defaults Section */}
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-brand-600" />
                  Defaults
              </CardTitle>
              <CardDescription>
                  Configure default values for new transactions.
              </CardDescription>
          </CardHeader>
          <CardContent>
               <div className="space-y-2">
                  <Label>Default Tag</Label>
                  <Input
                      type="text"
                      name="defaultTag"
                      value={settings.defaultTag || ''}
                      onChange={handleSettingChange}
                      placeholder="e.g. mobile-import"
                  />
                  <p className="text-xs text-slate-500">This tag will be automatically added to every new transaction.</p>
               </div>
          </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-100">
          <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Danger Zone
              </CardTitle>
          </CardHeader>
          <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                  This action will permanently delete all local transactions, settings, and cached data.
              </p>
              <Button variant="destructive" onClick={handleClearData} className="w-full sm:w-auto">
                  Clear All Data
              </Button>
          </CardContent>
      </Card>

    </div>
  );
}

export default Settings;
