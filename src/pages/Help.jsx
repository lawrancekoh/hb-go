import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { ArrowLeft, BookOpen, Upload, Camera, Download } from 'lucide-react';
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
      </div>
    </div>
  );
}

export default Help;
