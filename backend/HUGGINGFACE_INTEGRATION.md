# Hugging Face Integration

This document describes the Hugging Face models integration that replaces the previous OpenAI dependency with free, open-source models.

## Overview

The application now uses Hugging Face Transformers library with several free models to provide:

- **Intent Classification**: Understanding user intents using zero-shot classification
- **Sentiment Analysis**: Analyzing emotional context of messages
- **Text Generation**: Generating contextual responses
- **Multilingual Support**: Supporting both English and Persian languages

## Models Used

### Primary Models
- **Intent Classification**: `facebook/bart-large-mnli` (Zero-shot classification)
- **Sentiment Analysis**: `cardiffnlp/twitter-roberta-base-sentiment-latest`
- **Text Generation**: `gpt2` for English text generation
- **Conversational**: `microsoft/DialoGPT-small` (fallback)

### Fallback Models
- **Basic Sentiment**: `distilbert-base-uncased-finetuned-sst-2-english`
- **Basic Generation**: `distilgpt2`

## Configuration

### Environment Variables (.env)
```env
HUGGINGFACE_API_KEY=your_hf_token_here
HF_CACHE_DIR=./models_cache
```

### Features

1. **Automatic Model Loading**: Models are downloaded and cached locally on first use
2. **Fallback System**: If advanced models fail, basic models are used automatically
3. **GPU Support**: Automatically uses GPU if available, falls back to CPU
4. **Persian Language Support**: Includes Persian response templates and multilingual intent detection
5. **Context Awareness**: Maintains conversation history for better responses

## API Compatibility

The integration maintains full compatibility with the existing API:

- `understand_intent(text)` - Analyzes user intent
- `generate_response(intent_data, user_text)` - Generates appropriate responses
- `is_ready()` - Check if models are loaded and ready

## Performance

- **First Run**: Models download automatically (may take a few minutes)
- **Subsequent Runs**: Models load from cache (much faster)
- **Memory Usage**: Approximately 1-2GB RAM for all models
- **Response Time**: 100-500ms per request depending on model complexity

## Supported Intents

- `greeting` - Greetings in Persian and English
- `thanks` - Thank you messages
- `goodbye` - Farewell messages
- `request_help` - Help requests
- `weather_inquiry` - Weather-related questions
- `question` - General questions
- `general_conversation` - Default conversation
- `complaint` - Complaint handling
- `compliment` - Compliment responses

## Error Handling

The system includes comprehensive error handling:

1. **Model Loading Failures**: Falls back to rule-based responses
2. **Network Issues**: Uses cached models when available
3. **Memory Constraints**: Automatically selects smaller models if needed
4. **API Errors**: Graceful degradation to basic functionality

## Benefits Over OpenAI

1. **Cost**: Completely free to use
2. **Privacy**: All processing happens locally
3. **Availability**: No API rate limits or downtime
4. **Customization**: Models can be fine-tuned for specific use cases
5. **Offline Capability**: Works without internet after initial model download

## Installation

Models are automatically installed when running the application. Ensure you have:

```bash
pip install transformers>=4.35.0 huggingface-hub>=0.19.4 torch>=2.5.0
```

## Usage Example

```python
from services.ai_models import AIModels

ai_models = AIModels()
await ai_models.load_models()

# Understand intent
intent = await ai_models.understand_intent("سلام! چطوری؟")
# Output: {"intent": "greeting", "confidence": 0.9}

# Generate response
response = await ai_models.generate_response(intent, "سلام! چطوری؟")
# Output: "سلام عزیز! چه خبر؟"
```

## Monitoring

Check model status:
```python
model_info = await ai_models.get_model_info()
print(model_info)
```

This will show loaded models, device usage, and cache directory information.