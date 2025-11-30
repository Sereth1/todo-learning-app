#!/bin/bash

# Quick Start Script for Mobile App
# Run this to test the app!

echo "🚀 Starting Wedding Planner Mobile App..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this from the mobile-app directory"
    echo "   cd mobile-app"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies first..."
    npm install
fi

echo "✅ Dependencies ready!"
echo ""
echo "Starting Expo dev server..."
echo ""
echo "📱 Once it starts, you can:"
echo "   • Press 'w' to open in web browser (easiest to test)"
echo "   • Press 'a' to open on Android emulator"
echo "   • Press 'i' to open on iOS simulator"
echo "   • Scan QR code with Expo Go app on your phone"
echo ""
echo "⚠️  IMPORTANT: Make sure Django backend is running!"
echo "   In another terminal: python manage.py runserver"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npx expo start
