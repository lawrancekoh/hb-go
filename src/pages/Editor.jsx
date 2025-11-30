import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { ocrService } from '../services/ocr';

function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
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

  useEffect(() => {
    const loadData = async () => {
        const cache = await storageService.getCache();
        if (cache.categories) setCategories(cache.categories);
        if (cache.payees) setPayees(cache.payees);

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

      // Convert to Base64 for persistence
      const reader = new FileReader();
      reader.onloadend = async () => {
          const base64String = reader.result;
          setPreviewUrl(base64String);

          setIsProcessing(true);
          setOcrStatus('Initializing OCR...');

          try {
              const text = await ocrService.recognize(file, (m) => {
                  if (m.status === 'recognizing text') {
                      setOcrStatus(`Scanning: ${(m.progress * 100).toFixed(0)}%`);
                  } else {
                      setOcrStatus(m.status);
                  }
              });

              setOcrStatus('Parsing details...');
              const parsed = ocrService.parseText(text);
              console.log("Parsed OCR:", parsed);

              setFormData(prev => ({
                  ...prev,
                  payee: parsed.merchant || prev.payee,
                  amount: parsed.amount || prev.amount,
                  time: parsed.time || prev.time,
              }));

              setOcrStatus('Done!');
          } catch (err) {
              setOcrStatus('Error processing image.');
              console.error(err);
          } finally {
              setIsProcessing(false);
          }
      };
      reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await storageService.saveTransaction({ ...formData, image: previewUrl });
    navigate('/');
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">{id === 'new' ? 'New Transaction' : 'Edit Transaction'}</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Image Preview & Capture Area */}
        <div className="relative">
             <div className="aspect-video bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 relative overflow-hidden group">
              {previewUrl ? (
                  <img src={previewUrl} alt="Receipt" className="object-contain w-full h-full" />
              ) : (
                  <span>Tap to Capture Receipt</span>
              )}

              <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleImageUpload}
              />
            </div>
            {isProcessing && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <p className="font-semibold text-blue-600 animate-pulse">{ocrStatus}</p>
                </div>
            )}
            {!isProcessing && ocrStatus && ocrStatus !== 'Done!' && (
                 <p className="text-xs text-center mt-1 text-gray-500">{ocrStatus}</p>
            )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Time</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Payee / Merchant</label>
          <input
            type="text"
            name="payee"
            value={formData.payee}
            onChange={handleChange}
            list="payee-list"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
            placeholder="e.g. Starbucks"
            required
            autoComplete="off"
          />
          <datalist id="payee-list">
             {payees.map(p => <option key={p} value={p} />)}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            step="0.01"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tags</label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
            placeholder="tag1 tag2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Memo / Note</label>
          <input
            type="text"
            name="memo"
            value={formData.memo}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
          />
        </div>

        <div className="flex gap-4 mt-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export default Editor;
