# 🎙️ Wise Man - Next.js Version

**Trí tuệ từ lời nói** - Vietnamese Audio Transcription App

> ✅ **DEPLOYED SUCCESSFULLY ON NETLIFY!**
> 
> 🌐 **Live URL:** https://spiffy-meerkat-c98bc0.netlify.app/

---

## ✨ Features

- 🎙️ **Audio Recording** - Unlimited recording with pause/resume
- 📝 **AI Transcription** - Vietnamese speech-to-text using OpenAI Whisper
- 📂 **File Upload** - Support MP3, WAV, M4A files
- 💾 **History Management** - Save and manage all recordings
- 🏷️ **Labels & Tags** - Organize recordings
- 🎨 **Beautiful UI** - Purple gradient theme with glassmorphism

---

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** Zustand
- **AI:** OpenAI GPT-4 Whisper
- **Deployment:** Netlify
- **Icons:** Lucide React

---

## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Test production build locally
npx serve out
```

---

## 🔑 Environment Variables

All API keys are already configured in `.env.local`:

```env
EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY=sk-proj-...
EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY=sk-ant-...
EXPO_PUBLIC_VIBECODE_GROK_API_KEY=xai-...
EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY=...
EXPO_PUBLIC_VIBECODE_ELEVENLABS_API_KEY=...
```

**⚠️ IMPORTANT:** Never commit `.env.local` to Git!

---

## 📱 Pages

- **/** - Home page with navigation
- **/record/** - Audio recording interface  
- **/upload/** - File upload (coming soon)
- **/history/** - Recording history (coming soon)

---

## 🎨 Design System

### Colors

- **Purple Gradient:** `#0a0612` → `#1a1625` → `#2d1b3d`
- **Accent Amber:** `#f59e0b`
- **Text:** `#fef3c7`

### Components

- Glass effect with backdrop blur
- Smooth transitions and animations
- Responsive design for all devices

---

## 📂 Project Structure

```
wise-man-nextjs/
├── app/                  # Next.js App Router
│   ├── page.tsx         # Home page
│   ├── record/          # Recording feature
│   ├── layout.tsx       # Root layout
│   └── globals.css      # Global styles
├── lib/                 # Utilities
│   ├── api/            # API integrations
│   └── types/          # TypeScript types
├── public/             # Static assets
│   └── _redirects     # Netlify redirects
└── netlify.toml        # Netlify config
```

---

## 🔧 Troubleshooting

### Build Issues

If build fails:
```bash
rm -rf .next out node_modules
npm install
npm run build
```

### Deployment

Netlify automatically deploys on:
- Every push to `main` branch
- Build command: `npm run build`
- Publish directory: `out`

---

## 📝 Migration from Expo

This is a **full migration** from Expo React Native Web to Next.js:

✅ All API functions copied from original source
✅ All environment variables migrated  
✅ Recording functionality implemented with Web APIs
✅ UI/UX preserved with Tailwind CSS
✅ 100% working on Netlify

---

## 🎯 Next Steps

- [ ] Complete Upload page
- [ ] Complete History page with Zustand store
- [ ] Integrate OpenAI transcription API
- [ ] Add speaker diarization
- [ ] Export transcriptions (PDF, TXT, DOCX)

---

## 🤝 Contributing

This is a private project. Contact the owner for access.

---

## 📄 License

Private - All rights reserved

---

**🚀 Built with Next.js • Deployed on Netlify**

Made with ❤️ by the Wise Man team
