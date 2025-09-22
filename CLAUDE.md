# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DotClock is a digital flip-dot display simulation, recreating the aesthetic and functionality of Alfa Zeta Flip Dot Displays in a web browser using Next.js 15.

## Tech Stack

- **Framework**: Next.js 15.5.3 with App Router
- **React**: 19.1.0
- **TypeScript**: v5 with strict mode
- **Styling**: Tailwind CSS v4 (latest version with inline theme configuration)
- **Build Tool**: Turbopack (Rust-based bundler for faster builds)
- **Fonts**: Geist Sans and Geist Mono (optimized via next/font)

## Development Commands

```bash
# All commands should be run from /Users/karthickarun/dotclock/flip-dot-display/

# Start development server with Turbopack (hot reload enabled)
npm run dev

# Build for production with Turbopack optimization
npm run build

# Start production server
npm run start
```

## Architecture

### Project Structure
The application follows Next.js 13+ App Router pattern:
- `/flip-dot-display/src/app/` - App Router directory containing pages and layouts
- `/flip-dot-display/src/app/layout.tsx` - Root layout with font configuration and metadata
- `/flip-dot-display/src/app/page.tsx` - Main application page (currently contains starter content)
- `/flip-dot-display/src/app/globals.css` - Global styles with Tailwind CSS v4 imports

### Key Architectural Decisions

1. **App Router over Pages Router**: Uses modern Next.js App Router for better performance and nested layouts
2. **Tailwind CSS v4**: Uses the new `@import "tailwindcss"` syntax with inline theme configuration in globals.css
3. **TypeScript Path Mapping**: `@/*` maps to `./src/*` for clean imports
4. **Turbopack**: Enabled for both development and production builds for faster compilation

### Styling System

Tailwind CSS v4 with custom CSS properties for theming:
- Theme variables defined inline in `globals.css` using `@theme`
- Dark mode automatically switches based on system preference
- Custom properties: `--background` and `--foreground` for color theming
- Font families: `--font-geist-sans` and `--font-geist-mono`

### TypeScript Configuration

Strict TypeScript configuration with:
- Target: ES2017
- Strict mode enabled
- Path aliases configured (`@/*` → `./src/*`)
- Next.js plugin for enhanced type checking

## Development Patterns

1. **Component Structure**: When creating new components for the flip-dot display, place them in `/flip-dot-display/src/components/`
2. **State Management**: For flip-dot patterns and animations, consider using React hooks and context
3. **CSS Approach**: Use Tailwind utility classes; avoid inline styles except for dynamic values
4. **Font Loading**: Use the existing Geist font configuration in layout.tsx for consistency

## Important Notes

- **No ESLint/Prettier**: Currently no linting configuration; maintain consistent code style manually
- **No Test Setup**: No testing framework configured yet
- **Working Directory**: Always run commands from `/flip-dot-display/` subdirectory, not the repository root
- **Turbopack**: Both dev and build commands use Turbopack for performance; this is intentional and should be maintained