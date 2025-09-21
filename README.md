# WhatADay 🎙️

Transform your voice recordings into engaging social media content with AI-powered intelligence.

## 🚀 Features

- **Voice Recording**: Record audio/video with live playback
- **AI Transcription**: High-accuracy transcription using Google AI/Gemini
- **Content Generation**: Export to multiple social media formats:
  - Twitter (140 characters)
  - Twitlonger (unlimited)
  - YouTube scripts
  - TikTok scripts with shot lists
  - Blog posts with image placeholders
- **File Lifecycle Management**: Automatic cleanup with 7-day retention
- **Subscription Tiers**: Free, Creator, and Pro plans
- **Dark Mode**: Beautiful light/dark theme support
- **Responsive Design**: Works on desktop and mobile

## 🏗️ Architecture

### Frontend (Next.js)
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom dark mode
- **Authentication**: Clerk
- **State Management**: React Context + Zustand
- **UI Components**: Custom components with Lucide icons

### Backend (Node.js)
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Authentication**: Clerk integration
- **Database**: Supabase (PostgreSQL)
- **AI Service**: Google AI/Gemini
- **File Storage**: Local storage with lifecycle management
- **Testing**: Vitest with 90%+ coverage

### Database (Supabase)
- **Users**: Clerk integration
- **Recordings**: Audio/video file metadata
- **Transcriptions**: AI-generated text with confidence scores
- **Exports**: Generated content for different platforms
- **Subscriptions**: Stripe integration
- **File Lifecycle**: Automatic cleanup management

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Add your environment variables
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp env.local.example .env.local
# Add your environment variables
npm run dev
```

### Environment Variables

#### Backend (.env)
```env
PORT=3001
CLERK_SECRET_KEY=your_clerk_secret_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GOOGLE_AI_API_KEY=your_google_ai_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

## 🚀 Deployment

### Netlify (Frontend)
1. Connect your GitHub repository to Netlify
2. Set build command: `cd frontend && npm run build`
3. Set publish directory: `frontend/out`
4. Add environment variables in Netlify dashboard
5. Deploy!

### Backend Deployment Options
- **Vercel**: Serverless functions
- **Railway**: Full-stack deployment
- **Heroku**: Traditional hosting
- **DigitalOcean**: VPS deployment

### Database Setup
1. Create Supabase project
2. Run database migrations:
   ```sql
   -- Run database/file-lifecycle-schema.sql
   -- Run database/migrations/001_add_file_lifecycle_fields.sql
   ```

## 📱 Usage

1. **Sign Up**: Create account with Clerk authentication
2. **Record**: Use the recording interface to capture audio/video
3. **Transcribe**: AI automatically transcribes your content
4. **Export**: Generate content for your preferred social media platform
5. **Manage**: Track usage and manage subscriptions

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📊 API Endpoints

### Recordings
- `GET /api/recordings` - List user recordings
- `POST /api/recordings` - Upload new recording
- `DELETE /api/recordings/:id` - Delete recording
- `POST /api/recordings/:id/transcribe` - Start transcription

### Transcriptions
- `GET /api/transcriptions` - List user transcriptions
- `GET /api/transcriptions/:id` - Get specific transcription

### Exports
- `GET /api/exports` - List user exports
- `POST /api/exports` - Generate new export
- `DELETE /api/exports/:id` - Delete export

### Subscriptions
- `GET /api/subscriptions` - Get subscription info
- `POST /api/subscriptions` - Create/update subscription
- `DELETE /api/subscriptions` - Cancel subscription

### Usage
- `GET /api/usage` - Get usage statistics

### File Lifecycle
- `GET /api/recordings/:id/lifecycle` - Get file lifecycle info
- `DELETE /api/recordings/:id/delete-file` - Delete file

## 🔧 Configuration

### Subscription Tiers
- **Free**: 1 recording/day, 1 transcription/day, 1 export/day
- **Creator**: 10 recordings/day, 10 transcriptions/day, 10 exports/day
- **Pro**: Unlimited usage

### File Lifecycle
- **Retention**: 7 days from upload
- **Cleanup**: Automatic deletion after successful transcription
- **Retry**: Failed transcriptions can be retried (doesn't extend retention)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@whataday.app or create an issue on GitHub.

---

Built with ❤️ using Next.js, Node.js, Supabase, and Google AI.
