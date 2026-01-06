# **App Name**: AuroraAir

## Core Features:

- 3D Globe Visualization: Display an interactive 3D globe with zoom capability to India and preset city locations.
- Data Source Toggle: Switch between NASA-Only and Combined (NASA + Ground) data sources with immediate visual updates.
- Time Travel Control: Implement a timeline scrubber for navigating forecast data from 'Now' to '+48h forecast'.
- Predictive Ribbons & Flow: Animate vector flows indicating wind-driven pollutant transport, with width/opacity proportional to predicted concentration.
- Station Cards: Display sensor data, predicted vs. observed time series, and data source information when clicking on a sensor marker.
- Scenario Builder: Allow users to adjust parameters like traffic, industry, and rain to simulate projected changes and view delta maps.
- Explainability Panel: Provide insights into top factors impacting the current forecast using a tool with feature importance analysis and action recommendations.

## Style Guidelines:

- Background: Deep-space charcoal (#0B0F13) to provide a cinematic backdrop.
- Primary color: Azure (#00B2FF) for a soft, futuristic neon glow. This vibrant color effectively contrasts against the dark background.
- Accent color: Magenta (#FF4DA6) to highlight interactive elements and data visualizations. This complements the primary Azure with a strong contrast.
- Font pairing: 'Inter' (sans-serif) for body text to ensure readability, combined with 'Space Grotesk' (sans-serif) for headlines, lending a modern tech feel. Note: currently only Google Fonts are supported.
- Use a set of SVG icons for data badges (NASA, OpenAQ, CPCB, TEMPO) to represent data sources.
- Employ 2.5D glass cards with a 2xl border radius, soft blur (backdrop-filter), and subtle inner glow for a futuristic UI.
- Implement ease-out cubic motion for UI state changes and a smooth, high-performance particle simulation in WebGL.