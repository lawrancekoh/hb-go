import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { storageService } from '../services/storage';
import { ocrService } from '../services/ocr';
import { llmService } from '../services/llm';
import { ArrowLeft, Save, Loader2, Camera, Upload, X, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card } from '../components/ui/Card';
import { cn } from '../lib/utils';

function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    payee: '',
    amount: '',
    category: '',
    memo: '',
    tags: ''
  });

  const [categories, setCategories] = useState([]);
  const [payees, setPayees] = useState([]);
  const [ocrStatus, setOcrStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileObject, setFileObject] = useState(null); // Keep reference to file for AI
  const [aiConfig, setAiConfig] = useState(null);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
        const cache = await storageService.getCache();
        if (cache.categories) setCategories(cache.categories);
        if (cache.payees) setPayees(cache.payees);

        // Load AI Config
        const storedAiConfig = localStorage.getItem('hb_ai_config');
        if (storedAiConfig) {
            setAiConfig(JSON.parse(storedAiConfig));
        }

        if (id && id !== 'new') {
            const transaction = await storageService.getTransaction(id);
            if (transaction) {
                setFormData(transaction);
                if (transaction.image) setPreviewUrl(transaction.image);
            }
        } else {
            const settings = await storageService.getSettings();
            if (settings.defaultTag) {
                setFormData(prev => ({ ...prev, tags: settings.defaultTag }));
            }
        }
    };
    loadData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setIsProcessing(true);
      setOcrStatus('Initializing...');

      // Store file object for AI
      setFileObject(file);

      try {
          let fileToProcess = file;
          let previewData = null;

          if (file.type === 'application/pdf') {
              setOcrStatus('Converting PDF...');
              const convertedImage = await ocrService.convertPdfToImage(file);
              previewData = convertedImage;
              fileToProcess = convertedImage;
          } else {
              const reader = new FileReader();
              const base64Promise = new Promise((resolve) => {
                  reader.onloadend = () => resolve(reader.result);
              });
              reader.readAsDataURL(file);
              previewData = await base64Promise;
          }

          setPreviewUrl(previewData);
          setOcrStatus('Reading text...');

          const settings = await storageService.getSettings();
          const strategy = settings.ocrProvider || 'auto';

          // Basic OCR for quick preview / fallback
          const text = await ocrService.recognize(fileToProcess, (m) => {
                  if (m.status === 'recognizing text') {
                      setOcrStatus(`Scanning: ${(m.progress * 100).toFixed(0)}%`);
                  } else {
                      setOcrStatus(m.status);
                  }
              }, { strategy });

              setOcrStatus('Parsing...');
              const parsed = ocrService.parseText(text);

              setFormData(prev => ({
                  ...prev,
                  date: parsed.date || prev.date,
                  payee: parsed.merchant || prev.payee,
                  amount: parsed.amount || prev.amount,
                  time: parsed.time || prev.time,
              }));

              setOcrStatus('Done');
          } catch (err) {
              setOcrStatus('Error');
              console.error(err);
          } finally {
              setIsProcessing(false);
              // Clear status after 2 seconds if done
              setTimeout(() => {
                 if (!isProcessing) setOcrStatus('');
              }, 2000);
          }

          await performAiScan(imageToScan, aiConfig);

      } catch (err) {
          console.error(err);
          setOcrStatus('AI Error');
          alert(`AI Scan Failed: ${err.message}`);
      } finally {
          setIsProcessing(false);
          setTimeout(() => setOcrStatus(''), 2000);
      }
  };

  const handleAiScan = async () => {
      if (!fileObject || !aiConfig) return;

      setIsProcessing(true);
      setOcrStatus('AI Analyzing...');

      try {
          // If we have a PDF that was converted, we need to pass the converted blob/file not the original PDF
          // But fileObject is the original file.
          // However, for AI, we convert image to base64 inside scanReceiptWithAI.
          // If it's a PDF, llmService doesn't handle PDF conversion.
          // We should use the same logic as OCR: if PDF, convert first.

          let imageToScan = fileObject;
          if (fileObject.type === 'application/pdf') {
               // We need to re-convert or use the one from state if we stored it?
               // We didn't store the converted file in state, only previewUrl (data uri).
               // We can convert data URI back to blob or just use data URI logic in llmService?
               // llmService expects File/Blob and does FileReader.
               // Let's rely on previewUrl if it exists and is an image data URI.
               if (previewUrl && previewUrl.startsWith('data:image')) {
                   const res = await fetch(previewUrl);
                   const blob = await res.blob();
                   imageToScan = new File([blob], "converted.png", { type: "image/png" });
               } else {
                    // Fallback re-convert
                    imageToScan = await ocrService.convertPdfToImage(fileObject);
               }
          }

          const result = await llmService.scanReceiptWithAI(imageToScan, aiConfig);

          // Fuzzy match category
          let bestCategory = '';
          if (result.category_guess && categories.length > 0) {
              const guess = result.category_guess.toLowerCase();
              // 1. Exact match (insensitive)
              let match = categories.find(c => c.toLowerCase() === guess);

              // 2. Contains match
              if (!match) {
                  match = categories.find(c => c.toLowerCase().includes(guess) || guess.includes(c.toLowerCase()));
              }

              if (match) bestCategory = match;
          }

          setFormData(prev => ({
              ...prev,
              date: result.date || prev.date,
              time: result.time || prev.time,
              payee: result.merchant || prev.payee,
              amount: result.amount ? (parseFloat(result.amount) * -1).toString() : prev.amount, // Expense is negative
              category: bestCategory || prev.category,
              memo: `[AI] ${prev.memo}`.trim()
          }));

          setOcrStatus('AI Success');

      } catch (err) {
          console.error(err);
          setOcrStatus('AI Error');
          alert(`AI Scan Failed: ${err.message}`);
      } finally {
          setIsProcessing(false);
          setTimeout(() => setOcrStatus(''), 2000);
      }
  };

  const handleClearImage = (e) => {
      e.preventDefault();
      setPreviewUrl(null);
      setFileObject(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await storageService.saveTransaction({ ...formData, image: previewUrl });
    navigate('/');
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-slate-900">{id === 'new' ? 'New Transaction' : 'Edit Transaction'}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Image / Capture */}
          <div className="flex flex-col gap-4">
              <div className={cn(
                  "relative aspect-[3/4] md:aspect-[4/5] bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center overflow-hidden transition-colors hover:bg-slate-50",
                  previewUrl ? "border-solid border-slate-200 bg-slate-900" : ""
              )}>
                  {previewUrl ? (
                      <>
                        <img src={previewUrl} alt="Receipt" className="w-full h-full object-contain" />
                        <Button
                            size="icon"
                            variant="destructive"
                            className="absolute top-2 right-2 rounded-full h-8 w-8 opacity-80 hover:opacity-100"
                            onClick={handleClearImage}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                      </>
                  ) : (
                      <div className="text-center p-6 relative">
                           {/* AI Badge */}
                           {aiConfig && (
                               <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                                   <Sparkles className="h-3 w-3" /> AI READY
                               </div>
                           )}

                           <div className="bg-white p-4 rounded-full shadow-sm inline-flex mb-4 relative">
                                <Camera className="h-8 w-8 text-brand-600" />
                                {aiConfig && (
                                    <div className="absolute -top-1 -right-1 bg-indigo-600 text-white rounded-full p-1 border-2 border-white">
                                        <Sparkles className="h-3 w-3" />
                                    </div>
                                )}
                           </div>
                           <p className="font-medium text-slate-900">
                               {aiConfig ? "Tap to Scan with AI" : "Tap to Scan Receipt"}
                           </p>
                           <p className="text-xs text-slate-500 mt-1">Supports Image & PDF</p>
                      </div>
                  )}

                  {/* Hidden Input Overlay */}
                  {!previewUrl && (
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleImageUpload}
                    />
                  )}

                  {/* Processing Overlay */}
                  {isProcessing && (
                      <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-10">
                          <Loader2 className="h-8 w-8 text-brand-600 animate-spin mb-2" />
                          <p className="text-sm font-semibold text-brand-700">{ocrStatus}</p>
                      </div>
                  )}
              </div>

               {/* AI Scan Button */}
               {aiConfig && previewUrl && !isProcessing && (
                   <Button
                        onClick={handleAiScan}
                        className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all hover:scale-[1.02]"
                   >
                       <Sparkles className="h-4 w-4" />
                       Scan with AI
                   </Button>
               )}

               {/* Mobile: Show OCR status below image if not processing but recently finished */}
               {!isProcessing && ocrStatus && (
                  <div className="text-xs text-center text-emerald-600 font-medium bg-emerald-50 py-1 rounded">
                      {ocrStatus === 'Done' || ocrStatus === 'AI Success' ? ocrStatus : `Last Status: ${ocrStatus}`}
                  </div>
               )}
          </div>

          {/* Right Column: Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                      />
                  </div>
                  <div className="space-y-2">
                      <Label>Time</Label>
                      <Input
                        type="time"
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                      />
                  </div>
              </div>

              <div className="space-y-2">
                  <Label>Payee</Label>
                  <Input
                    type="text"
                    name="payee"
                    value={formData.payee}
                    onChange={handleChange}
                    list="payee-list"
                    placeholder="Merchant Name"
                    required
                    autoComplete="off"
                  />
                  <datalist id="payee-list">
                      {payees.map(p => <option key={p} value={p} />)}
                  </datalist>
              </div>

              <div className="space-y-2">
                  <Label>Amount</Label>
                  <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-500 text-sm">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        className="pl-7 font-mono font-medium"
                        placeholder="0.00"
                        required
                      />
                  </div>
              </div>

              <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    list="category-list"
                    placeholder="Select or Type Category"
                    autoComplete="off"
                  />
                  <datalist id="category-list">
                    {categories.map(cat => (
                        <option key={cat} value={cat} />
                    ))}
                  </datalist>
              </div>

              <div className="space-y-2">
                  <Label>Tags</Label>
                  <Input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="Space separated tags"
                  />
              </div>

              <div className="space-y-2">
                  <Label>Memo</Label>
                  <Input
                    type="text"
                    name="memo"
                    value={formData.memo}
                    onChange={handleChange}
                    placeholder="Notes"
                  />
              </div>

              <div className="pt-4 sticky bottom-0 bg-white md:static p-4 md:p-0 -mx-4 md:mx-0 border-t md:border-0 shadow-lg md:shadow-none flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/')}>
                      Cancel
                  </Button>
                  <Button type="submit" className="flex-1 gap-2">
                      <Save className="h-4 w-4" /> Save
                  </Button>
              </div>
          </form>
      </div>
    </div>
  );
}

export default Editor;
