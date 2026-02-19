# Reel Meme 🎬

Turn your photos into viral, high-impact vertical memes for Instagram and Facebook Reels.

## Tech Stack
- React 19 + TypeScript + Vite
- Google Gemini AI (captions & song suggestions)
- Supabase (Auth, Storage, Database)

## Setup with Claude Code

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Edit `.env.local` and add your keys:
```
GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=https://kmintpxvvajaqedaaxot.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run the app
```bash
npm run dev
```
App runs at http://localhost:3000

### 4. Deploy to Vercel
```bash
npx vercel
```

## Supabase Setup (already done)
- ✅ `memes` table created
- ✅ `meme-assets` storage bucket
- ✅ Google OAuth provider enabled
- ✅ Row Level Security policies

## Project Structure
```
reelmeme/
├── .env.local          # API keys (never commit this)
├── index.html          # Entry HTML
├── index.tsx           # React entry point
├── App.tsx             # Main app component
├── types.ts            # TypeScript types
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript config
├── package.json        # Dependencies
├── services/
│   ├── gemini.ts       # Gemini AI integration
│   ├── supabase.ts     # Supabase client
│   ├── imageService.ts # Image upload & base64
│   ├── memeRenderer.ts # Canvas meme rendering
│   └── statsService.ts # Local stats tracking
```
