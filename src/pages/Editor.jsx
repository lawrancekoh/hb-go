import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { storageService } from '../services/storage';
import { ocrService } from '../services/ocr';
import { formatMemo } from '../services/ocrUtils';
import { llmService } from '../services/llm';
import { matchingService } from '../services/matching';
import { getToday, getCurrentTime, validateDate, validateTime } from '../services/dateUtils';
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
    date: getToday(),
    time: getCurrentTime(),
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
  const [existingTags, setExistingTags] = useState([]); // Loaded from local storage

  const amountInputRef = useRef(null);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
        const cache = await storageService.getCache();
        if (cache.categories) setCategories(cache.categories);
        if (cache.payees) setPayees(cache.payees);

        // Load Tags from LocalStorage
        const storedTags = localStorage.getItem('hb_tags');
        if (storedTags) {
            try {
                const parsed = JSON.parse(storedTags);
                if (Array.isArray(parsed)) {
                    setExistingTags(parsed);
                }
            } catch (e) {
                console.error("Failed to parse tags", e);
            }
        }

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
            const updates = {};

            if (settings.defaultTag) {
                updates.tags = settings.defaultTag;
            }

            // Set Default Category
            const defaultCategory = localStorage.getItem('hb_default_category');
            if (defaultCategory) {
                updates.category = defaultCategory;
            }

            if (Object.keys(updates).length > 0) {
                setFormData(prev => ({ ...prev, ...updates }));
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
          const aiGuess = result.category_guess;
          const matchedCategory = (aiGuess && categories.length > 0)
              ? matchingService.findBestMatch(aiGuess, categories)
              : null;

          const defaultCategory = localStorage.getItem('hb_default_category') || '';

          // Priority: AI Match > Default > Empty
          const bestCategory = matchedCategory || defaultCategory;

          console.log("AI Category Debug:", {
              rawGuess: aiGuess,
              matched: matchedCategory,
              userDefault: defaultCategory,
              final: bestCategory
          });

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
          if (result.amount !== undefined && result.amount !== null) {
              const rawAmt = parseFloat(result.amount);
              // AI Scan -> Receipt -> Expense
              setTransactionType('expense');
              displayAmount = Math.abs(rawAmt).toString();

              // If amount is 0 (likely object scan), focus the input
              if (rawAmt === 0) {
                 setTimeout(() => {
                     amountInputRef.current?.focus();
                 }, 100);
              }
          }

          // Handle Tags Guess
          let finalTags = formData.tags;
          if (result.tags_guess && Array.isArray(result.tags_guess) && existingTags.length > 0) {
              const validGuesses = result.tags_guess.filter(guess =>
                  existingTags.some(existing => existing.toLowerCase() === guess.toLowerCase())
              );

              if (validGuesses.length > 0) {
                  // Append to existing tags, avoiding duplicates
                  const currentTags = finalTags ? finalTags.split(' ').filter(Boolean) : [];
                  validGuesses.forEach(tag => {
                       // Find the correct case from existingTags
                       const correctCaseTag = existingTags.find(t => t.toLowerCase() === tag.toLowerCase());
                       if (correctCaseTag && !currentTags.includes(correctCaseTag)) {
                           currentTags.push(correctCaseTag);
                       }
                  });
                  finalTags = currentTags.join(' ');
              }
          }

          // Validate Date/Time
          const aiDate = result.date;
          // 1. Validate the AI's return (checks format, future dates, etc.)
          const validatedDate = validateDate(aiDate);

          // 2. Fallback: If AI returned null (Object Mode) or invalid, use TODAY.
          const finalDate = validatedDate || getToday();

          const validTime = validateTime(result.time);

          setFormData(prev => ({
              ...prev,
              date: finalDate,
              time: validTime || getCurrentTime(),
              payee: bestPayee || prev.payee,
              amount: displayAmount !== undefined ? displayAmount : prev.amount,
              category: bestCategory || prev.category,
              memo: formattedMemo || prev.memo,
              tags: finalTags || prev.tags
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

              // Validate Date/Time
              const validDate = validateDate(parsed.date);
              const validTime = validateTime(parsed.time);

              setFormData(prev => ({
                  ...prev,
                  date: validDate || getToday(),
                  time: validTime || getCurrentTime(),
                  payee: bestPayee || prev.payee,
                  amount: parsedAmount || prev.amount,
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

  // Tag Suggestion Logic
  const getTagSuggestions = () => {
    if (!formData.tags) return [];
    const parts = formData.tags.split(' ');
    const activeKeyword = parts[parts.length - 1];

    if (!activeKeyword) return [];

    const matches = existingTags.filter(tag =>
        tag.toLowerCase().startsWith(activeKeyword.toLowerCase()) ||
        tag.toLowerCase().includes(activeKeyword.toLowerCase())
    ).slice(0, 5); // Limit to 5

    // Filter out tags that are already used
    const usedTags = parts.slice(0, -1).map(t => t.toLowerCase());
    return matches.filter(tag => !usedTags.includes(tag.toLowerCase()));
  };

  const handleTagSuggestionClick = (tag) => {
      const parts = formData.tags.split(' ');
      parts.pop(); // Remove partial keyword
      parts.push(tag);
      parts.push(''); // Add space for next tag
      setFormData(prev => ({ ...prev, tags: parts.join(' ') }));
      // Focus back on tags input? (Ideally yes, but simple click handler for now)
  };

  const tagSuggestions = getTagSuggestions();

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
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{id === 'new' ? 'New Transaction' : 'Edit Transaction'}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Image / Capture */}
          <div className="flex flex-col gap-4">
              <div className={cn(
                  "relative aspect-[3/4] md:aspect-[4/5] bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center overflow-hidden transition-colors hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-800/80",
                  previewUrl ? "border-solid border-slate-200 bg-slate-900 dark:border-slate-800" : ""
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
                               <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                                   <Sparkles className="h-3 w-3" /> AI READY
                               </div>
                           )}

                           <div className="bg-white p-4 rounded-full shadow-sm inline-flex mb-4 relative dark:bg-slate-700">
                                <Camera className="h-8 w-8 text-brand-600 dark:text-brand-400" />
                                {aiConfig && (
                                    <div className="absolute -top-1 -right-1 bg-brand-600 text-white rounded-full p-1 border-2 border-white dark:border-slate-700">
                                        <Sparkles className="h-3 w-3" />
                                    </div>
                                )}
                           </div>
                           <p className="font-medium text-slate-900 dark:text-slate-100">
                               {aiConfig ? "Scan a receipt, or snap a photo of the item!" : "Tap to Scan Receipt"}
                           </p>
                           <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Supports Image & PDF</p>
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
                      <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-10 dark:bg-slate-900/90">
                          <Loader2 className="h-8 w-8 text-brand-600 animate-spin mb-2 dark:text-brand-400" />
                          <p className="text-sm font-semibold text-brand-700 dark:text-brand-400">{ocrStatus}</p>
                      </div>
                  )}
              </div>


               {/* Mobile: Show OCR status below image if not processing but recently finished */}
               {!isProcessing && ocrStatus && (
                  <div className="text-xs text-center text-emerald-600 font-medium bg-emerald-50 py-1 rounded dark:bg-emerald-900/30 dark:text-emerald-400">
                      OCR: {ocrStatus}
                  </div>
               )}
          </div>

          {/* Right Column: Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <div className="flex justify-between items-center">
                          <Label className="dark:text-slate-200">Date</Label>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, date: getToday() }))}
                            className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            Today
                          </button>
                      </div>
                      <Input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                        className="dark:text-slate-100" // Ensure text is visible
                      />
                  </div>
                  <div className="space-y-2">
                      <Label className="dark:text-slate-200">Time</Label>
                      <Input
                        type="time"
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        className="dark:text-slate-100"
                      />
                  </div>
              </div>

              <div className="space-y-2">
                  <Label className="dark:text-slate-200">Payee</Label>
                  <div className="relative">
                      <Input
                        type="text"
                        name="payee"
                        value={formData.payee}
                        onChange={handleChange}
                        list="payee-list"
                        placeholder="Merchant Name"
                        autoComplete="off"
                        className="dark:text-slate-100 pr-10"
                      />
                      {formData.payee && (
                          <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, payee: '' }))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1"
                          >
                              <X className="h-4 w-4" />
                          </button>
                      )}
                  </div>
                  <datalist id="payee-list">
                      {payees.map(p => <option key={p} value={p} />)}
                  </datalist>
              </div>

              <div className="space-y-2">
                  <Label className="dark:text-slate-200">Amount</Label>

                  {/* Transaction Type Toggle */}
                  <div className="grid grid-cols-2 gap-3 mb-2">
                      <button
                        type="button"
                        onClick={() => setTransactionType('expense')}
                        className={cn(
                            "flex items-center justify-center py-2 px-4 rounded-lg text-sm font-semibold transition-all border shadow-sm",
                            transactionType === 'expense'
                                ? "bg-red-50 border-red-200 text-red-700 ring-1 ring-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400 dark:ring-red-800"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
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
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400 dark:ring-emerald-800"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
                        )}
                      >
                        Income
                      </button>
                  </div>

                  <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-500 text-sm dark:text-slate-400">$</span>
                      <Input
                        ref={amountInputRef}
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        className={cn(
                            "pl-7 pr-10 font-mono font-medium",
                            transactionType === 'expense' ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                        )}
                        placeholder="0.00"
                        required
                      />
                      {formData.amount && (
                          <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, amount: '' }))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1"
                          >
                              <X className="h-4 w-4" />
                          </button>
                      )}
                  </div>
              </div>

              <div className="space-y-2">
                  <Label className="dark:text-slate-200">Category</Label>
                  <div className="relative">
                      <Input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        list="category-list"
                        placeholder="Select or Type Category"
                        autoComplete="off"
                        className="dark:text-slate-100 pr-10"
                      />
                      {formData.category && (
                          <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, category: '' }))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1"
                          >
                              <X className="h-4 w-4" />
                          </button>
                      )}
                  </div>
                  <datalist id="category-list">
                    {categories.map(cat => (
                        <option key={cat} value={cat} />
                    ))}
                  </datalist>
              </div>

              <div className="space-y-2">
                  <Label className="dark:text-slate-200">Tags</Label>
                  <div className="relative">
                      <Input
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={handleChange}
                        placeholder="Space separated tags"
                        className="dark:text-slate-100 pr-10"
                        autoComplete="off"
                      />
                      {formData.tags && (
                          <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, tags: '' }))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1"
                          >
                              <X className="h-4 w-4" />
                          </button>
                      )}
                  </div>

                  {/* Suggestion Ribbon */}
                  {tagSuggestions.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar">
                          {tagSuggestions.map(tag => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => handleTagSuggestionClick(tag)}
                                className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs px-3 py-1 rounded-full whitespace-nowrap hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                              >
                                  {tag}
                              </button>
                          ))}
                      </div>
                  )}
              </div>

              <div className="space-y-2">
                  <Label className="dark:text-slate-200">Memo</Label>
                  <div className="relative">
                      <Input
                        type="text"
                        name="memo"
                        value={formData.memo}
                        onChange={handleChange}
                        placeholder="Notes"
                        className="dark:text-slate-100 pr-10"
                      />
                      {formData.memo && (
                          <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, memo: '' }))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1"
                          >
                              <X className="h-4 w-4" />
                          </button>
                      )}
                  </div>
              </div>

              <div className="pt-4 sticky bottom-0 bg-white md:static p-4 md:p-0 -mx-4 md:mx-0 border-t md:border-0 shadow-lg md:shadow-none flex gap-3 dark:bg-slate-900 dark:border-slate-800">
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
