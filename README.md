# 🖐️ Hand Expression: 3D Interactive Tracker

An immersive, AI-powered interactive 3D visualization experience built with React, Three.js, and MediaPipe.

![Hand Expression](public/screenshot.png) *Note: Add a screenshot of the app here.*

## 🌟 Overview

**Hand Expression** is more than just a 3D viewer; it's a digital art piece that "watches back." By combining high-fidelity 3D rendering with real-time AI computer vision, the application creates a unique interactive space where a stylized 3D hand model responds to your presence.

## ✨ Key Features

- **💎 High-Fidelity 3D Rendering**: A stunning, metallic/diamond-textured 3D hand model rendered with cinematic lighting, shadows, and environment mapping.
- **👁️ AI-Powered Tracking**: Integrated with **MediaPipe Tasks Vision** to detect and track humans in real-time via your webcam.
- **🎭 Dynamic Interaction**:
    - **Exploration Mode**: Freely rotate, zoom, and inspect the model using traditional orbit controls.
    - **Tracking Mode**: When a person is detected, the camera smoothly aligns, and a "scanning" skeleton overlay appears, locking the perspective to the observer.
- **🔊 Atmospheric Audio**: Immersive, "eerie" sound effects triggered by movement and interaction to enhance the spooky, high-tech aesthetic.
- **✨ Premium UI**: A sleek, minimal dark-mode interface designed for a focus-first experience.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| [**React**](https://reactjs.org/) | Core framework for building the UI and managing state. |
| [**Three.js**](https://threejs.org/) | The powerhouse for 3D graphics. |
| [**@react-three/fiber**](https://github.com/pmndrs/react-three-fiber) | React renderer for Three.js. |
| [**@react-three/drei**](https://github.com/pmndrs/drei) | Essential helpers for shaders, shadows, and camera controls. |
| [**MediaPipe**](https://google.github.io/mediapipe/) | Google's AI framework for high-speed human/pose detection. |
| [**Vite**](https://vitejs.dev/) | Next-generation frontend tooling for a blazing-fast dev experience. |

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A webcam for the AI tracking features.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/3d-hand.git
   cd 3d-hand
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. Open your browser to the local URL (usually `http://localhost:5173`).

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
