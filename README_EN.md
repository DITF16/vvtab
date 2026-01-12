<div align="center">

# 🎨 vvtab

**A highly customizable, component-based browser new tab extension built with Vue 3 + Vite**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Vue](https://img.shields.io/badge/Vue-3.x-green.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
![Version](https://img.shields.io/badge/version-0.2.0-orange)

[Functional characteristics](#-Features) • [Tech Stack](#️-tech-stack) • [Installation Guide](#️-installation-and-development-guide) • [中文](./README.md)

</div>

------

## 📖 Introduction

**vvtab** aims to break away from the dull layouts of traditional browser new tab pages. Unlike the fixed navigation pages currently on the market, vvtab adopts a fully **grid-based** interactive design. Users can operate it like a desktop system—freely dragging components, creating groups, changing wallpapers, and even raising an interactive Live2D pet on their dashboard.

This project is completely open-source, aiming to explore the best practices of **Vue 3 under the Chrome Extension V3 standard**. Frontend enthusiasts are welcome to participate and build together.

## 📸 Preview

> Screenshots showing the latest progress of the project

## ✨ Features

### 🖥️ Core Interactions

- **Grid Layout System**: Based on `grid-layout-plus`, components can be freely dragged and resized with automatic snapping.
- **Multiple Workspaces (Groups)**: The left sidebar supports creating multiple groups (e.g., Home, Work, Entertainment) with customizable icons and right-click management.
- **Immersive Context Menu**: Replaces the ugly native menu with a custom interaction. Different context menus appear when clicking on blank spaces, components, or the sidebar.

### 🎨 Personalization

- **Wallpaper Engine**:
  - Supports **Single Image mode** and **Slideshow mode** (custom intervals).
  - Supports **Web image URLs**.
  - **[Highlight]** Supports **local image uploads** (automatically converted to Base64 for storage to bypass browser sandbox restrictions).
- **Live2D Character**:
  - Based on `PixiJS v6` + `Cubism SDK`, fully compatible with Chrome V3 Content Security Policy (CSP).
  - Supports **local model loading** (no image hosting required, reads directly from the extension directory).
  - Supports drag-to-move, scroll-to-zoom, and click interactions (animations/speech bubbles).

### 🧩 Practical Components

- **Shortcuts**: Add any website with automatic Favicon fetching and protection against accidental native drag triggers.
- **Basic Components**: Built-in digital clock, search bar, and other essential widgets.

## 🛠️ Tech Stack

- **Core Framework**: Vue 3 (Script Setup) + TypeScript
- **Build Tool**: Vite
- **Layout Engine**: grid-layout-plus
- **Rendering Engine**: PixiJS v6 + pixi-live2d-display
- **Data Persistence**: Chrome Storage API / LocalStorage (Fallback)

## 🚀 Roadmap

We are actively developing the following features. Feel free to claim a task!

- [x] **Live2D Core Support**: Resolved `unsafe-eval` errors; implemented local model loading and interaction.
- [x] **Wallpaper Manager**: Support for local uploads and slideshows.
- [x] **Group Management**: Support for CRUD operations on group information.
- [ ] **Component Library Expansion**: Planned additions include Weather (API integration), Calendar, Todo list, and RSS Reader.
- [ ] **Config Import/Export**: Support for exporting all layout data in JSON format for easy migration.
- [ ] **AI Empowerment**: Utilize Live2D bubbles to integrate LLMs (OpenAI/DeepSeek) as a desktop conversation assistant.

## 🛠️ Installation and Development Guide

If you are a developer and want to contribute or debug locally:

### 1. Prerequisites

Bash

```
# Clone the project
git clone https://github.com/DITF16/vvtab.git
cd vvtab

# Install dependencies (pnpm or npm recommended)
# Note: The project has strict version requirements for PixiJS; please follow package.json
npm install
```

### 2. Development Mode

Bash

```
npm run dev
```

### 3. Build the Extension

Bash

```
npm run build
```

Once built, a `dist` folder will be generated in the project root.

### 4. Load into Browser

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **"Developer mode"** in the top right corner.
3. Click **"Load unpacked"**.
4. Select the `dist` folder in this project directory.

> **Note**: Live2D model files should be placed under `public/models`. Ensure the directory structure is correct to avoid 404 errors.

## 🤝 Contributing

Contributions of any kind are very welcome!

- If you find a bug, please submit an Issue.
- If you have cool Live2D models or wallpapers, feel free to share them.
- If you are good at Vue component development, welcome to submit a PR to enrich the component library.

## 📄 License

This project is open-sourced under the [MIT License](https://www.google.com/search?q=LICENSE&authuser=1).