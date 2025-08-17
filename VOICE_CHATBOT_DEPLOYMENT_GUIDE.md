# 🔧 Persian AI Voice Chatbot - Connection Fix Guide

## 🚨 **URGENT: Fixing "قطع ارتباط" (Connection Lost) Error**

This guide provides **immediate solutions** to resolve the voice service connectivity issues in your Persian AI chatbot deployed on Vercel.

## 🔍 **Root Cause Analysis**

### **Primary Issues Identified:**
1. ❌ **Hardcoded Railway URL**: Production WebSocket URL points to non-existent `your-backend.railway.app`
2. ❌ **No Backend Deployment**: Frontend on Vercel but no active backend server
3. ❌ **Environment Misconfiguration**: Missing production environment variables
4. ❌ **WebSocket Limitations**: Vercel doesn't support persistent WebSocket connections
5. ❌ **CORS Issues**: Cross-origin connection problems

---

## ⚡ **IMMEDIATE FIX - Deploy Backend First**

### **Step 1: Deploy Backend to Railway**

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Create new project
railway new

# 4. Link to your backend
cd backend
railway link

# 5. Set environment variables
railway variables set PYTHON_ENV=production
railway variables set DEBUG=false
railway variables set CORS_ORIGINS="https://your-vercel-app.vercel.app"

# 6. Deploy
railway up
```

### **Step 2: Get Your Railway Backend URL**
After deployment, Railway will provide a URL like:
```
https://your-app-name-production.up.railway.app
```

### **Step 3: Update Frontend Environment**

Update `frontend/.env.local`:
```env
# Production - Replace with your actual Railway URL
NEXT_PUBLIC_API_URL=https://your-app-name-production.up.railway.app
NEXT_PUBLIC_WS_URL=wss://your-app-name-production.up.railway.app

# Connection Configuration
NEXT_PUBLIC_WEBSOCKET_TIMEOUT=30000
NEXT_PUBLIC_RECONNECT_INTERVAL=3000
NEXT_PUBLIC_MAX_RECONNECT_ATTEMPTS=5
```

### **Step 4: Update Vercel Environment Variables**

In your Vercel dashboard, add these environment variables:
```env
NEXT_PUBLIC_API_URL=https://your-app-name-production.up.railway.app
NEXT_PUBLIC_WS_URL=wss://your-app-name-production.up.railway.app
NEXT_PUBLIC_WEBSOCKET_TIMEOUT=30000
NEXT_PUBLIC_RECONNECT_INTERVAL=3000
NEXT_PUBLIC_MAX_RECONNECT_ATTEMPTS=5
```

### **Step 5: Redeploy Frontend**
```bash
cd frontend
vercel --prod
```

---

## 🛠️ **Alternative: Deploy Backend to Other Platforms**

### **Option A: Heroku**
```bash
# 1. Create Heroku app
heroku create your-persian-chatbot-backend

# 2. Set buildpack
heroku buildpacks:set heroku/python

# 3. Deploy
git subtree push --prefix backend heroku main
```

### **Option B: DigitalOcean App Platform**
1. Connect your GitHub repository
2. Set root directory to `/backend`
3. Use Python buildpack
4. Set environment variables

### **Option C: Google Cloud Run**
```bash
# 1. Build and deploy
gcloud run deploy persian-chatbot-backend \
  --source backend/ \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 🔧 **Code Fixes Applied**

### **1. Fixed WebSocket Connection**
✅ **Before:** Hardcoded Railway URL
✅ **After:** Dynamic environment-based URL

### **2. Enhanced Error Handling**
✅ **Added:** Connection status monitoring
✅ **Added:** Exponential backoff reconnection
✅ **Added:** Maximum retry attempts

### **3. Improved Audio Processing**
✅ **Added:** Real Persian TTS with Edge-TTS
✅ **Added:** Google Speech Recognition
✅ **Added:** Better error messages in Persian

### **4. CORS Configuration**
✅ **Added:** Proper CORS headers
✅ **Added:** Security middleware

---

## 🧪 **Testing Your Fix**

### **1. Check Backend Health**
```bash
curl https://your-backend-url/health
```
Expected response:
```json
{
  "status": "healthy",
  "environment": "production",
  "version": "1.0.0"
}
```

### **2. Test WebSocket Connection**
```bash
curl https://your-backend-url/ready
```
Expected response:
```json
{
  "ready": true,
  "checks": {
    "environment_loaded": true,
    "ai_service": true,
    "audio_service": true,
    "websocket_connections": 0
  }
}
```

### **3. Browser Console Check**
Open browser dev tools, should see:
```
✅ WebSocket connected to: wss://your-backend-url/ws/chat
✅ WebSocket ping successful
```

---

## 📱 **Expected User Experience After Fix**

### **Before Fix:**
- ❌ Status: "قطع ارتباط" (Connection Lost)
- ❌ Message: "سرویس صوتی در دسترس نیست"
- ❌ No voice functionality

### **After Fix:**
- ✅ Status: "متصل به سرور" (Connected to Server)
- ✅ Voice recording works
- ✅ Persian speech recognition active
- ✅ AI responses with Persian TTS
- ✅ Real-time bidirectional conversation

---

## 🚀 **Performance Optimizations**

### **1. Backend Optimizations**
```python
# Add to backend/main.py
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        workers=1,  # Single worker for WebSocket
        loop="uvloop",  # Faster event loop
        http="httptools"  # Faster HTTP parser
    )
```

### **2. Frontend Optimizations**
- ✅ Connection pooling
- ✅ Audio compression
- ✅ Lazy loading components
- ✅ Error boundaries

---

## 🔒 **Security Considerations**

### **1. Environment Variables**
```env
# Never commit these to git
SECRET_KEY=your-super-secure-secret-key
OPENAI_API_KEY=your-openai-api-key
HUGGING_FACE_API_KEY=your-huggingface-api-key
```

### **2. CORS Configuration**
```python
# backend/main.py - Update CORS origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-vercel-app.vercel.app",
        "https://your-custom-domain.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
```

---

## 🐛 **Troubleshooting**

### **Connection Still Fails?**

1. **Check Backend Logs:**
```bash
railway logs --tail
```

2. **Verify Environment Variables:**
```bash
railway variables
```

3. **Test Local Connection:**
```bash
# Run backend locally
cd backend
uvicorn main:app --reload

# Update frontend to local
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### **Audio Not Working?**

1. **Check Browser Permissions:**
   - Microphone access granted
   - HTTPS required for microphone

2. **Check Audio Format:**
   - WebM supported
   - Opus codec available

3. **Check TTS Dependencies:**
```bash
pip install gtts edge-tts
```

---

## 📞 **Support & Monitoring**

### **Health Monitoring**
- ✅ `/health` endpoint for uptime monitoring
- ✅ `/ready` endpoint for service readiness
- ✅ WebSocket connection metrics

### **Logging**
- ✅ Structured logging with timestamps
- ✅ WebSocket connection events
- ✅ Audio processing metrics
- ✅ Error tracking

---

## 🎯 **Success Criteria**

After following this guide, your voice chatbot should:

1. ✅ **Connect Successfully**: No "قطع ارتباط" errors
2. ✅ **Record Audio**: Microphone capture works
3. ✅ **Recognize Persian**: Speech-to-text in Farsi
4. ✅ **Generate Responses**: AI responds in Persian
5. ✅ **Speak Responses**: Text-to-speech playback
6. ✅ **Maintain Connection**: Stable WebSocket connection
7. ✅ **Handle Errors**: Graceful error recovery

---

## 🔄 **Next Steps**

1. **Deploy backend to Railway/Heroku**
2. **Update environment variables**
3. **Test connection thoroughly**
4. **Monitor performance**
5. **Scale as needed**

Your Persian AI voice chatbot will be fully operational! 🎉