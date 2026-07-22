# 🌍 Geo-Insights

An interactive 3D globe that transforms geography into an immersive learning experience by combining historical information, culture, current affairs, disaster monitoring, and geopolitical simulations—all in one platform.

Built primarily for students, geography enthusiasts, and civil services aspirants, Geo-Insights makes studying the world more engaging through interactive visualization and real-time data.

---

## 💡 Inspiration

Geography, history, and current affairs have always fascinated me throughout my school years. While preparing for competitive exams, students often rely on multiple books, atlases, and news sources to connect geographical locations with historical and political events.

I wanted to build something that brings all of this information together on a single interactive globe, making learning more visual, engaging, and intuitive.

---

## 🌐 Live Demo

**Try it here:**
https://geo-insights-beta.vercel.app/

---

## 🚀 Features

### 🌎 Interactive 3D Globe

* Explore the world through a fully interactive 3D globe powered by WebGL.
* Smooth camera controls for seamless navigation.

### 🔍 Smart Country Search

* Search any country with autocomplete suggestions.
* Automatically fly the globe to the selected location.

### 📚 Country Insights

Retrieve information for any country including:

* History
* Culture
* Current Affairs

Each category is displayed using distinct color-coded markers for better visualization.

### 🚨 Live Disaster Monitoring

Track real-time global events such as:

* Earthquakes
* Seismic activities
* Other live geological alerts

using live USGS data.

### 🛰️ ISS Live Tracker

Watch the International Space Station's live orbital position as it moves around Earth.

### 🗺️ Territorial Disputes

Visualize disputed regions such as Kashmir and access concise geopolitical summaries explaining the competing claims and historical background.

### 🎮 Geography Quiz

Challenge yourself with an interactive quiz that tests your knowledge of country locations while maintaining a live score.

### 🌍 Globe Texture Switcher

Switch between different globe textures including:

* Satellite View
* Physical Topography

for enhanced geographical understanding.

### 🕰️ Time Machine

Explore selected historical periods and understand how geopolitical landscapes evolved over time.

### 🏛️ Policy Sandbox

Experiment with simplified diplomatic and geopolitical scenarios to understand how different policy decisions may influence international relations.

---

## 🛠️ Tech Stack

| Category            | Technologies                    |
| ------------------- | ------------------------------- |
| Frontend            | React.js                        |
| Build Tool          | Vite                            |
| 3D Rendering        | react-globe.gl, Three.js, WebGL |
| Styling             | CSS                             |
| Maps & Geocoding    | OpenStreetMap Nominatim         |
| Historical Data     | Wikipedia REST API              |
| Current Affairs     | Google News RSS                 |
| Disaster Monitoring | USGS Live GeoJSON               |
| Space Tracking      | ISS Telemetry APIs              |

---

## 🚀 Getting Started

### Clone the Repository

```bash
git clone https://github.com/Sonal-sp/Geo-insights.git
cd Geo-insights
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables (Optional)

Create a `.env` file in the project root if using API keys.

```env
VITE_NEWS_API_KEY=your_api_key
```

### Start the Development Server

```bash
npm run dev
```

Open your browser and visit:

```
http://localhost:5173
```

---

## 🎯 Use Cases

### 📖 Civil Services Preparation

* Geography
* International Relations
* Current Affairs
* Border disputes
* World history

### 🏫 Classroom Learning

An engaging visual learning tool for schools and colleges teaching:

* Geography
* Environmental Science
* History
* Global Politics

### 🌍 Geography Enthusiasts

Explore countries, cultures, historical events, and real-time global developments through an interactive interface.

### 📊 Geopolitical Awareness

Understand strategic maritime routes, territorial disputes, and international policy scenarios using visual simulations.

---

# 🚀 Development Progress

## Sprint 1

* Interactive spinning 3D globe
* Country information using Wikipedia API
* Current Affairs integration
* Country search with automatic navigation

---

## Sprint 2

* Search autocomplete
* Improved UI with animated glow effects
* Color-coded History, Culture, and Current Affairs panels
* Live disaster monitoring using USGS feeds

---

## Sprint 3

* Interactive Geography Quiz
* Territorial dispute visualization
* Cleaner dashboard navigation

---

## Sprint 4

* Initial Time Machine implementation
* Policy Sandbox foundation

---

## Sprint 5

### Command Dashboard

Introduced four dedicated system modes:

* Study Matrix
* Crisis Monitor
* Time Machine
* Policy Sandbox

Additional improvements include:

* Physical Topography globe textures
* Live ISS tracker
* Interactive historical timelines
* Diplomacy simulation scenarios

---


## 👨‍💻 Purpose

Geo-Insights was built to demonstrate how modern web technologies can make geography and international affairs more interactive and engaging. The project combines 3D visualization, live data streams, educational content, and simulation-based learning into a single platform that encourages exploration rather than memorization.

---

## 💬 Feedback

Suggestions, ideas, and contributions are always welcome. If you have feature requests, find bugs, or have ideas to improve the platform, feel free to open an issue or submit a pull request.

---

