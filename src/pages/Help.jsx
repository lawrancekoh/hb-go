import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { ArrowLeft, BookOpen, Upload, Camera, Download, Smartphone, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';

function Help() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" href="/" aria-label="Back to Home">
            <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">How to Use</h1>
      </div>

      <div className="grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-brand-600" />
                    Pro Tips
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-600">
                <ul className="list-disc list-inside space-y-2">
                    <li>
                        <strong>AI Setup:</strong> Go to Settings to add an OpenAI/Gemini key for super-accurate scanning.
                    </li>
                    <li>
                        <strong>Cropping:</strong> Crop your image tightly around the text to remove table backgrounds and improve results.
                    </li>
                    <li>
                        <strong>Tagging:</strong> Search <code>tag:mobile-import</code> in HomeBank to find transactions added via this app.
                    </li>
                    <li>
                        <strong>Automation:</strong> Set up 'Assignments' in HomeBank Desktop to automate categories based on Payee names.
                    </li>
                </ul>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-brand-600" />
                    1. Setup
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-slate-600">
                <p>
                    Go to <Link to="/settings" className="text-brand-600 font-medium hover:underline">Settings</Link>.
                </p>
                <p>
                    Import your HomeBank file (<code>.xhb</code>) to load your existing categories and payees. This makes entry much faster!
                </p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-brand-600" />
                    2. Capture
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-slate-600">
                <p>
                    Tap the <strong>+</strong> button on the home screen.
                </p>
                <p>
                    Take a photo of a receipt or upload a PDF. The app will try to read the Date, Total, and Merchant automatically.
                </p>
            </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-brand-600" />
                    3. Export
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-slate-600">
                <p>
                    When you are ready, tap <strong>Export CSV</strong> on the home screen.
                </p>
                <p>
                    Save the file, then open HomeBank Desktop and go to <code>File &gt; Import</code>.
                </p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-brand-600" />
                    Installation
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-600">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">iOS (Safari)</h3>
                  <ol className="list-decimal list-inside space-y-1 pl-1">
                    <li>Open app in Safari</li>
                    <li>Tap <strong>Share</strong> (box with arrow)</li>
                    <li>Tap <strong>Add to Home Screen</strong></li>
                  </ol>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Android (Chrome)</h3>
                  <ol className="list-decimal list-inside space-y-1 pl-1">
                    <li>Open app in Chrome</li>
                    <li>Tap <strong>Menu</strong> (three dots)</li>
                    <li>Tap <strong>Install App</strong> or <strong>Add to Home screen</strong></li>
                  </ol>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-brand-600" />
                    Privacy
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-slate-600">
                <p>
                    <strong>Your data stays on your device.</strong>
                </p>
                <p>
                    HB Go works completely offline. All your transactions and receipt images are stored locally in your browser's database.
                </p>
                <p>
                    We do not require any login, and we do not collect or transmit your personal financial data to any external servers.
                </p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Help;
