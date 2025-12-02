import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { ocrService } from '../services/ocr';
import { formatMemo } from '../services/ocrUtils';
import { llmService } from '../services/llm';
import { matchingService } from '../services/matching';
import { ArrowLeft, Save, Loader2, Camera, Upload, X, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card } from '../components/ui/Card';
import { cn } from '../lib/utils';
import ImageCropper from '../components/ImageCropper';

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

  const [transactionType, setTransactionType] = useState('expense'); // 'expense' | 'income'

  const [categories, setCategories] = useState([]);
  const [payees, setPayees] = useState([]);
  const [ocrStatus, setOcrStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [aiConfig, setAiConfig] = useState(null);
  const [croppingImage, setCroppingImage] = useState(null); // Base64 of image being cropped

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
                // Determine type based on amount sign
                if (transaction.amount) {
                    const amt = parseFloat(transaction.amount);
                    if (!isNaN(amt)) {
                        if (amt < 0) {
                            setTransactionType('expense');
                            transaction.amount = Math.abs(amt).toString();
                        } else {
                            setTransactionType('income');
                            // transaction.amount is already positive
                        }
                    }
                }
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

  const performAiScan = async (fileToScan) => {
      setOcrStatus('AI Analyzing...');
      try {
           const result = await llmService.scanReceiptWithAI(fileToScan, aiConfig);

          // Smart match payee
          let bestPayee = result.merchant || '';
          if (payees.length > 0 && result.merchant) {
               const match = matchingService.findBestMatch(result.merchant, payees);
               if (match) bestPayee = match;
          }

          // Smart match category
          let bestCategory = '';
          // We prioritize category guess
          if (result.category_guess && categories.length > 0) {
              const match = matchingService.findBestMatch(result.category_guess, categories);
              if (match) bestCategory = match;
          }

          // Format Memo
          const formattedMemo = formatMemo({
              time: result.time,
              method: result.payment_method,
              summary: result.items_summary,
              notes: '',
              defaultMethod: ''
          });

          // Handle Amount
          let displayAmount = undefined;
          if (result.amount) {
              const rawAmt = parseFloat(result.amount);
              // AI Scan -> Receipt -> Expense
              setTransactionType('expense');
              displayAmount = Math.abs(rawAmt).toString();
          }

          setFormData(prev => ({
              ...prev,
              date: result.date || prev.date,
              time: result.time || prev.time,
              payee: bestPayee || prev.payee,
              amount: displayAmount !== undefined ? displayAmount : prev.amount,
              category: bestCategory || prev.category,
              memo: formattedMemo || prev.memo
          }));

          setOcrStatus('AI Success');
      } catch (err) {
          console.error("AI Scan Error:", err);
          setOcrStatus('AI Error');
          alert(`AI Scan Failed: ${err.message}`);
          throw err;
      }
  };

  const handleImageUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Reset value so same file can be selected again if needed
      e.target.value = null;

      if (file.type === 'application/pdf') {
          // Skip cropping for PDF for now
          processFile(file, true);
      } else {
          // Open Cropper
          const reader = new FileReader();
          reader.onload = () => {
              setCroppingImage(reader.result);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleCropConfirm = async (croppedBlob) => {
      setCroppingImage(null);
      const file = new File([croppedBlob], "cropped_receipt.jpg", { type: "image/jpeg" });
      await processFile(file);
  };

  const handleCropCancel = () => {
      setCroppingImage(null);
  };

  const processFile = async (file, isPdf = false) => {
      setIsProcessing(true);
      setOcrStatus('Initializing...');
      // fileObject removed as it was unused

      try {
          let fileToProcess = file;
          let previewData = null;

          if (isPdf) {
              setOcrStatus('Converting PDF...');
              const convertedImage = await ocrService.convertPdfToImage(file);
              previewData = convertedImage;

              // Convert base64 data URL to Blob for OCR/AI processing
              const res = await fetch(convertedImage);
              const blob = await res.blob();
              fileToProcess = new File([blob], "converted.png", { type: "image/png" });
          } else {
              const reader = new FileReader();
              const base64Promise = new Promise((resolve) => {
                  reader.onloadend = () => resolve(reader.result);
              });
              reader.readAsDataURL(file);
              previewData = await base64Promise;
          }

          setPreviewUrl(previewData);

          // Check if AI should be used
          if (aiConfig && aiConfig.apiKey) {
              await performAiScan(fileToProcess);
          } else {
              setOcrStatus('Reading text...');
              const settings = await storageService.getSettings();
              const strategy = settings.ocrProvider || 'auto';

              const text = await ocrService.recognize(fileToProcess, (m) => {
                      if (m.status === 'recognizing text') {
                          setOcrStatus(`Scanning: ${(m.progress * 100).toFixed(0)}%`);
                      } else {
                          setOcrStatus(m.status);
                      }
                  }, { strategy });

              setOcrStatus('Parsing...');
              const parsed = ocrService.parseText(text);

              // Smart match payee
              let bestPayee = parsed.merchant || '';
              if (payees.length > 0 && parsed.merchant) {
                   const match = matchingService.findBestMatch(parsed.merchant, payees);
                   if (match) bestPayee = match;
              }

              // Format Memo for Manual Fallback
              const formattedMemo = formatMemo({
                  time: parsed.time,
                  method: '',
                  summary: '',
                  notes: '',
                  defaultMethod: settings.defaultPaymentMode
              });

              // Handle Amount
              let parsedAmount = parsed.amount;
              if (parsedAmount) {
                  const val = parseFloat(parsedAmount);
                  setTransactionType('expense');
                  parsedAmount = Math.abs(val).toString();
              }

              setFormData(prev => ({
                  ...prev,
                  date: parsed.date || prev.date,
                  payee: bestPayee || prev.payee,
                  amount: parsedAmount || prev.amount,
                  time: parsed.time || prev.time,
                  memo: formattedMemo || prev.memo
              }));

              setOcrStatus('Done');
          }

      } catch (err) {
          setOcrStatus('Error');
          console.error(err);
      } finally {
          setIsProcessing(false);
          setTimeout(() => {
             setOcrStatus((prev) => prev === 'Done' || prev === 'AI Success' ? '' : prev);
          }, 2000);
      }
  };

  const handleClearImage = (e) => {
      e.preventDefault();
      setPreviewUrl(null);
      // setFileObject(null); // removed
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Process Amount based on Type
    const val = parseFloat(formData.amount);
    let finalAmount = isNaN(val) ? 0 : val;

    if (transactionType === 'expense') {
        finalAmount = -Math.abs(finalAmount);
    } else {
        finalAmount = Math.abs(finalAmount);
    }

    await storageService.saveTransaction({
        ...formData,
        amount: finalAmount.toString(),
        image: previewUrl
    });
    navigate('/');
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Cropper Modal */}
      {croppingImage && (
          <ImageCropper
            imageSrc={croppingImage}
            onCancel={handleCropCancel}
            onConfirm={handleCropConfirm}
          />
      )}

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


               {/* Mobile: Show OCR status below image if not processing but recently finished */}
               {!isProcessing && ocrStatus && (
                  <div className="text-xs text-center text-emerald-600 font-medium bg-emerald-50 py-1 rounded">
                      OCR: {ocrStatus}
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

                  {/* Transaction Type Toggle */}
                  <div className="grid grid-cols-2 gap-3 mb-2">
                      <button
                        type="button"
                        onClick={() => setTransactionType('expense')}
                        className={cn(
                            "flex items-center justify-center py-2 px-4 rounded-lg text-sm font-semibold transition-all border shadow-sm",
                            transactionType === 'expense'
                                ? "bg-red-50 border-red-200 text-red-700 ring-1 ring-red-200"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                        )}
                      >
                        Expense
                      </button>
                      <button
                        type="button"
                        onClick={() => setTransactionType('income')}
                        className={cn(
                            "flex items-center justify-center py-2 px-4 rounded-lg text-sm font-semibold transition-all border shadow-sm",
                            transactionType === 'income'
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700 ring-1 ring-emerald-200"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                        )}
                      >
                        Income
                      </button>
                  </div>

                  <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-500 text-sm">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        className={cn(
                            "pl-7 font-mono font-medium",
                            transactionType === 'expense' ? "text-red-600" : "text-emerald-600"
                        )}
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
