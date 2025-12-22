import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storageService } from '../services/storage';
import { xhbParser } from '../services/xhbParser';
import { llmService } from '../services/llm';
import { Upload, Trash2, Database, Tag, Save, Scan, Sparkles, CheckCircle2, AlertCircle, Calendar, Coffee, Github, Cpu, Cloud, Download, Activity, Key } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';

function Settings() {
  const [settings, setSettings] = useState({
      defaultTag: '',
      ocrProvider: 'auto',
      theme: localStorage.getItem('hb_theme') || 'system',
      defaultCategory: localStorage.getItem('hb_default_category') || '',
      dateFormat: localStorage.getItem('hb_date_format') || 'DD/MM/YYYY',
      ai_preference: 'local',
      local_model_choice: 'onnx-community/PaliGemma-3b-ft-en-receipts-onnx',
      auto_fallback: true,
      hf_token: ''
  });
  const [cache, setCache] = useState({ categories: [], payees: [] });
  const [tagCount, setTagCount] = useState(0);
  const [importStatus, setImportStatus] = useState('');
  const [lastSync, setLastSync] = useState(localStorage.getItem('hb_last_sync'));
  const [fileDate, setFileDate] = useState(localStorage.getItem('hb_file_date'));
  const [hasWebGPU, setHasWebGPU] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ status: 'idle', progress: 0, message: '' });

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
    // Check WebGPU support
    if (navigator.gpu) {
        setHasWebGPU(true);
    }

    const loadSettings = async () => {
        const storedSettings = await storageService.getSettings();
        setSettings({
            ...storedSettings,
            ocrProvider: storedSettings.ocrProvider || 'auto'
        });
        setCache(await storageService.getCache());

        // Read hb_tags from localStorage
        const tags = JSON.parse(localStorage.getItem('hb_tags') || '[]');
        setTagCount(tags.length);

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

    // Save Sync Info
    localStorage.setItem('hb_file_date', file.lastModified);
    const now = new Date().toISOString();
    localStorage.setItem('hb_last_sync', now);
    setFileDate(file.lastModified);
    setLastSync(now);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsedData = xhbParser.parse(event.target.result);
        await storageService.saveCache(parsedData);
        setCache(parsedData);
        setTagCount(parsedData.tags ? parsedData.tags.length : 0);
        setImportStatus(`Success! Loaded ${parsedData.categories.length} categories, ${parsedData.payees.length} payees, and ${parsedData.tags?.length || 0} tags.`);
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
      localStorage.removeItem('hb_last_sync');
      localStorage.removeItem('hb_file_date');
      setLastSync(null);
      setFileDate(null);
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
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    // Special handling for Theme
    if (name === 'theme') {
        localStorage.setItem('hb_theme', newValue);
        window.dispatchEvent(new Event('hb_theme_changed'));
    }
    // Special handling for Default Category
    else if (name === 'defaultCategory') {
        localStorage.setItem('hb_default_category', newValue);
    }
    // Special handling for Date Format
    else if (name === 'dateFormat') {
        localStorage.setItem('hb_date_format', newValue);
    }
    // Standard Settings
    else {
        await storageService.saveSettings({ ...settings, [name]: newValue });
    }

    setSettings(prev => ({ ...prev, [name]: newValue }));
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

  const handleDownloadModel = async () => {
      setDownloadProgress({ status: 'downloading', progress: 0, message: 'Starting download...' });
      try {
          await llmService.loadLocalModel(
              settings.local_model_choice,
              settings.hf_token,
              (progress) => {
                  if (progress.status === 'progress') {
                      setDownloadProgress({
                          status: 'downloading',
                          progress: progress.progress || 0, // transformers.js sends 0-100 or check docs
                          message: `Downloading ${progress.file} ...`
                      });
                  } else if (progress.status === 'ready') {
                       // Model ready
                  }
              }
          );
          setDownloadProgress({ status: 'ready', progress: 100, message: 'Model downloaded & ready!' });
      } catch (error) {
          console.error(error);
          setDownloadProgress({ status: 'error', progress: 0, message: `Error: ${error.message}` });
      }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-20">
      <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
      </div>

      {/* Intelligence Section */}
      <Card className="border-indigo-100 bg-indigo-50/30 dark:bg-indigo-950/20 dark:border-indigo-900">
          <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300">
                  <Cpu className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Intelligence (Hybrid AI)
              </CardTitle>
              <CardDescription className="dark:text-indigo-200/70">
                  Choose how your receipts are scanned. Local AI is private and free.
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

              {/* Preference Selection */}
              <div className="space-y-3">
                  <Label className="dark:text-slate-200">Preferred Processing Mode</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                          onClick={() => handleSettingChange({ target: { name: 'ai_preference', value: 'local' } })}
                          className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                              settings.ai_preference === 'local'
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                      >
                          <Cpu className="h-6 w-6 mb-2" />
                          <span className="text-sm font-semibold">Local AI</span>
                          <span className="text-xs text-center mt-1 opacity-80">Privacy-First</span>
                      </button>

                      <button
                          onClick={() => handleSettingChange({ target: { name: 'ai_preference', value: 'cloud' } })}
                          className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                              settings.ai_preference === 'cloud'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                      >
                          <Cloud className="h-6 w-6 mb-2" />
                          <span className="text-sm font-semibold">Cloud AI</span>
                          <span className="text-xs text-center mt-1 opacity-80">Highest Accuracy</span>
                      </button>

                      <button
                          onClick={() => handleSettingChange({ target: { name: 'ai_preference', value: 'none' } })}
                          className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                              settings.ai_preference === 'none'
                              ? 'border-slate-500 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                      >
                          <Scan className="h-6 w-6 mb-2" />
                          <span className="text-sm font-semibold">No AI</span>
                          <span className="text-xs text-center mt-1 opacity-80">Manual Entry</span>
                      </button>
                  </div>
              </div>

              {/* Local AI Config */}
              {settings.ai_preference === 'local' && (
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-700 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                           {hasWebGPU ? (
                               <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold bg-emerald-50 px-2 py-1 rounded dark:bg-emerald-900/30 dark:text-emerald-400">
                                   <CheckCircle2 className="h-3 w-3" /> WebGPU Ready
                               </span>
                           ) : (
                               <span className="flex items-center gap-1 text-red-600 text-xs font-semibold bg-red-50 px-2 py-1 rounded dark:bg-red-900/30 dark:text-red-400">
                                   <AlertCircle className="h-3 w-3" /> WebGPU Not Supported
                               </span>
                           )}
                      </div>

                      {hasWebGPU ? (
                          <>
                            <div className="space-y-2">
                                <Label className="dark:text-slate-200">Local Model</Label>
                                <select
                                    name="local_model_choice"
                                    value={settings.local_model_choice}
                                    onChange={handleSettingChange}
                                    className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                                >
                                    <option value="onnx-community/PaliGemma-3b-ft-en-receipts-onnx">PaliGemma 3B (Receipts Tuned) - Default</option>
                                    <option value="onnx-community/gemma-3-4b-it">Gemma 3 (4B)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label className="dark:text-slate-200 flex items-center gap-2">
                                    <Key className="h-4 w-4" />
                                    Hugging Face Access Token
                                </Label>
                                <Input
                                    type="password"
                                    name="hf_token"
                                    value={settings.hf_token || ''}
                                    onChange={handleSettingChange}
                                    placeholder="hf_..."
                                    className="dark:text-slate-100"
                                />
                                <div className="flex justify-between items-start">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Required for Gemma 3 / PaliGemma models. You must also <a href="https://huggingface.co/google/gemma-3-4b-it" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">accept the model license</a> on Hugging Face.
                                    </p>
                                    <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline flex-shrink-0 ml-2 dark:text-indigo-400">
                                        Get Token
                                    </a>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <Button
                                    onClick={handleDownloadModel}
                                    disabled={downloadProgress.status === 'downloading' || downloadProgress.status === 'ready'}
                                    className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    {downloadProgress.status === 'downloading' ? (
                                        <>
                                            <Activity className="h-4 w-4 animate-spin" />
                                            Downloading...
                                        </>
                                    ) : downloadProgress.status === 'ready' ? (
                                        <>
                                            <CheckCircle2 className="h-4 w-4" /> Model Ready
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4" /> Download & Activate Model
                                        </>
                                    )}
                                </Button>
                                {downloadProgress.message && (
                                    <p className="text-xs text-slate-500 text-center">{downloadProgress.message}</p>
                                )}
                                {downloadProgress.status === 'downloading' && (
                                    <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700">
                                        <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${downloadProgress.progress}%` }}></div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    name="auto_fallback"
                                    id="auto_fallback"
                                    checked={settings.auto_fallback}
                                    onChange={handleSettingChange}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <Label htmlFor="auto_fallback" className="text-sm dark:text-slate-300">
                                    Auto-fallback to Cloud AI if Local fails
                                </Label>
                            </div>
                          </>
                      ) : (
                          <p className="text-sm text-red-600 dark:text-red-400">
                              Your device/browser does not support WebGPU. Local AI is unavailable. Please use Cloud AI.
                          </p>
                      )}
                  </div>
              )}

              {/* Cloud AI Config (Visible if Cloud Preferred OR Fallback Enabled) */}
              {(settings.ai_preference === 'cloud' || (settings.ai_preference === 'local' && settings.auto_fallback)) && (
                  <div className={`space-y-4 pt-4 border-t border-dashed ${settings.ai_preference === 'local' ? 'border-slate-200 dark:border-slate-700' : 'border-transparent'}`}>
                      {settings.ai_preference === 'local' && (
                          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                              <Cloud className="h-4 w-4" /> Cloud Fallback Configuration
                          </div>
                      )}

                      <div className="space-y-2">
                          <Label className="dark:text-slate-200">Provider</Label>
                          <select
                              name="provider"
                              value={aiConfig.provider}
                              onChange={handleAiConfigChange}
                              className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                          >
                              <option value="openai">OpenAI</option>
                              <option value="gemini">Google Gemini</option>
                              <option value="custom">Custom (OpenAI Compatible)</option>
                          </select>
                      </div>

                      {aiConfig.provider === 'custom' && (
                          <div className="space-y-2">
                              <Label className="dark:text-slate-200">Base URL</Label>
                              <Input
                                  type="text"
                                  name="baseUrl"
                                  value={aiConfig.baseUrl}
                                  onChange={handleAiConfigChange}
                                  placeholder="https://api.example.com/v1"
                                  className="dark:text-slate-100"
                              />
                          </div>
                      )}

                      <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="dark:text-slate-200">API Key</Label>
                            <Link to="/help" className="text-xs text-blue-500 hover:underline cursor-pointer">
                                Guide: Get a Key
                            </Link>
                          </div>
                          <div className="flex gap-2">
                              <Input
                                  type="password"
                                  name="apiKey"
                                  value={aiConfig.apiKey}
                                  onChange={handleAiConfigChange}
                                  placeholder="sk-..."
                                  className="flex-1 dark:text-slate-100"
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
                                  aiStatus.type === 'error' ? 'text-red-600 dark:text-red-400' :
                                  aiStatus.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
                              }`}>
                                  {aiStatus.type === 'error' && <AlertCircle className="h-4 w-4" />}
                                  {aiStatus.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
                                  {aiStatus.message}
                              </div>
                          )}
                      </div>

                      {aiConfig.models.length > 0 && (
                          <div className="space-y-2">
                              <Label className="dark:text-slate-200">Model</Label>
                              <select
                                  name="model"
                                  value={aiConfig.model}
                                  onChange={handleAiConfigChange}
                                  className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                              >
                                  {aiConfig.models.map(m => (
                                      <option key={m} value={m}>{m}</option>
                                  ))}
                              </select>
                              {/* Model Help Text */}
                              {aiConfig.provider !== 'custom' && (
                                <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm space-y-1 border border-blue-100 mt-2 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-900">
                                    <p>⚠️ <strong>Requirement:</strong> You must choose a <strong>Vision (Multi-modal)</strong> model to scan images.</p>
                                    <p>✅ <strong>Recommended:</strong> <code>gemini-1.5-flash</code>, <code>gpt-4o-mini</code>.</p>
                                </div>
                              )}
                          </div>
                      )}

                      <Button onClick={saveAiConfig} className="w-full gap-2 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600">
                          <Save className="h-4 w-4" /> Save Cloud Config
                      </Button>
                  </div>
              )}
          </CardContent>
      </Card>

      {/* Data Import Section */}
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                  <Database className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  Data Import
              </CardTitle>
              <CardDescription className="dark:text-slate-400">
                  Import your HomeBank (.xhb) file to sync categories and payees.
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                  <Label className="dark:text-slate-200">Select File</Label>
                  <Input
                    type="file"
                    accept=".xhb"
                    onChange={handleFileImport}
                    className="cursor-pointer file:text-brand-600 file:font-semibold dark:text-slate-100 dark:file:text-brand-400"
                  />
                  {importStatus && (
                      <p className={`text-sm ${importStatus.includes('Error') ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {importStatus}
                      </p>
                  )}
              </div>

              <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                  <div className="text-center">
                      <p className="text-2xl font-bold text-slate-700 dark:text-slate-100">{cache.categories?.length || 0}</p>
                      <p className="text-xs text-slate-500 uppercase font-medium dark:text-slate-400">Categories</p>
                  </div>
                  <div className="text-center">
                      <p className="text-2xl font-bold text-slate-700 dark:text-slate-100">{cache.payees?.length || 0}</p>
                      <p className="text-xs text-slate-500 uppercase font-medium dark:text-slate-400">Payees</p>
                  </div>
                  {/* Tags Stat */}
                  <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-500 dark:text-emerald-400">
                          {tagCount}
                      </p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                          Tags
                      </p>
                  </div>
              </div>

              {(lastSync || fileDate) && (
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Synced:</span>
                    <span className="font-mono">{lastSync ? new Date(lastSync).toLocaleString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>File Date:</span>
                    <span className="font-mono">{fileDate ? new Date(parseInt(fileDate)).toLocaleString() : 'N/A'}</span>
                    </div>
                </div>
              )}
          </CardContent>
      </Card>

      {/* Defaults Section */}
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                  <Tag className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  App & Defaults
              </CardTitle>
              <CardDescription className="dark:text-slate-400">
                  Configure appearance and default values.
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
               {/* Theme Selector */}
               <div className="space-y-2">
                   <Label className="dark:text-slate-200">App Theme</Label>
                   <select
                      name="theme"
                      value={settings.theme}
                      onChange={handleSettingChange}
                      className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                   >
                      <option value="system">System Default</option>
                      <option value="light">Light Mode</option>
                      <option value="dark">Dark Mode</option>
                   </select>
               </div>

               {/* Default Category */}
               <div className="space-y-2">
                   <Label className="dark:text-slate-200">Default Category</Label>
                   <div className="relative">
                        <Input
                            type="text"
                            name="defaultCategory"
                            value={settings.defaultCategory}
                            onChange={handleSettingChange}
                            list="settings-category-list"
                            placeholder="Select default category"
                            className="dark:text-slate-100"
                        />
                        <datalist id="settings-category-list">
                            {cache.categories && cache.categories.map(cat => (
                                <option key={cat} value={cat} />
                            ))}
                        </datalist>
                   </div>
                   <p className="text-xs text-slate-500 dark:text-slate-400">Used for new transactions and as a fallback for AI scans.</p>
               </div>

               <div className="space-y-2">
                  <Label className="dark:text-slate-200">Default Tag</Label>
                  <Input
                      type="text"
                      name="defaultTag"
                      value={settings.defaultTag || ''}
                      onChange={handleSettingChange}
                      placeholder="e.g. mobile-import"
                      className="dark:text-slate-100"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">This tag will be automatically added to every new transaction.</p>
               </div>

               <div className="space-y-2">
                  <Label className="flex items-center gap-2 dark:text-slate-200">
                      <Calendar className="h-4 w-4" />
                      Receipt Date Format
                  </Label>
                  <select
                      name="dateFormat"
                      value={settings.dateFormat}
                      onChange={handleSettingChange}
                      className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                  >
                      <option value="DD/MM/YYYY">DD/MM/YYYY (International/UK/SG)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                  </select>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Helps AI correctly interpret ambiguous dates (e.g. 10/01).</p>
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

      {/* About Footer */}
      <footer className="mt-12 py-8 text-center space-y-4 border-t border-gray-100 dark:border-gray-800">
        {/* Brand & Version */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">HB Go</h3>
          <p className="text-xs text-gray-500">v{__APP_VERSION__} • Offline PWA</p>
        </div>

        <div className="text-xs text-gray-500">
           Unofficial companion to <a href="http://homebank.free.fr/" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">HomeBank</a>.
        </div>

        {/* Developer Credits */}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>Built with 🤖 & ❤️ by <span className="font-semibold text-gray-900 dark:text-white">Lawrance Koh</span>.</p>
          <p className="italic">"A HomeBank user since March 2025."</p>
        </div>

        {/* Action Links */}
        <div className="flex justify-center gap-4 text-sm font-medium pt-2">
          <a href="https://www.linkedin.com/in/lawrancekoh" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
            LinkedIn
          </a>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <a href="https://paypal.me/lawrancekoh" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-amber-500 hover:underline">
            <Coffee className="h-3 w-3" />
            Support
          </a>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <a href="https://github.com/lawrancekoh/hb-go" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:underline">
            <Github className="h-3 w-3" />
            Source
          </a>
        </div>
      </footer>

    </div>
  );
}

export default Settings;
