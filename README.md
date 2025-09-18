# Pickup (formerly Quest)

A digital reading platform designed to enhance and personalize content consumption through AI-powered text-to-speech, social discovery, and intelligent recommendations.

## 🚀 Overview

**Pickup** is a comprehensive content consumption platform that transforms how users discover, read, and listen to digital content. Originally called **Quest** ([getquest.co](https://www.getquest.co/)), the platform combines AI-powered audio synthesis, social content sharing, and a sophisticated real-time recommendation engine to create a seamless multimedia learning experience.

### 🧠 Technical Highlights

The platform features a **real-time recommendation engine** that processes millions of podcasts and articles through:

- **Distributed Scraping Pipelines**: Automated processing of 100+ podcast feeds and article sources, plus sophisticated data seeding from platforms like [Curius.app](Curius.app)
- **Vector Similarity Search**: Leveraging pgvector in PostgreSQL for high-performance content matching
- **Hybrid Recommendation Algorithm**: Combines content-based filtering, collaborative filtering, and social signals
- **Real-Time Processing**: Optimized for sub-second latency in content recommendations
- **Unified Content System**: Handles diverse content types (podcasts, articles) with consistent personalization

### Core Features

- **AI Text-to-Speech**: Convert articles to high-quality audio via ElevenLabs
- **Content Processing Pipeline**: URL ingestion → AI summaries → audio generation → vector embeddings
- **Social Discovery**: Follow friends, share content, discover trending articles in your network
- **Content Generation Engine**: Reading pattern analysis, category-based recommendations, friend activity influence
- **Multi-Modal Experience**: Seamless reading/listening with progress tracking and highlights

## 🏗️ Architecture

This is a full-stack application with three main components:

### 📱 Mobile App (`/app`)

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation v6
- **Audio**: React Native Track Player
- **Authentication**: Firebase Auth + Apple/Google Sign-in

### 🖥️ Backend Server (`/server`)

- **Framework**: Express.js with Apollo GraphQL
- **Language**: TypeScript
- **Database**: PostgreSQL with pgvector for embeddings
- **Authentication**: Firebase Admin SDK
- **Background Jobs**: Inngest
- **AI/ML**: OpenAI API for content processing
- **Audio Processing**: FFmpeg for audio generation

### 🌐 Browser Extension (`/chrome-extension-mv3-firebase`)

- **Type**: Chrome Extension (Manifest V3)
- **Framework**: Webpack + Firebase
- **Purpose**: Content capture and quick access

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ (server requirement)
- Docker & Docker Compose
- Yarn (for app dependencies)
- npm (for server dependencies)

### Quick Start

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd pickup
   ```

2. **Start PostgreSQL with Docker**

   ```bash
   docker pull pgvector/pgvector:pg16
   docker compose -f deployments/pickup/docker-compose.yml up
   ```

3. **Set up environment variables**

   - Copy `.env` files to `server/` and `app/` directories
   - Configure Firebase, database, and API credentials

4. **Install dependencies**

   ```bash
   # Server
   cd server
   npm run install:all

   # App
   cd ../app
   yarn install
   npx pod-install  # iOS only
   ```

5. **Run database migrations**

   ```bash
   cd server
   npm run migrate:run
   ```

6. **Start development servers**

   ```bash
   # Terminal 1: Main server
   cd server
   npm run start:dev

   # Terminal 2: Background jobs
   npm run inngest:dev

   # Terminal 3: Inngest UI
   npx inngest-cli@latest dev -u http://localhost:8001/inngest

   # Terminal 4: Mobile app
   cd ../app
   npm run start
   ```

## 📋 Available Scripts

### Server (`/server`)

- `npm run start:dev` - Development server with hot reload
- `npm run build` - Build production bundle
- `npm run start` - Run production server
- `npm run inngest:dev` - Background job worker (development)
- `npm run migrate:run` - Run database migrations
- `npm run migrate:generate` - Generate new migration
- `npm run graphql:generate` - Generate GraphQL schema and types
- `npm run test` - Run tests

### Mobile App (`/app`)

- `npm start` - Start Expo development server
- `npm run android` - Run Android development build
- `npm run ios` - Run iOS development build
- `npm run graphql:codegen` - Generate GraphQL client code

### Browser Extension (`/chrome-extension-mv3-firebase`)

- `npm run build` - Development build with watch mode
- `npm run release` - Production build

## 🔧 Technology Stack

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **GraphQL**: Apollo Server
- **Database**: PostgreSQL + pgvector
- **ORM**: TypeORM
- **Jobs**: Inngest
- **AI**: OpenAI API
- **Audio**: ElevenLabs, FFmpeg
- **Authentication**: Firebase Admin
- **Deployment**: PM2

### Frontend

- **Mobile**: React Native + Expo
- **State**: Redux Toolkit
- **Navigation**: React Navigation
- **UI**: React Native Elements, Gorhom Bottom Sheet
- **Audio**: React Native Track Player
- **Auth**: Firebase Auth, Apple/Google Sign-in

### Infrastructure

- **Database**: PostgreSQL with pgvector extension
- **Vector Storage**: pgvector for content embeddings
- **File Storage**: Google Cloud Storage / Firebase Storage
- **Background Jobs**: Inngest + Redis
- **Monitoring**: Sentry

## 📱 Platform Support

- **iOS**: Full native support
- **Chrome Extension**: Content capture and quick access
- **Web**: Limited (some React Native packages not web-compatible)

---

_Originally developed as Quest (getquest.co) - a platform to "10x your reading" through personalized, AI-enhanced content consumption._
