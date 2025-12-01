/**
 * LLM Service for AI-powered Receipt Scanning
 * Supports OpenAI-compatible APIs and Google Gemini
 */

export const llmService = {
  /**
   * Verifies the API key and fetches available models
   * @param {string} provider - 'openai', 'gemini', or 'custom'
   * @param {string} apiKey - The API key
   * @param {string} baseUrl - Base URL for OpenAI/Custom provider
   * @returns {Promise<string[]>} - List of sorted model names
   */
  async verifyAndFetchModels(provider, apiKey, baseUrl) {
    if (!apiKey) throw new Error('API Key is required');

    let models = [];

    if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Gemini API Error: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.models) throw new Error('No models found in response');

      // Filter for models that support generateContent
      models = data.models
        .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
        .map(m => m.name.replace('models/', '')); // Strip 'models/' prefix

    } else {
      // OpenAI or Custom
      const url = `${baseUrl}/models`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API Error: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.data) throw new Error('Invalid response format (missing data array)');

      // Filter for relevant models
      models = data.data
        .filter(m => {
            const id = m.id.toLowerCase();
            return id.includes('gpt') || id.includes('vision') || id.includes('o1');
        })
        .map(m => m.id);
    }

    // Sort models: prioritized models first
    const priorities = ['gemini-1.5-flash', 'gpt-4o-mini', 'gpt-4o', 'gemini-1.5-pro'];

    models.sort((a, b) => {
      const indexA = priorities.findIndex(p => a.includes(p));
      const indexB = priorities.findIndex(p => b.includes(p));

      // If both are priority models, sort by priority index
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      // If only A is priority, it comes first
      if (indexA !== -1) return -1;
      // If only B is priority, it comes first
      if (indexB !== -1) return 1;
      // Otherwise sort alphabetically
      return a.localeCompare(b);
    });

    return models;
  },

  /**
   * Scans a receipt image using the configured AI provider
   * @param {File|Blob} imageFile - The receipt image
   * @param {Object} config - { provider, apiKey, baseUrl, model }
   * @returns {Promise<Object>} - Parsed receipt data
   */
  async scanReceiptWithAI(imageFile, config) {
    const { provider, apiKey, baseUrl, model } = config;
    if (!apiKey) throw new Error('API Configuration missing');

    // Convert image to Base64
    const base64Image = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    const SYSTEM_PROMPT = "Analyze this receipt image. Return ONLY a strict JSON object (no markdown, no backticks). Fields: date (YYYY-MM-DD), time (HH:MM), merchant (string), amount (number, total only), currency (symbol), category_guess (string based on merchant).";

    let responseText = '';

    if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        // Gemini expects base64 without the prefix
        const base64Data = base64Image.split(',')[1];

        const payload = {
            contents: [{
                parts: [
                    { text: SYSTEM_PROMPT },
                    {
                        inline_data: {
                            mime_type: imageFile.type || 'image/jpeg',
                            data: base64Data
                        }
                    }
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
        // OpenAI / Custom
        const url = `${baseUrl}/chat/completions`;

        // OpenAI handles full data URI
        const payload = {
            model: model,
            messages: [
                {
                    role: "system",
                    content: SYSTEM_PROMPT
                },
                {
                    role: "user",
                    content: [
                        { type: "image_url", image_url: { url: base64Image } }
                    ]
                }
            ],
            max_tokens: 500
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
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

    // Clean Markdown
    const cleanJson = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

    try {
        return JSON.parse(cleanJson);
    } catch {
        console.error('Failed to parse AI response:', responseText);
        throw new Error('AI returned invalid JSON');
    }
  }
};
