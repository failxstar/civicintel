# 🌟 Civicintel - Crowdsourced Civic Issue Reporting System

<div align="center">

[![Smart India Hackathon 2025](https://img.shields.io/badge/Smart%20India%20Hackathon-2025-orange)](https://sih.gov.in/)
[![React](https://img.shields.io/badge/React-18.3.1-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)](https://www.typescriptlang.org/)

**Team: The Black Pearl** 🏴‍☠️

*Empowering citizens to build cleaner, smarter cities through technology*

## [Live Demo](https://swachh-nagar.netlify.app/)

</div>



## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution Overview](#-solution-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Future Roadmap](#-future-roadmap)
- [Impact & Metrics](#-impact--metrics)

---

## 🎯 Problem Statement

**Title:** Crowdsourced Civic Issue Reporting and Resolution System

**Challenge:** Traditional civic issue reporting systems face several critical challenges:
- ❌ Long resolution times due to manual routing
- ❌ Low citizen engagement and participation
- ❌ Lack of transparency in issue resolution
- ❌ No priority-based routing mechanism
- ❌ Language barriers preventing inclusive participation
- ❌ No real-time tracking and analytics

**Our Solution:** Civivintel addresses these challenges with an AI-powered, mobile-first platform that democratizes civic engagement and accelerates municipal response times.

---

## 💡 Solution Overview

**Civicintel** is an intelligent, crowdsourced civic issue reporting platform designed for Smart Cities. Built specifically for the **Siliguri Municipal Corporation** as a pilot, it leverages AI, geolocation, and real-time analytics to transform how citizens interact with local governance.

### Core Value Propositions:

1. **AI-Powered Issue Classification** - Automatically categorizes and routes issues to the correct department
2. **Multi-Language Support** - Inclusive platform supporting 6+ Indian languages
3. **Real-time Analytics Dashboard** - Data-driven insights for municipal administrators
4. **Offline-First Architecture** - Works seamlessly even without internet connectivity
5. **Transparent Tracking** - Citizens can upvote, comment, and track issue resolution

---

## ✨ Key Features

### 🤖 Intelligent AI Classification
- **Automated Issue Categorization**: Advanced AI analyzes images and descriptions to classify issues (roads, garbage, drainage, streetlights, water supply)
- **Confidence Scoring**: 85-99% accuracy with transparent confidence metrics
- **Smart Department Routing**: Automatically routes to appropriate departments (PWD, WMD, ED, WSD, DD)
- **Priority Detection**: AI-driven severity scoring (1-10 scale) based on location, issue type, and urgency factors

### 📍 Advanced Geolocation & Mapping
- **OpenStreetMap Integration**: Free, open-source mapping with Leaflet.js
- **Precise Location Tracking**: Automatic ward and street detection
- **Distance Calculation**: Shows proximity of issues to user's location
- **Interactive Markers**: Click-to-view issue details on map

### 📊 Real-Time Analytics Dashboard
- **Municipal Insights**: Total reports, resolution rates, and average resolution time
- **Issue Type Analysis**: Trending issues with up/down indicators
- **Critical Areas Detection**: Heat map of problem zones by ward
- **Performance Metrics**: Department-wise efficiency tracking

### 🌐 Multi-Language Support
- **6+ Languages**: English, Hindi, Bengali, Tamil, Telugu, Marathi
- **Dynamic Translation**: Seamless language switching without app restart
- **Inclusive Design**: Ensuring all citizens can participate regardless of language

### 📱 Mobile-First Design
- **Progressive Web App (PWA)**: Install on any device
- **Responsive UI**: Optimized for smartphones and tablets
- **Touch-Optimized**: Intuitive swipe gestures and touch interactions
- **Lightweight**: Fast load times even on 3G/4G networks

### 🔄 Offline Support
- **Local Storage**: Reports cached locally when offline
- **Auto-Sync**: Automatically syncs when connection restored
- **Queue Management**: Smart queuing of offline actions

### 🎥 Rich Media Support
- **Photo Capture**: In-app camera integration
- **Video Upload**: Support for video evidence
- **Media Carousel**: Multiple images/videos per report
- **Image Compression**: Optimized for mobile networks

### 👥 Community Engagement
- **Upvote System**: Democratic prioritization of issues
- **Comment Threads**: Community discussion on issues
- **User Profiles**: Track personal contributions
- **Gamification**: Badges and achievements for active citizens

---

## 🛠 Technology Stack

### Frontend
- **React 18.3.1** - Modern component-based UI framework
- **TypeScript 5.9.2** - Type-safe development
- **Vite 6.3.5** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **Framer Motion** - Production-ready animation library
- **Radix UI** - Accessible, unstyled component primitives

### Mapping & Geolocation
- **Leaflet 1.9.4** - Leading open-source JavaScript library for mobile-friendly interactive maps
- **OpenStreetMap** - Collaborative, open-source map data

### UI Components & Libraries
- **Lucide React** - Beautiful, consistent icons (500+ icons)
- **Recharts** - Composable charting library for analytics
- **React Hook Form** - Performant form validation
- **Sonner** - Elegant toast notifications
- **Vaul** - Accessible drawer component for mobile

### Development Tools
- **Vite SWC Plugin** - Ultra-fast React compilation
- **TypeScript Compiler** - Advanced type checking
- **ESLint** - Code quality and consistency
- **Git** - Version control

### AI & Classification
- **Custom AI Classification Engine** - Proprietary algorithm for issue detection
- **Keyword Pattern Matching** - Context-aware issue categorization
- **Severity Scoring Algorithm** - Multi-factor urgency calculation

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface Layer                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Home     │  │   Report   │  │ Analytics  │            │
│  │   Screen   │  │   Screen   │  │  Dashboard │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ AI           │  │ Geolocation  │  │ Analytics    │      │
│  │ Classifier   │  │ Service      │  │ Generator    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Local        │  │ IndexedDB    │  │ OpenStreetMap│      │
│  │ Storage      │  │ (Offline)    │  │ API          │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow:
1. **User captures** issue via camera/media
2. **AI analyzes** image + description → classifies issue type
3. **Geolocation** determines ward, street, coordinates
4. **Severity algorithm** calculates priority score
5. **Department routing** assigns to correct municipal dept
6. **Report created** with timestamp, AI tags, confidence
7. **Real-time update** pushes to analytics dashboard
8. **Community engagement** enables upvotes and comments

---

## 📸 Screenshots

### Onboarding & Home Screen
*Multilingual onboarding → Location detection → Live feed of civic issues*

### Report Creation Flow
*Camera capture → AI classification → Severity rating → Submit*

### Analytics Dashboard
*Municipal insights → Department performance → Trending issues → Critical areas*

### Map View
*Interactive markers → Issue clusters → Proximity-based sorting*



### Project Structure

```
Civicintel Mobile Prototype/
├── public/                      # Static assets
├── src/
│   ├── components/              # React components
│   │   ├── ui/                  # Reusable UI components (40+ components)
│   │   ├── HomeScreen.tsx       # Main feed screen
│   │   ├── ReportScreen.tsx     # Issue reporting interface
│   │   ├── AnalyticsScreen.tsx  # Analytics dashboard
│   │   ├── LeafletMapScreen.tsx # Map integration
│   │   ├── LiveFeed.tsx         # Real-time updates
│   │   ├── OnboardingScreen.tsx # User onboarding
│   │   ├── ProfileScreen.tsx    # User profile management
│   │   └── ...                  # Additional components
│   ├── utils/                   # Utility functions
│   │   ├── aiClassification.ts  # AI classification engine
│   │   ├── mapConfig.ts         # Map configuration
│   │   └── mobileDetection.ts   # Device detection
│   ├── types/                   # TypeScript type definitions
│   ├── styles/                  # CSS and styling
│   │   ├── globals.css          # Global styles
│   │   └── map.css              # Map-specific styles
│   ├── App.tsx                  # Root application component
│   └── main.tsx                 # Application entry point
├── package.json                 # Dependencies and scripts
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
└── README.md                    # This file
```

---

## 📈 Impact & Metrics

### Target Impact

| Metric | Current System | With Swachh Nagar | Improvement |
|--------|---------------|-------------------|-------------|
| **Average Resolution Time** | 7-10 days | 2-3 days | **70% faster** |
| **Citizen Participation** | 5% | 35%+ | **7x increase** |
| **Issue Classification Accuracy** | Manual (100%) | AI (92-98%) | **Automated** |
| **Department Routing Time** | 2-3 days | < 1 minute | **99% faster** |
| **Transparency** | Low | High | **Full visibility** |

### Projected Benefits
- 💰 **Cost Reduction**: 40% reduction in manual processing costs
- ⏱ **Time Savings**: 60-70% faster issue resolution
- 🏙 **Improved Governance**: Data-driven decision making for urban planning
- 👥 **Citizen Empowerment**: Democratic participation in civic improvement
- 🌱 **Sustainability**: Faster cleanup → cleaner cities → better health outcomes

---

## 🎥 Demo & Presentation

### Live Demo
[https://swachh-nagar.netlify.app/]

### Video Walkthrough
[https://www.youtube.com/watch?v=aHgKznMHg8Q]

---

## 🤝 Acknowledgments

- **Smart India Hackathon 2025** - For providing the platform to innovate
- **Siliguri Municipal Corporation** - Pilot city and domain context
- **OpenStreetMap Contributors** - For open-source mapping data
- **React & TypeScript Community** - For excellent documentation and support

---

<div align="center">

**Built with ❤️ by The Black Pearl for Smart India Hackathon 2025**

*Making cities cleaner, one report at a time* 🌿

</div>

## Thank you for exploring Civicintel!

