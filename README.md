# 🏛️ Persian AI Chatbot - Modern Full-Stack Application

A stunning Persian AI chatbot with cutting-edge UI using Next.js 14 and FastAPI backend. Features real-time audio processing, beautiful animations, and production-ready deployment.

## 🚀 Features

### Frontend (Next.js 14)
- **Modern UI/UX**: Stunning interface with Framer Motion animations
- **Real-time Audio**: Web Audio API integration with voice visualizer
- **Persian RTL Support**: Beautiful Persian typography with Vazir font
- **Responsive Design**: Mobile-first approach with touch gestures
- **WebSocket Communication**: Real-time bidirectional communication

### Backend (FastAPI)
- **Audio Processing**: Advanced pipeline with FFmpeg and Whisper
- **Persian AI**: Intent understanding and response generation
- **WebSocket Server**: Real-time message handling
- **Async Architecture**: High-performance async/await patterns
- **Production Ready**: Comprehensive error handling and logging

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14 with App Router
- React 18 + TypeScript
- Tailwind CSS + Framer Motion
- Lucide React Icons
- Web Audio API

**Backend:**
- FastAPI + Python 3.11
- WebSockets for real-time communication
- Whisper for speech recognition
- PyTorch + Transformers
- FFmpeg for audio processing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- FFmpeg

### Development Setup

1. **Clone and setup:**
```bash
git clone <repository>
cd persian-ai-chatbot
```

2. **Frontend setup:**
```bash
cd frontend
npm install
npm run dev
```

3. **Backend setup:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

4. **Docker setup (optional):**
```bash
docker-compose up --build
```

### Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🎯 Usage

1. **Voice Chat**: Click the microphone button to start recording
2. **Real-time Processing**: Watch the voice visualizer during recording
3. **AI Response**: Receive intelligent Persian responses with audio
4. **Text Chat**: Type messages for text-based conversation

## 🏗️ Architecture

```
persian-ai-chatbot/
├── frontend/                 # Next.js 14 App
│   ├── app/                 # App Router pages
│   ├── components/          # React components
│   ├── hooks/              # Custom hooks
│   └── services/           # API clients
├── backend/                # FastAPI App
│   ├── main.py            # FastAPI server
│   ├── services/          # AI & Audio services
│   └── websocket/         # WebSocket handlers
└── docker-compose.yml     # Development setup
```

## 🔧 Configuration

### Environment Variables

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend (.env):**
```env
PYTHONPATH=/app
PYTHONUNBUFFERED=1
```

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy to Vercel
```

### Backend (Railway/Heroku)
```bash
cd backend
# Deploy to Railway or Heroku
```

## 🎨 Customization

### Adding New Intents
Edit `backend/services/ai_models.py`:
```python
self.responses = {
    "your_intent": [
        "Your Persian response 1",
        "Your Persian response 2"
    ]
}
```

### Styling
Modify `frontend/app/globals.css` and Tailwind classes.

### Audio Processing
Enhance `backend/services/audio_processor.py` for better audio quality.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Whisper by OpenAI for speech recognition
- Framer Motion for animations
- Vazir font for Persian typography
- FastAPI for the amazing Python framework

---

**Built with ❤️ for the Persian AI community**