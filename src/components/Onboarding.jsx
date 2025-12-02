import { useState } from 'react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Label } from './ui/Label';
import { Input } from './ui/Input';
import { xhbParser } from '../services/xhbParser';
import { storageService } from '../services/storage';
import { Database, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [importStatus, setImportStatus] = useState('');

  const nextStep = () => setStep((s) => s + 1);

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsedData = xhbParser.parse(event.target.result);
        await storageService.saveCache(parsedData);
        setImportStatus(`Success! Loaded ${parsedData.categories.length} categories.`);
        setTimeout(nextStep, 1500); // Auto-advance on success
      } catch (error) {
        console.error(error);
        setImportStatus('Error parsing file.');
      }
    };
    reader.readAsText(file);
  };

  const handleFinish = () => {
    localStorage.setItem('hb_has_onboarded', 'true');
    onComplete();
  };

  if (step === 1) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <Card className="max-w-md w-full animate-in fade-in zoom-in duration-300">
            <CardHeader>
                <CardTitle className="text-2xl text-center">Welcome to HB Go</CardTitle>
                <CardDescription className="text-center text-lg mt-2">
                    Your offline, privacy-first receipt scanner.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-center my-6">
                    <img src="/pwa-192x192.png" alt="Logo" className="w-24 h-24 rounded-2xl shadow-lg" onError={(e) => e.target.style.display = 'none'} />
                </div>
                <Button onClick={nextStep} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                    Get Started
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <Card className="max-w-md w-full animate-in fade-in zoom-in duration-300">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <Database className="w-6 h-6 text-indigo-600" />
                    Categories Setup
                </CardTitle>
                <CardDescription>
                    We have pre-loaded standard categories for you. If you have a custom HomeBank file, you can sync it now.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-lg">
                    <Label className="font-semibold text-slate-700">Option 1: Import .xhb File</Label>
                    <Input
                        type="file"
                        accept=".xhb"
                        onChange={handleFileImport}
                        className="cursor-pointer file:text-indigo-600 file:font-semibold"
                    />
                    {importStatus && (
                        <p className={`text-sm flex items-center gap-2 ${importStatus.includes('Error') ? 'text-red-600' : 'text-emerald-600'}`}>
                            {importStatus.includes('Error') ? <AlertCircle className="w-4 h-4"/> : <CheckCircle2 className="w-4 h-4"/>}
                            {importStatus}
                        </p>
                    )}
                </div>

                <div className="text-center">
                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200"></span></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-500">Or</span></div>
                    </div>

                    <Button variant="ghost" onClick={nextStep} className="mt-2 w-full text-slate-600">
                        Use Defaults & Continue
                    </Button>
                </div>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 3) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-w-md w-full animate-in fade-in zoom-in duration-300">
              <CardHeader>
                  <CardTitle className="text-2xl text-center text-emerald-600 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-8 h-8" />
                      You're Set!
                  </CardTitle>
                  <CardDescription className="text-center">
                      Everything is ready. You can now start scanning receipts.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <Button onClick={handleFinish} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg h-12">
                      Start Scanning
                  </Button>
              </CardContent>
          </Card>
        </div>
      );
  }

  return null;
}
