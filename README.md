# 🗣️ Persian Voice Chatbot - Browser Edition

A completely **FREE** Persian voice chatbot that runs entirely in your browser! No servers, no API keys, no costs - just pure client-side magic! ✨

## 🌟 What Makes This Special?

- **🆓 100% FREE**: No OpenAI API costs, no server expenses
- **🔒 Privacy First**: Your conversations never leave your browser
- **⚡ Lightning Fast**: No network delays, instant responses
- **🌐 Works Offline**: No internet connection required after loading
- **🚫 No Limits**: Chat as much as you want, no rate limits
- **🎯 Persian Native**: Built specifically for Persian language

## 🚀 Features

### 🎤 Voice Recognition
- **Web Speech API** for Persian speech-to-text
- Real-time voice recognition
- High accuracy for Persian language
- Works with any microphone

### 🧠 Intelligent Responses
- **Client-side AI** processing
- Persian emotion detection
- Context-aware conversations
- Smart intent recognition

### 🔊 Natural Speech
- **Browser TTS** for Persian text-to-speech
- Emotional voice responses
- Multiple voice options
- Adjustable speech parameters

## 🎯 Quick Start

### 1. Install Dependencies
```bash
npm install
# or
yarn install
```

### 2. Run the Application
```bash
npm run dev
# or
yarn dev
```

### 3. Open in Browser
Visit `http://localhost:3000` in a modern browser (Chrome, Edge, Safari, Firefox)

### 4. Grant Microphone Permission
Click "Allow" when prompted for microphone access

### 5. Start Talking!
Click the microphone button and start speaking in Persian! 🎤

## 🌐 Browser Compatibility

| Browser | Speech Recognition | Speech Synthesis | Status |
|---------|-------------------|------------------|---------|
| Chrome  | ✅ Excellent       | ✅ Excellent      | ✅ Fully Supported |
| Edge    | ✅ Excellent       | ✅ Excellent      | ✅ Fully Supported |
| Safari  | ✅ Good           | ✅ Good          | ✅ Supported |
| Firefox | ⚠️ Limited        | ✅ Good          | ⚠️ Partial Support |

**Recommendation**: Use Chrome or Edge for the best experience!

## 🎛️ Configuration

Copy `.env.example` to `.env.local` and customize:

```bash
# Persian Language Settings
NEXT_PUBLIC_SPEECH_LANG=fa-IR
NEXT_PUBLIC_TTS_RATE=0.8
NEXT_PUBLIC_TTS_PITCH=1.0

# Performance Settings
NEXT_PUBLIC_MIN_CONFIDENCE_THRESHOLD=0.3
NEXT_PUBLIC_MAX_CONVERSATION_HISTORY=10

# Feature Toggles
NEXT_PUBLIC_ENABLE_SPEECH_RECOGNITION=true
NEXT_PUBLIC_ENABLE_SPEECH_SYNTHESIS=true
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=true
```

## 🗨️ Persian Conversation Examples

The chatbot understands various Persian intents:

### Greetings
- "سلام" → "سلام! خوش اومدی!"
- "صبح بخیر" → "صبح شما هم بخیر!"

### Questions
- "حالت چطوره؟" → "عالیم! تو چطوری؟"
- "اسمت چیه؟" → "من ربات گفتگوی فارسی هستم!"

### Requests
- "یه جک بگو" → "چرا کامپیوتر به دکتر رفت؟..."
- "قصه بگو" → "یه روزی یه ربات کوچولو..."

### Time & Weather
- "ساعت چنده؟" → Shows current time
- "هوا چطوره؟" → Weather-related responses

## 🔧 How It Works

### Architecture
```
Browser (Client-Side Only)
├── Web Speech API (STT)
├── Speech Synthesis API (TTS)
├── Persian Language Processing
├── Intent Recognition
├── Emotion Detection
└── Response Generation
```

### No Backend Required!
- **Speech-to-Text**: Web Speech API with Persian language support
- **AI Processing**: Client-side rule-based system with Persian patterns
- **Text-to-Speech**: Browser's built-in Speech Synthesis API
- **Storage**: Browser's local storage for conversation history

## 🛠️ Development

### Project Structure
```
frontend/
├── app/                    # Next.js 13+ app directory
│   ├── page.tsx           # Main chat interface
│   └── layout.tsx         # App layout
├── components/            # React components
│   ├── VoiceOnlyRecorder.tsx  # Main voice recorder
│   └── VoiceVisualizer.tsx    # Voice visualization
├── hooks/                 # Custom React hooks
│   ├── useSpeechRecognition.ts  # Web Speech API hook
│   ├── useSpeechSynthesis.ts    # TTS API hook
│   └── usePersianChatbot.ts     # Persian AI logic
└── styles/               # Styling files
```

### Key Technologies
- **Next.js 13+**: React framework with app directory
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **Web Speech API**: Browser speech recognition
- **Speech Synthesis API**: Browser text-to-speech

### Development Commands
```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🚀 Deployment

Since this is a client-side application, you can deploy it anywhere:

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
# Upload the 'out' folder to Netlify
```

### Static Hosting
```bash
npm run build
# Upload the 'out' folder to any static host
```

## 🎨 Customization

### Adding New Persian Responses
Edit `hooks/usePersianChatbot.ts`:

```typescript
const responses = {
  greeting: [
    'سلام! خوش اومدی!',
    'درود بر تو!',
    // Add more greetings...
  ]
};
```

### Adjusting Speech Parameters
Modify the TTS settings:

```typescript
const { speak } = useSpeechSynthesis({
  rate: 0.8,    // Speech speed (0.1 - 10)
  pitch: 1.0,   // Voice pitch (0 - 2)
  volume: 1.0   // Volume (0 - 1)
});
```

### Customizing Voice Recognition
Update recognition settings:

```typescript
const { startListening } = useSpeechRecognition({
  lang: 'fa-IR',           // Persian language
  continuous: false,       // Single phrase mode
  interimResults: false    // Final results only
});
```

## 🐛 Troubleshooting

### Microphone Not Working
1. Check browser permissions
2. Ensure HTTPS (required for microphone access)
3. Try refreshing the page
4. Check if microphone is working in other apps

### Speech Recognition Issues
1. Speak clearly and at normal pace
2. Ensure good microphone quality
3. Try using Chrome or Edge
4. Check if Persian language is supported

### No Voice Output
1. Check system volume
2. Ensure speakers/headphones are working
3. Try different browsers
4. Check if Speech Synthesis API is supported

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Areas for Contribution
- 🌍 More Persian language patterns
- 🎭 Better emotion detection
- 🗣️ Voice customization options
- 🎨 UI/UX improvements
- 🧪 Browser compatibility testing

## 📄 License

MIT License - feel free to use this project for any purpose!

## 🙏 Acknowledgments

- **Web Speech API** for making voice recognition possible
- **Speech Synthesis API** for browser-based TTS
- **Persian Language Community** for inspiration
- **Open Source Contributors** who make projects like this possible

---

**🎉 Enjoy your free Persian voice chatbot!**

No servers to maintain, no API bills to pay, just pure conversational joy! 🗣️✨