# AI Voice Cloner

A full-stack application for AI-powered voice cloning using Angular, NestJS, and Python with Coqui TTS.

## Architecture

- **Frontend**: Angular 17 with TailwindCSS
- **Backend**: NestJS with JWT authentication and Stripe payments
- **AI Service**: Python Flask with Coqui TTS
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
   - Python Service: http://localhost:5000

## API Endpoints

### Backend (NestJS)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/train-voice` - Upload voice sample
- `POST /api/voice` - Generate voice from text
- `POST /api/pay` - Process payments

### Python Service
- `POST /generate` - Generate audio from text
- `GET /health` - Health check
- `GET /models` - List available TTS models

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

### Python Service Development
```bash
cd python-service
pip install -r requirements.txt
python app.py
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
- **AI**: Python, Flask, Coqui TTS, PyTorch
- **Database**: PostgreSQL, Redis
- **DevOps**: Docker, Docker Compose