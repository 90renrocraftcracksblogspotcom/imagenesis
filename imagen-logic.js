document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const promptInput = document.getElementById('prompt'), negativePromptInput = document.getElementById('negative-prompt'),
          modelSelect = document.getElementById('model'), modelExplanation = document.getElementById('model-explanation'),
          resolutionSlider = document.getElementById('resolution-slider'), resolutionOutput = document.getElementById('resolution-output'), 
          seedInput = document.getElementById('seed'), randomSeedBtn = document.getElementById('random-seed'), 
          noLogoCheckbox = document.getElementById('nologo'), safeCheckbox = document.getElementById('safe'), 
          generateBtn = document.getElementById('generate-btn'), previewImage = document.getElementById('preview-image'), 
          placeholderText = document.getElementById('placeholder-text'), loadingIndicator = document.getElementById('loading'), 
          imageInfo = document.getElementById('image-info'), imageDetails = document.getElementById('image-details'), 
          imageActions = document.getElementById('image-actions'), downloadBtn = document.getElementById('download-btn'), 
          copyPromptBtn = document.getElementById('copy-prompt-btn'), historyContainer = document.getElementById('history-container'), 
          emptyHistory = document.getElementById('empty-history'), clearHistoryBtn = document.getElementById('clear-history-btn'), 
          notification = document.getElementById('notification');
    
    // --- DATA AND CONFIG ---
    const resolutions = [
        { name: "Mobile Portrait", width: 720, height: 1280 }, { name: "Mobile Landscape", width: 1280, height: 720 },
        { name: "Square", width: 1024, height: 1024 }, { name: "Portrait (4:5)", width: 1080, height: 1350 },
        { name: "Widescreen (16:9)", width: 1920, height: 1080 }, { name: "Desktop", width: 1920, height: 1200 },
        { name: "YouTube Thumbnail", width: 1280, height: 720 }, { name: "Ultra-Wide", width: 2560, height: 1080 }
    ];

    const modelDescriptions = {
        'flux': "<b>Flux:</b> A powerful, universal model from Stability AI. Great for a wide variety of high-quality image styles.",
        'dall-e-3': "<b>DALL-E 3:</b> OpenAI's model. Excels at understanding complex prompts and generating creative, detailed images.",
        'sdxl': "<b>Stable Diffusion XL:</b> A robust base model known for photorealism and coherent compositions.",
        'turbo': "<b>Turbo:</b> <span class='nsfw'>Fastest model, suitable for NSFW content.</span> Generation is very quick. For best results, ensure 'Safety Mode' is unchecked.",
        'playground-v2': "<b>Playground v2:</b> Great for aesthetic styles with vibrant colors and artistic flair.",
        'default': "A general-purpose model suitable for most standard image generation tasks."
    };

    // Fallback models in case remote fetch fails
    const fallbackModels = [
        { value: 'flux', label: 'Flux' },
        { value: 'sdxl', label: 'Stable Diffusion XL' },
        { value: 'turbo', label: 'Turbo' },
        { value: 'playground-v2', label: 'Playground v2' },
        { value: 'dall-e-3', label: 'DALL-E 3' }
    ];

    // --- CORE FUNCTIONS ---
    function updateResolutionOutput() {
        const selectedRes = resolutions[resolutionSlider.value];
        resolutionOutput.textContent = `${selectedRes.name} (${selectedRes.width}x${selectedRes.height})`;
    }

    function updateModelExplanation() {
        if (!modelExplanation) return;
        const selectedModel = modelSelect.value;
        modelExplanation.innerHTML = modelDescriptions[selectedModel] || modelDescriptions['default'];
    }

    function populateModelsFromArray(list) {
        modelSelect.innerHTML = '';
        list.forEach(m => {
            const option = document.createElement('option');
            option.value = m.value;
            option.textContent = m.label || m.value;
            modelSelect.appendChild(option);
        });
        const hasFlux = list.some(m => String(m.value).toLowerCase() === 'flux');
        if (hasFlux) modelSelect.value = 'flux';
        updateModelExplanation();
    }

    async function fetchModels() {
        // Immediately show a usable fallback list to avoid empty dropdown
        populateModelsFromArray(fallbackModels);
        try {
            // Use the direct endpoint from index_old.html with a short timeout
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const response = await fetch('https://image.pollinations.ai/models', { signal: controller.signal });
            clearTimeout(timeout);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const models = await response.json();

            // Normalize into array of {value,label}
            let normalized = [];
            if (Array.isArray(models)) {
                normalized = models.map(m => ({
                    value: m.id || m.key || m.name || String(m),
                    label: m.name || m.title || (m.id || m.key || String(m))
                }));
            } else if (models && typeof models === 'object') {
                normalized = Object.keys(models).map(key => ({
                    value: key,
                    label: (models[key] && (models[key].name || models[key].title)) || key
                }));
            }

            if (normalized.length === 0) {
                console.warn('Models response empty, using fallback list');
                populateModelsFromArray(fallbackModels);
            } else {
                populateModelsFromArray(normalized);
            }
        } catch (error) {
            console.error("Could not fetch AI models:", error);
            showNotification("Could not fetch AI models. Using defaults.", 'error');
            populateModelsFromArray(fallbackModels);
        }
    }

    function generateImage() {
        const prompt = promptInput.value.trim();
        if (!prompt) {
            showNotification("Please enter a prompt.", 'error');
            return;
        }

        loadingIndicator.style.display = 'flex';
        previewImage.style.display = 'none';
        placeholderText.style.display = 'none';
        imageActions.style.display = 'none';
        imageInfo.style.display = 'none';

        const selectedRes = resolutions[resolutionSlider.value];
        const params = new URLSearchParams({
            prompt: prompt,
            negative_prompt: negativePromptInput.value.trim(),
            model: modelSelect.value,
            width: selectedRes.width,
            height: selectedRes.height,
            seed: seedInput.value,
            nologo: noLogoCheckbox.checked,
            safe: safeCheckbox.checked,
        });

        // Build direct image URL as used in index_old.html
        const baseUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
        const query = new URLSearchParams({
            width: String(selectedRes.width),
            height: String(selectedRes.height),
            seed: String(seedInput.value),
            model: modelSelect.value,
            token: 'ImavcR8ePwOIEkXh'
        });
        // Try to pass through optional params if supported
        const neg = negativePromptInput.value.trim();
        if (neg) query.set('negative_prompt', neg);
        if (noLogoCheckbox.checked) query.set('nologo', 'true');
        if (safeCheckbox.checked) query.set('safe', 'true');

        const imageUrl = `${baseUrl}?${query.toString()}`;
        
        previewImage.src = imageUrl;
        previewImage.onload = () => {
            loadingIndicator.style.display = 'none';
            previewImage.style.display = 'block';
            imageActions.style.display = 'flex';
            imageInfo.style.display = 'block';
            
            const details = {
                Prompt: prompt,
                NegativePrompt: negativePromptInput.value.trim(),
                Model: modelSelect.value,
                Resolution: `${selectedRes.width}x${selectedRes.height}`,
                Seed: seedInput.value,
                Timestamp: new Date().toLocaleString()
            };
            imageDetails.textContent = JSON.stringify(details, null, 2);
            
            saveToHistory(imageUrl, details);
            showNotification("Image generated successfully!", 'success');
        };
        previewImage.onerror = () => {
            loadingIndicator.style.display = 'none';
            placeholderText.style.display = 'block';
            placeholderText.textContent = "Error generating image. Please try again.";
            showNotification("Error generating image. The model might be busy.", 'error');
        };
    }

    function saveToHistory(imageUrl, details) {
        let history = JSON.parse(localStorage.getItem('ai-image-history')) || [];
        history.unshift({ imageUrl, details }); // Add to the beginning
        if (history.length > 20) history.pop(); // Limit history size
        localStorage.setItem('ai-image-history', JSON.stringify(history));
        renderHistory();
    }

    function renderHistory() {
        historyContainer.innerHTML = '';
        const history = JSON.parse(localStorage.getItem('ai-image-history')) || [];

        if (history.length === 0) {
            emptyHistory.style.display = 'block';
        } else {
            emptyHistory.style.display = 'none';
            history.forEach(item => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.innerHTML = `
                    <img src="${item.imageUrl}" alt="Generated image">
                    <div class="history-item-info">
                        <div class="history-item-prompt">${item.details.Prompt}</div>
                        <div class="history-item-model">${item.details.Model}</div>
                    </div>
                `;
                historyItem.addEventListener('click', () => loadFromHistory(item));
                historyContainer.appendChild(historyItem);
            });
        }
    }

    function loadFromHistory(item) {
        promptInput.value = item.details.Prompt;
        negativePromptInput.value = item.details.NegativePrompt || '';
        modelSelect.value = item.details.Model;
        seedInput.value = item.details.Seed;
        
        previewImage.src = item.imageUrl;
        previewImage.style.display = 'block';
        placeholderText.style.display = 'none';
        imageActions.style.display = 'flex';
        imageInfo.style.display = 'block';
        imageDetails.textContent = JSON.stringify(item.details, null, 2);
        
        window.scrollTo(0, 0); // Scroll to top
    }

    function clearHistory() {
        if (confirm("Are you sure you want to clear all history? This cannot be undone.")) {
            localStorage.removeItem('ai-image-history');
            renderHistory();
            showNotification("History cleared.", 'success');
        }
    }

    function showNotification(message, type = 'success') {
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // --- EVENT LISTENERS ---
    resolutionSlider.addEventListener('input', updateResolutionOutput);
    modelSelect.addEventListener('change', updateModelExplanation);
    randomSeedBtn.addEventListener('click', () => {
        seedInput.value = Math.floor(Math.random() * 1000000000);
    });
    generateBtn.addEventListener('click', generateImage);
    clearHistoryBtn.addEventListener('click', clearHistory);

    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = previewImage.src;
        link.download = `ai_image_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    copyPromptBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(promptInput.value).then(() => {
            showNotification("Prompt copied to clipboard!", 'success');
        }, () => {
            showNotification("Failed to copy prompt.", 'error');
        });
    });

    // --- INITIALIZATION ---
    function initialize() {
        updateResolutionOutput();
        fetchModels();
        renderHistory();
        // Hide notification on start
        if (notification) notification.classList.remove('show');
    }

    initialize();
});
