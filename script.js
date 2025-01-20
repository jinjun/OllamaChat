// Initialize chat history from localStorage
let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];

// Initialize questions history
const questionsList = document.getElementById('questionsList');
let questions = JSON.parse(localStorage.getItem('questions') || '[]');

// Update questions display
function updateQuestionsDisplay() {
    questionsList.innerHTML = '';
    questions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.textContent = question;
        questionDiv.addEventListener('click', () => {
            // Load the selected question into input
            document.getElementById('messageInput').value = question;
            document.getElementById('messageInput').focus();
        });
        questionsList.appendChild(questionDiv);
    });
}

// Add new question to history
function addQuestion(question) {
    // Remove if already exists
    questions = questions.filter(q => q !== question);
    // Add to beginning
    questions.unshift(question);
    // Keep only last 20 questions
    if (questions.length > 20) {
        questions = questions.slice(0, 20);
    }
    localStorage.setItem('questions', JSON.stringify(questions));
    updateQuestionsDisplay();
}

// Initialize questions display
updateQuestionsDisplay();

document.addEventListener('DOMContentLoaded', () => {
    // Constants
    const OLLAMA_API_PROXY = 'http://127.0.0.1:11435';
    const OLLAMA_API_MODEL = 'llama3.2-vision';
    
    // Speaker Setup
    const speakerButton = document.getElementById('speakerButton');
    let isSpeaking = false;
    let currentUtterance = null;

    if ('speechSynthesis' in window) {
        speakerButton.style.display = 'flex';
        
        speakerButton.addEventListener('click', () => {
            if (isSpeaking) {
                window.speechSynthesis.cancel();
                isSpeaking = false;
                speakerButton.classList.remove('active');
            } else {
                // Speak the last assistant message
                const lastMessage = document.querySelector('.assistant-message:last-child');
                if (lastMessage) {
                    const text = lastMessage.textContent || lastMessage.innerText;
                    currentUtterance = new SpeechSynthesisUtterance(text);
                    currentUtterance.rate = 1;
                    currentUtterance.pitch = 1;
                    currentUtterance.volume = 1;
                    
                    currentUtterance.onstart = () => {
                        isSpeaking = true;
                        speakerButton.classList.add('active');
                    };
                    
                    currentUtterance.onend = () => {
                        isSpeaking = false;
                        speakerButton.classList.remove('active');
                    };
                    
                    window.speechSynthesis.speak(currentUtterance);
                }
            }
        });
    } else {
        speakerButton.style.display = 'none';
    }

    // Speech Recognition Setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    const micButton = document.getElementById('micButton');
    
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        micButton.style.display = 'flex';
        let isListening = false;
        
    micButton.addEventListener('click', () => {
        if (!isListening) {
            recognition.start();
            isListening = true;
            micButton.classList.add('listening');
        } else {
            recognition.stop();
            isListening = false;
            micButton.classList.remove('listening');
        }
    });

    // Add keyboard shortcuts for mic and speaker buttons
    document.addEventListener('keydown', (e) => {
        // Spacebar for mic
        if (e.code === 'Space' && document.activeElement !== messageInput) {
            e.preventDefault();
            if (!isListening) {
                recognition.start();
                isListening = true;
                micButton.classList.add('listening');
            } else {
                recognition.stop();
                isListening = false;
                micButton.classList.remove('listening');
            }
        }
        // Ctrl+M for mic
        else if (e.ctrlKey && e.key === 'm' && document.activeElement !== messageInput) {
            e.preventDefault();
            micButton.click();
        }
        // Ctrl+S for speaker
        else if (e.ctrlKey && e.key === 's' && document.activeElement !== messageInput) {
            e.preventDefault();
            speakerButton.click();
        }
    });
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const messageInput = document.getElementById('messageInput');
            messageInput.value = transcript;
            messageInput.focus();
            
            // Automatically send the message
            sendMessage();
            
            // Reset mic button state
            isListening = false;
            micButton.classList.remove('listening');
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            appendMessage('system', `Speech recognition error: ${event.error}`);
        };
    } else {
        micButton.style.display = 'none';
    }
    
    // Initialize chat elements
    const chatHistoryElement = document.getElementById('chatHistory');
    const messageInput = document.getElementById('messageInput');
    const imageInput = document.getElementById('imageInput');
    const imageButton = document.getElementById('imageButton');
    const urlButton = document.getElementById('urlButton');
    const urlInput = document.getElementById('urlInput');
    const urlSubmit = document.getElementById('urlSubmit');
    const sendButton = document.getElementById('sendButton');
    const previewContainer = document.getElementById('imagePreview');
    let currentImageUrl = null;

    // Hide preview container initially
    previewContainer.style.display = 'none';

    // Add event listeners
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Image upload handling
    imageButton.addEventListener('click', () => imageInput.click());
    
    // URL Popup Handling
    const urlPopup = document.getElementById('urlPopup');
    const closeUrlPopup = document.getElementById('closeUrlPopup');
    const urlPopupForm = document.getElementById('urlPopupForm');
    const urlCancel = document.getElementById('urlCancel');
    const urlError = document.getElementById('urlError');

    // Show popup when URL button clicked
    urlButton.addEventListener('click', () => {
        urlPopup.style.display = 'block';
        urlInput.focus();
    });

    // Close popup when close button clicked
    closeUrlPopup.addEventListener('click', () => {
        urlPopup.style.display = 'none';
        urlInput.value = '';
        urlError.style.display = 'none';
    });

    // Close popup when cancel button clicked
    urlCancel.addEventListener('click', () => {
        urlPopup.style.display = 'none';
        urlInput.value = '';
        urlError.style.display = 'none';
    });

    // Settings Popup Handling
    const settingsPopup = document.getElementById('settingsPopup');
    const settingsButton = document.getElementById('settingsButton');
    const closeSettingsPopup = document.getElementById('closeSettingsPopup');
    const saveSettings = document.getElementById('saveSettings');
    const cancelSettings = document.getElementById('cancelSettings');
    const modelSelect = document.getElementById('modelSelect');

    // Show settings popup and load models
    settingsButton.addEventListener('click', async () => {
        settingsPopup.style.display = 'block';
        try {
            // Fetch available models
            const response = await fetch(OLLAMA_API_PROXY + '/api/tags');
            if (!response.ok) throw new Error('Failed to fetch models');
            
            const data = await response.json();
            const models = data.models || [];
            
            // Clear existing options
            modelSelect.innerHTML = '';
            
            // Add model options
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.name;
                option.textContent = model.name;
                modelSelect.appendChild(option);
            });
            
            // Select current model if set
            const currentModel = localStorage.getItem('selectedModel') || OLLAMA_API_MODEL;
            modelSelect.value = currentModel;
        } catch (error) {
            console.error('Error fetching models:', error);
            modelSelect.innerHTML = '<option value="">Error loading models</option>';
        }
    });

    // Close settings popup
    closeSettingsPopup.addEventListener('click', () => {
        settingsPopup.style.display = 'none';
    });

    // Save settings
    saveSettings.addEventListener('click', () => {
        const selectedModel = modelSelect.value;
        const temperature = parseFloat(document.getElementById('temperature').value);
        const topP = parseFloat(document.getElementById('topP').value);
        const maxTokens = parseInt(document.getElementById('maxTokens').value);
        const frequencyPenalty = parseFloat(document.getElementById('frequencyPenalty').value);
        const presencePenalty = parseFloat(document.getElementById('presencePenalty').value);

        if (selectedModel) {
            localStorage.setItem('selectedModel', selectedModel);
        }
        localStorage.setItem('temperature', temperature || 0.7);
        localStorage.setItem('topP', topP || 0.9);
        localStorage.setItem('maxTokens', maxTokens || 2048);
        localStorage.setItem('frequencyPenalty', frequencyPenalty || 0);
        localStorage.setItem('presencePenalty', presencePenalty || 0);
        
        settingsPopup.style.display = 'none';
    });

    // Load settings when popup opens
    settingsButton.addEventListener('click', () => {
        document.getElementById('temperature').value = localStorage.getItem('temperature') || 0.7;
        document.getElementById('topP').value = localStorage.getItem('topP') || 0.9;
        document.getElementById('maxTokens').value = localStorage.getItem('maxTokens') || 2048;
        document.getElementById('frequencyPenalty').value = localStorage.getItem('frequencyPenalty') || 0;
        document.getElementById('presencePenalty').value = localStorage.getItem('presencePenalty') || 0;
    });

    // Cancel settings changes
    cancelSettings.addEventListener('click', () => {
        settingsPopup.style.display = 'none';
    });

    // Close settings popup when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === settingsPopup) {
            settingsPopup.style.display = 'none';
        }
    });

    // Handle form submission
    urlPopupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleUrlImage();
    });

    // Handle Enter key in input
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleUrlImage();
        }
    });
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Clear any existing URL image
            currentImageUrl = null;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                previewContainer.innerHTML = '';
                previewContainer.style.display = 'block';
                previewContainer.className = 'image-preview-container';
                
                const img = document.createElement('img');
                img.src = event.target.result;
                previewContainer.appendChild(img);

                // Add click handler for zoom
                setupImageZoomHandler(img);
            };
            reader.readAsDataURL(file);
        }
    });

    async function handleUrlImage() {
        const url = urlInput.value.trim();
        if (!url) return;
        
        try {
            // Validate URL
            new URL(url);
            
            // Test image loading
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error('Failed to load image from URL'));
                img.src = url;
            });
            
            // Store valid URL and show preview
            currentImageUrl = url;
            previewContainer.innerHTML = '';
            previewContainer.style.display = 'block';
            previewContainer.className = 'image-preview-container';
            
            const previewImg = document.createElement('img');
            previewImg.src = url;
            previewContainer.appendChild(previewImg);
            setupImageZoomHandler(previewImg);
            
            // Hide popup and clear input
            urlPopup.style.display = 'none';
            urlInput.value = '';
            urlError.style.display = 'none';
        } catch (error) {
            urlError.textContent = error.message;
            urlError.style.display = 'block';
            currentImageUrl = null;
        }
    }

    async function sendMessage() {
        const message = messageInput.value.trim();
        
        if (!message && !currentImageUrl && !imageInput.files[0]) return;

        // Add question to history
        if (message) {
            addQuestion(message);
        }

        // Clear message input and preview display
        messageInput.value = '';
        previewContainer.innerHTML = '';
        previewContainer.style.display = 'none';
        
        // Display user message with image
        const userMessage = appendMessage('user', message);
        
        // Handle image display and submission
        if (currentImageUrl) {
            // Use URL image and clear any uploaded file
            const img = document.createElement('img');
            img.src = currentImageUrl;
            setupImageZoomHandler(img);
            userMessage.appendChild(img);
            imageInput.value = ''; // Clear any uploaded file
        } else if (imageInput.files[0]) {
            // Use uploaded image
            const imageFile = imageInput.files[0];
            const imgSrc = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => resolve(event.target.result);
                reader.readAsDataURL(imageFile);
            });
            
            const img = document.createElement('img');
            img.src = imgSrc;
            setupImageZoomHandler(img);
            userMessage.appendChild(img);
        }

        // Show waiting message
        const waitingMessage = document.createElement('div');
        waitingMessage.className = 'message loading-message';
        waitingMessage.innerHTML = `
            <div class="loading-dots">
                <span>.</span><span>.</span><span>.</span>
            </div>
        `;
        chatHistoryElement.appendChild(waitingMessage);
        chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight;

        try {
            // Prepare request data based on whether we have an image
            let requestData;
            let headers = {};
            
            if (currentImageUrl || imageInput.files[0]) {
                let base64Image;
                if (currentImageUrl) {
                    // Convert URL image to base64
                    const response = await fetch(currentImageUrl);
                    const blob = await response.blob();
                    base64Image = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            const fullData = reader.result;
                            resolve(fullData.split(',')[1]);
                        };
                        reader.readAsDataURL(blob);
                    });
                    // Clear any uploaded file when using URL image
                    imageInput.value = '';
                } else if (imageInput.files[0]) {
                    // Convert uploaded image to base64
                    const imageFile = imageInput.files[0];
                    base64Image = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            // Extract just the base64 portion after the comma
                            const fullData = reader.result;
                            resolve(fullData.split(',')[1]);
                        };
                        reader.readAsDataURL(imageFile);
                    });
                }

                // Check image size before submitting
                if (base64Image.length > 1024 * 1024) { // 1MB limit
                    throw new Error('Image is too large. Please try a smaller image.');
                }

                // Prepare JSON request with base64 image
                headers['Content-Type'] = 'application/json';
                requestData = JSON.stringify({
                    model: localStorage.getItem('selectedModel') || OLLAMA_API_MODEL,
                    prompt: message,
                    images: [base64Image],
                    stream: false,
                    options: {
                        temperature: parseFloat(localStorage.getItem('temperature')) || 0.7,
                        top_p: parseFloat(localStorage.getItem('topP')) || 0.9,
                        num_predict: parseInt(localStorage.getItem('maxTokens')) || 2048,
                        frequency_penalty: parseFloat(localStorage.getItem('frequencyPenalty')) || 0,
                        presence_penalty: parseFloat(localStorage.getItem('presencePenalty')) || 0
                    }
                });
            } else {
                // Use JSON for text-only requests
                headers['Content-Type'] = 'application/json';
                requestData = JSON.stringify({
                    model: localStorage.getItem('selectedModel') || OLLAMA_API_MODEL,
                    prompt: message,
                    stream: false,
                    options: {
                        temperature: parseFloat(localStorage.getItem('temperature')) || 0.7,
                        top_p: parseFloat(localStorage.getItem('topP')) || 0.9,
                        num_predict: parseInt(localStorage.getItem('maxTokens')) || 2048,
                        frequency_penalty: parseFloat(localStorage.getItem('frequencyPenalty')) || 0,
                        presence_penalty: parseFloat(localStorage.getItem('presencePenalty')) || 0
                    }
                });
            }

            // Always use /api/generate endpoint with streaming
            const response = await fetch(OLLAMA_API_PROXY + '/api/generate', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    ...JSON.parse(requestData),
                    stream: true
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
            }

            // Create streaming message container
            const messageDiv = document.createElement('div');
            let messageBuf = '';
            messageDiv.className = 'message assistant-message';
            chatHistoryElement.appendChild(messageDiv);
            chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight;

            // Remove waiting message now that streaming has started
            waitingMessage.remove();

            // Handle streaming response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // Decode and process chunks
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Save incomplete line for next chunk

                for (const line of lines) {
                    if (line.trim() === '') continue;
                    try {
                        const data = JSON.parse(line);
                        if (data.response) {
                            // Append new text to message
                            messageBuf += data.response;
                            
                            // Get model name and prepend to message
                            const modelName = localStorage.getItem('selectedModel') || OLLAMA_API_MODEL;

                            // Display buffered message with markdown conversion
                            messageDiv.innerHTML = `<span class="model-indicator">from ${modelName}</span> ${convertMarkdownToHTML(messageBuf)}`;
                            // Add streaming indicator on new line if not done
                            if (!done) {
                                const indicator = document.createElement('div');
                                indicator.className = 'streaming-indicator';
                                indicator.innerHTML = `
                                    <div class="loading-dots">
                                        <span>.</span><span>.</span><span>.</span>
                                    </div>
                                `;
                                messageDiv.appendChild(indicator);
                            }
                            
                            chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight;
                        }
                    } catch (error) {
                        console.error('Error parsing stream chunk:', error);
                    }
                }
            }

            // Finalize message with model name and markdown conversion
            const modelName = localStorage.getItem('selectedModel') || OLLAMA_API_MODEL;
            messageDiv.innerHTML = `<span class="model-indicator">from ${modelName}</span> ${convertMarkdownToHTML(messageBuf)}`;

        } catch (error) {
            console.error('Error:', error);
            let errorMessage = error.message;
            appendMessage('system', errorMessage);
        } finally {
            // Remove waiting message
            waitingMessage.remove();
            
            // Hide loading state
            const loadingIndicator = document.getElementById('loadingIndicator');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
            
            // Clear both image sources after successful request
            currentImageUrl = null;
            imageInput.value = '';
        }
    }

    // Utility functions
    function setupImageZoomHandler(img) {
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => {
            const modal = document.getElementById('imageModal');
            const modalImg = document.getElementById('modalImage');
            modalImg.src = img.src;
            modal.style.display = 'block';
            
            // Close modal when clicking outside or pressing escape
            const closeModal = () => {
                modal.style.display = 'none';
                document.removeEventListener('click', handleOutsideClick);
                document.removeEventListener('keydown', handleEscape);
            };
            
            const handleOutsideClick = (event) => {
                if (event.target === modal) {
                    closeModal();
                }
            };
            
            const handleEscape = (event) => {
                if (event.key === 'Escape') {
                    closeModal();
                }
            };
            
            document.querySelector('.close').onclick = closeModal;
            document.addEventListener('click', handleOutsideClick);
            document.addEventListener('keydown', handleEscape);
        });
    }

    function convertMarkdownToHTML(markdown) {
        return marked(markdown);
    }

    function appendMessage(role, content) {
        // Add loading indicator for assistant responses
        if (role === 'assistant') {
            const loadingDiv = document.createElement('div');
            loadingDiv.id = 'loadingIndicator';
            loadingDiv.className = 'message loading-message';
            loadingDiv.innerHTML = `
                <div class="loading-dots">
                    <span>.</span><span>.</span><span>.</span>
                </div>
            `;
            chatHistoryElement.appendChild(loadingDiv);
            chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight;
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;

        // Apply styles based on the role
        if (role === 'user') {
            messageDiv.textContent = content;
        } else if (role === 'assistant') {
            // Get model name from localStorage or use default
            const modelName = localStorage.getItem('selectedModel') || OLLAMA_API_MODEL;
            messageDiv.innerHTML = `from ${modelName}: ${convertMarkdownToHTML(content)}`;
        } else if (role === 'system') {
            messageDiv.textContent = content;
        }

        // Append to chat history
        chatHistoryElement.appendChild(messageDiv);
        chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight;
        return messageDiv;
    }
});
