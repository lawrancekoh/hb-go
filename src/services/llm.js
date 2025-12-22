import { pipeline, env } from '@huggingface/transformers';

/**
 * Inference Orchestrator for Hybrid AI Vision (Local + Cloud)
 */

// Configure Transformers.js to use hosted models from GitHub Releases
env.allowLocalModels = false;
env.useBrowserCache = true;
env.allowRemoteModels = true;
env.remoteHost = 'https://github.com/lawrancekoh/hb-go/releases/download/models/';
env.remotePathTemplate = '{model}-'; // Maps 'modelId' to 'modelId-' prefix for flat release assets

class LocalProvider {
    static instance = null;
    static modelId = 'paligemma-3b-onnx';

    static async getInstance(modelId, progressCallback) {
        if (!navigator.gpu) {
            throw new Error('WebGPU is not supported on this device.');
        }

        if (!this.instance || this.modelId !== modelId) {
             this.modelId = modelId;
             // Initialize the pipeline
             this.instance = await pipeline('image-to-text', modelId, {
                 device: 'webgpu',
                 dtype: 'fp16',
                 progress_callback: progressCallback,
             });
        }
        return this.instance;
    }

    static async scan(imageFile, modelId) {
        const scanner = await this.getInstance(modelId);

        // Convert File to URL or generic input transformers accepts
        const imageUrl = URL.createObjectURL(imageFile);

        const PROMPT = "extract receipt data JSON";

        try {
            const result = await scanner(imageUrl, {
                max_new_tokens: 512,
                generate_kwargs: { prompt: PROMPT }
            });

            let text = result[0]?.generated_text || "";

            // Attempt to parse JSON from the text
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Model did not return valid JSON');

        } finally {
            URL.revokeObjectURL(imageUrl);
        }
    }
}

export const llmService = {
  /**
   * Verifies API Key (Cloud) - Existing Logic
   */
  async verifyAndFetchModels(provider, apiKey, baseUrl) {
      if (provider === 'local') return []; // Local doesn't fetch models this way

      if (!apiKey) throw new Error('API Key is required');

      let models = [];

      if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Gemini API Error: ${response.statusText}`);
        const data = await response.json();
        if (!data.models) throw new Error('No models found');
        models = data.models
            .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
            .map(m => m.name.replace('models/', ''));
      } else {
        const url = `${baseUrl}/models`;
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${apiKey}` } });
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        const data = await response.json();
        models = data.data
            .filter(m => {
                const id = m.id.toLowerCase();
                return id.includes('gpt') || id.includes('vision') || id.includes('o1');
            })
            .map(m => m.id);
      }

      const priorities = ['gemini-1.5-flash-8b', 'gemini-1.5-flash', 'gpt-4o-mini', 'gpt-4o', 'gemini-1.5-pro'];
      models.sort((a, b) => {
        const indexA = priorities.findIndex(p => a.includes(p));
        const indexB = priorities.findIndex(p => b.includes(p));
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
      });

      return models;
  },

  /**
   * Public method to trigger model download/loading for UI progress
   */
  async loadLocalModel(modelId, progressCallback) {
      return await LocalProvider.getInstance(modelId, progressCallback);
  },

  /**
   * Check if a model is potentially cached/downloaded
   * This is a best-effort check using the Cache API
   */
  async checkModelStatus(modelId) {
    if (!('caches' in window)) return false;

    // transform modelId + filename to check
    // Logic: remoteHost + remotePathTemplate + filename
    // default file transformers.js always fetches is 'config.json'
    // with our template: {model}-config.json

    const cacheName = 'transformers-cache';
    const hasCache = await window.caches.has(cacheName);
    if (!hasCache) return false;

    const cache = await window.caches.open(cacheName);
    const targetUrl = `${env.remoteHost}${modelId}-config.json`;

    const match = await cache.match(targetUrl);
    return !!match;
  },

  /**
   * Main Orchestrator Method
   */
  async scanImage(imageFile, config, globalSettings) {
      // config: { provider, apiKey, baseUrl, model } - from Settings 'aiConfig'
      // globalSettings: { ai_preference, local_model_choice, auto_fallback } - from storage

      const preference = globalSettings?.ai_preference || 'local';
      const useLocal = preference === 'local';
      const canWebGPU = !!navigator.gpu;

      // 1. Try Local if preferred and supported
      if (useLocal && canWebGPU) {
          try {
              console.log('Attempting Local Inference...');
              const result = await LocalProvider.scan(
                  imageFile,
                  globalSettings.local_model_choice
              );
              return { ...result, source: 'local' };
          } catch (err) {
              console.warn('Local Inference Failed:', err);
              if (!globalSettings.auto_fallback) {
                  throw err; // No fallback allowed
              }
              // Proceed to Cloud Fallback
          }
      }

      // 2. Cloud Fallback (or Primary if preferred)
      if (config.apiKey) {
           try {
               console.log('Attempting Cloud Inference...');
               const result = await this.scanReceiptWithCloud(imageFile, config);
               return { ...result, source: 'cloud' };
           } catch (err) {
               console.warn('Cloud Inference Failed:', err);
               throw err; // Let caller handle fallback to System OCR if needed
           }
      }

      throw new Error('No valid AI provider configured or available.');
  },

  /**
   * Existing Cloud Logic (renamed)
   */
  async scanReceiptWithCloud(imageFile, config) {
    const { provider, apiKey, baseUrl, model } = config;
    if (!apiKey) throw new Error('API Configuration missing');

    const base64Image = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    const dateFormat = localStorage.getItem('hb_date_format') || 'DD/MM/YYYY';
    const SYSTEM_PROMPT = `Analyze this image. It is either a receipt or a general object/item. Return ONLY a strict JSON object (no markdown, no backticks).

    DATE LOGIC:
    1. Search strictly for **visible text** resembling a date on a receipt/document within the image.
    2. If a receipt date is found, extract it using the format **${dateFormat}**.
    3. If **NO text date** is visible (e.g., photo of a food item, coffee cup, or object), return null. **DO NOT** guess today's date.

    1. If it is a RECEIPT:
       - Extract: date (YYYY-MM-DD, see DATE LOGIC above), time (HH:MM), merchant (string), amount (number, total only), currency (symbol).
       - category_guess: derived from merchant.
       - payment_method: string (e.g. Visa, Cash, Amex).
       - items_summary: string, max 5 words summary of items.
       - Analyze context for potential tags. Look for Meal Times ('lunch', 'dinner') or Payment Keywords ('visa', 'nets', 'paynow'). Return a field "tags_guess": array of strings (lowercase).
       - is_receipt: true.

    2. If it is an OBJECT (no receipt text found):
       - merchant: Guess based on brand/logo or object type (e.g., "Starbucks", "Vending Machine", "Taxi", "Apple").
       - category_guess: Derive from the object type (e.g., "Food", "Electronics", "Transport").
       - items_summary: Describe the visual object (e.g., "Latte", "Blue Keyboard").
       - amount: Return 0 (zero).
       - is_receipt: false.
       - date: null.
       - tags_guess: Guess relevant tags based on object context (e.g. 'coffee', 'electronics').
    `;

    let responseText = '';

    if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const base64Data = base64Image.split(',')[1];
        const payload = {
            contents: [{
                parts: [
                    { text: SYSTEM_PROMPT },
                    { inline_data: { mime_type: imageFile.type || 'image/jpeg', data: base64Data } }
                ]
            }]
        };
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
             const err = await response.json().catch(() => ({}));
             throw new Error(err.error?.message || `Gemini Error: ${response.status}`);
        }
        const data = await response.json();
        responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    } else {
        const url = `${baseUrl}/chat/completions`;
        const payload = {
            model: model,
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: [{ type: "image_url", image_url: { url: base64Image } }] }
            ],
            max_tokens: 500
        };
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `API Error: ${response.status}`);
        }
        const data = await response.json();
        responseText = data.choices?.[0]?.message?.content;
    }

    if (!responseText) throw new Error('No response from AI provider');

    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error('Failed to parse AI response:', responseText);
        throw new Error('AI returned invalid JSON');
    }
  }
};
