# AI Voice Cloner

A full-stack application for AI-powered voice cloning using Angular and NestJS with Node.js TTS.

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose
- Git

### Quick Install
```bash
git clone <repository-url>
cd ai-voice-cloner
cp .env.example .env
# Edit .env with your configuration
docker-compose up --build
```

### Access Application
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000

## Architecture

- **Frontend**: Angular 17 with TailwindCSS
- **Backend**: NestJS with JWT authentication, Stripe payments, and Node.js TTS
- **Database**: PostgreSQL
- **Cache**: Redis

## Features

- Upload voice samples for training
- Generate speech from text with custom voices
- Multiple language support
- Voice style selection
- Pay-per-minute and subscription billing
- JWT authentication
- Docker containerization

## Quick Start

1. **Clone and setup**:
   ```bash
   cd ai-voice-cloner
   cp .env.example .env
   # Edit .env with your API keys
   ```

2. **Start with Docker Compose**:
   ```bash
   docker-compose up --build
   ```

3. **Access the application**:
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:3000

## API Endpoints

### Backend (NestJS)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/train-voice` - Upload voice sample
- `POST /api/voice` - Generate voice from text
- `POST /api/pay` - Process payments



## Environment Variables

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

## Development

### Frontend Development
```bash
cd frontend
npm install
ng serve
```

### Backend Development
```bash
cd backend
npm install
npm run start:dev
```



## Production Deployment

1. Update environment variables for production
2. Build and deploy with Docker Compose
3. Configure reverse proxy (nginx)
4. Set up SSL certificates
5. Configure database backups

## Tech Stack

- **Frontend**: Angular 17, TailwindCSS, RxJS
- **Backend**: NestJS, JWT, Stripe, Multer
- **TTS**: Node.js say, Google TTS (gtts)
- **Database**: PostgreSQL, Redis
- **DevOps**: Docker, Docker Compose