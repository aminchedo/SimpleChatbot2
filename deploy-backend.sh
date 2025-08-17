#!/bin/bash

# Persian AI Chatbot - Backend Deployment Script
# This script deploys the backend to Railway and configures environment variables

set -e  # Exit on any error

echo "🚀 Deploying Persian AI Chatbot Backend to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    echo "🔑 Please login to Railway..."
    railway login
fi

# Navigate to backend directory
cd backend

# Check if project is linked
if [ ! -f ".railway/project.json" ]; then
    echo "🔗 Creating new Railway project..."
    railway new
fi

# Set environment variables
echo "⚙️ Setting environment variables..."
railway variables set PYTHON_ENV=production
railway variables set DEBUG=false
railway variables set HOST=0.0.0.0
railway variables set PORT=8000

# Set CORS origins (update this with your actual Vercel URL)
echo "🌐 Setting CORS configuration..."
read -p "Enter your Vercel app URL (e.g., https://your-app.vercel.app): " VERCEL_URL
if [ ! -z "$VERCEL_URL" ]; then
    railway variables set CORS_ORIGINS="$VERCEL_URL,https://localhost:3000"
fi

# Optional: Set API keys
echo "🔑 Setting up API keys (optional)..."
read -p "Enter OpenAI API key (press Enter to skip): " OPENAI_KEY
if [ ! -z "$OPENAI_KEY" ]; then
    railway variables set OPENAI_API_KEY="$OPENAI_KEY"
fi

read -p "Enter HuggingFace API key (press Enter to skip): " HF_KEY
if [ ! -z "$HF_KEY" ]; then
    railway variables set HUGGING_FACE_API_KEY="$HF_KEY"
fi

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

# Get the deployment URL
echo "🌐 Getting deployment URL..."
RAILWAY_URL=$(railway domain)

if [ ! -z "$RAILWAY_URL" ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo "🔗 Backend URL: $RAILWAY_URL"
    echo ""
    echo "📝 Next steps:"
    echo "1. Update your frontend environment variables:"
    echo "   NEXT_PUBLIC_API_URL=$RAILWAY_URL"
    echo "   NEXT_PUBLIC_WS_URL=${RAILWAY_URL/https/wss}"
    echo ""
    echo "2. Update Vercel environment variables with the same values"
    echo "3. Redeploy your frontend"
    echo ""
    echo "🧪 Test your backend:"
    echo "   curl $RAILWAY_URL/health"
    echo ""
else
    echo "⚠️ Could not get Railway URL. Check Railway dashboard for deployment status."
fi

echo "🎉 Deployment process complete!"