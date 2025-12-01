import { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { xhbParser } from '../services/xhbParser';
import { llmService } from '../services/llm';
import { Upload, Trash2, Database, Tag, Save, Scan, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';

function Settings() {
  const [settings, setSettings] = useState({ defaultTag: '', ocrProvider: 'auto' });
  const [cache, setCache] = useState({ categories: [], payees: [] });
  const [importStatus, setImportStatus] = useState('');

  // AI Config State
  const [aiConfig, setAiConfig] = useState({
      provider: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      model: '',
      models: []
  });
  const [aiStatus, setAiStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    const loadSettings = async () => {
        const storedSettings = await storageService.getSettings();
        setSettings({
            ...storedSettings,
            ocrProvider: storedSettings.ocrProvider || 'auto'
        });
        setCache(await storageService.getCache());

        // Load AI Config from localStorage
        const storedAiConfig = localStorage.getItem('hb_ai_config');
        if (storedAiConfig) {
            setAiConfig(JSON.parse(storedAiConfig));
        }
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
      localStorage.removeItem('hb_ai_config');
      setAiConfig({
          provider: 'openai',
          baseUrl: 'https://api.openai.com/v1',
          apiKey: '',
          model: '',
          models: []
      });
    }
  };

  const handleSettingChange = async (e) => {
    const { name, value } = e.target;
    const newSettings = { ...settings, [name]: value };
    setSettings(newSettings);
    await storageService.saveSettings(newSettings);
  };

  // AI Configuration Handlers
  const handleAiConfigChange = (e) => {
      const { name, value } = e.target;
      setAiConfig(prev => ({
          ...prev,
          [name]: value,
          // Reset base URL if switching to Gemini, or set default for OpenAI
          baseUrl: name === 'provider' && value === 'openai' ? 'https://api.openai.com/v1' :
                   name === 'provider' && value === 'gemini' ? '' :
                   name === 'provider' && value === 'custom' ? prev.baseUrl : prev.baseUrl
      }));
  };

  const verifyAiKey = async () => {
      setAiStatus({ type: 'loading', message: 'Verifying...' });
      try {
          const models = await llmService.verifyAndFetchModels(aiConfig.provider, aiConfig.apiKey, aiConfig.baseUrl);

          setAiConfig(prev => ({
              ...prev,
              models,
              model: models.length > 0 ? models[0] : ''
          }));
          setAiStatus({ type: 'success', message: 'Verified! Models loaded.' });
      } catch (err) {
          console.error(err);
          setAiStatus({ type: 'error', message: err.message });
      }
  };

  const saveAiConfig = () => {
      localStorage.setItem('hb_ai_config', JSON.stringify(aiConfig));
      setAiStatus({ type: 'success', message: 'Configuration saved!' });
      setTimeout(() => setAiStatus({ type: '', message: '' }), 3000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-20">
      <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      </div>

      {/* AI Configuration (Experimental) */}
      <Card className="border-indigo-100 bg-indigo-50/30">
          <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                  AI Configuration (Experimental)
              </CardTitle>
              <CardDescription>
                  Connect your own API key to use advanced AI for receipt scanning.
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="space-y-2">
                  <Label>Provider</Label>
                  <select
                      name="provider"
                      value={aiConfig.provider}
                      onChange={handleAiConfigChange}
                      className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                      <option value="openai">OpenAI</option>
                      <option value="gemini">Google Gemini</option>
                      <option value="custom">Custom (OpenAI Compatible)</option>
                  </select>
              </div>

              {aiConfig.provider === 'custom' && (
                  <div className="space-y-2">
                      <Label>Base URL</Label>
                      <Input
                          type="text"
                          name="baseUrl"
                          value={aiConfig.baseUrl}
                          onChange={handleAiConfigChange}
                          placeholder="https://api.example.com/v1"
                      />
                  </div>
              )}

              <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="flex gap-2">
                      <Input
                          type="password"
                          name="apiKey"
                          value={aiConfig.apiKey}
                          onChange={handleAiConfigChange}
                          placeholder="sk-..."
                          className="flex-1"
                      />
                      <Button
                          onClick={verifyAiKey}
                          disabled={!aiConfig.apiKey || aiStatus.type === 'loading'}
                          variant="outline"
                      >
                          {aiStatus.type === 'loading' ? 'Verifying...' : 'Verify Key'}
                      </Button>
                  </div>
                  {aiStatus.message && (
                      <div className={`flex items-center gap-2 text-sm mt-1 ${
                          aiStatus.type === 'error' ? 'text-red-600' :
                          aiStatus.type === 'success' ? 'text-emerald-600' : 'text-slate-600'
                      }`}>
                          {aiStatus.type === 'error' && <AlertCircle className="h-4 w-4" />}
                          {aiStatus.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
                          {aiStatus.message}
                      </div>
                  )}
              </div>

              {aiConfig.models.length > 0 && (
                  <div className="space-y-2">
                      <Label>Model</Label>
                      <select
                          name="model"
                          value={aiConfig.model}
                          onChange={handleAiConfigChange}
                          className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                          {aiConfig.models.map(m => (
                              <option key={m} value={m}>{m}</option>
                          ))}
                      </select>
                  </div>
              )}

              <Button onClick={saveAiConfig} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Save className="h-4 w-4" /> Save AI Configuration
              </Button>
          </CardContent>
      </Card>

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
                              <span className="text-xs text-slate-500">Use System OCR if available, with Tesseract as backup.</span>
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
