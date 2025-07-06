# Strimly - Multistream Viewer

## Overview

Strimly is a client-side web application that allows users to view multiple live streams simultaneously in a customizable grid layout. The application supports Twitch, Kick, and YouTube streams, providing a unified interface for multi-stream viewing with features like theme switching, grid size adjustment, and stream sharing.

## System Architecture

### Frontend Architecture
- **Pure HTML/CSS/JavaScript**: No frameworks or build tools, keeping it lightweight and simple
- **Client-side only**: All functionality runs in the browser without server dependencies
- **Responsive design**: Mobile-first approach with flexible grid layouts
- **Progressive enhancement**: Core functionality works without JavaScript, enhanced with interactive features

### Component Structure
- **Single Page Application**: All functionality contained in one HTML file
- **Modular JavaScript**: Event-driven architecture with clear separation of concerns
- **CSS Custom Properties**: Dynamic theming and grid sizing using CSS variables
- **Semantic HTML**: Proper ARIA labels and semantic structure for accessibility

## Key Components

### Stream Management
- **Stream Parser**: Intelligent URL parsing for Twitch, Kick, and YouTube platforms
- **Embed System**: Dynamic iframe creation with platform-specific embed URLs
- **Duplicate Prevention**: Validation to prevent adding the same stream twice
- **Stream Storage**: Array-based storage with session persistence

### Grid System
- **Dynamic Grid**: CSS Grid with customizable column count (1-4 columns)
- **Responsive Layout**: Automatic adjustment based on screen size
- **Aspect Ratio**: 16:9 aspect ratio maintenance for all stream embeds

### User Interface
- **Header Navigation**: Sticky header with stream input, grid controls, and theme toggle
- **Empty State**: Informative placeholder with example stream functionality
- **Warning System**: Non-intrusive notification system for user feedback
- **Theme System**: Light/dark mode toggle with smooth transitions

### Data Persistence
- **Local Storage**: Stream configurations and theme preferences
- **URL Sharing**: Encode stream setup in shareable URLs
- **Session Recovery**: Restore streams and preferences on page reload

## Data Flow

### Stream Addition Process
1. User inputs stream URL or channel name
2. Input validation and platform detection
3. Duplicate check against existing streams
4. Stream object creation and storage
5. Dynamic iframe creation and DOM insertion
6. Local storage update for persistence

### Share Functionality
1. Validate streams exist
2. Encode stream data as JSON
3. Generate shareable URL with stream parameters
4. Use native share API or clipboard fallback

### Theme Management
1. Theme toggle triggers state change
2. CSS class modification on body element
3. Local storage update for persistence
4. Visual indicator update (sun/moon icon)

## External Dependencies

### Third-party Embeds
- **Twitch**: Uses official Twitch embed system via iframe
- **Kick**: Direct iframe embedding of live streams
- **YouTube**: Standard YouTube embed with privacy-enhanced mode

### Browser APIs
- **Local Storage**: For data persistence
- **Navigator Share API**: For native sharing (with clipboard fallback)
- **DOM APIs**: For dynamic content manipulation

### No External Libraries
- Zero external JavaScript libraries or frameworks
- No CDN dependencies
- Self-contained CSS without external fonts or icons

## Deployment Strategy

### Static Hosting
- **Files**: Three main files (index.html, style.css, app.js)
- **No Build Process**: Direct deployment without compilation
- **Any Static Host**: Compatible with GitHub Pages, Netlify, Vercel, etc.
- **No Server Requirements**: Pure client-side application

### Performance Considerations
- **Minimal Bundle Size**: No external dependencies
- **Fast Loading**: Inline SVG icons and optimized CSS
- **Efficient DOM Updates**: Direct manipulation without virtual DOM overhead

## Changelog
- July 06, 2025: Initial setup with multi-platform streaming support
- July 06, 2025: Removed grid size selector for cleaner interface
- July 06, 2025: Ready for deployment with Replit Deployments

## User Preferences

Preferred communication style: Simple, everyday language.