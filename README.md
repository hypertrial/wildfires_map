# Wildfire Spread Interactive Map

> **⚠️ Early Development Phase**: This is an open-source [Hypertrial.ai](https://hypertrial.ai) project in its very early phase. Features and functionality are actively being developed.

An interactive web application for visualizing wildfire forecast data using modern web technologies.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript with Vite
- **Mapping**: Leaflet.js
- **Data**: GeoJSON format
- **Deployment**: GitHub Pages

## 📊 Data Sources

Data can be derived from the [Hypertrial wildfires pipeline](https://github.com/hypertrial/wildfires_pipeline), which integrates:
- NASA FIRMS fire detection data
- Open-Meteo weather data
- Cellular Automata fire spread forecasting models

## 🎮 Controls

| Key | Action |
|-----|--------|
| `F` | Fit map to wildfire data |
| `ESC` | Close popups |
| `?` | Show help dialog |

## 📁 Structure

```
src/
├── components/
│   ├── WildfireMap.js     # Main map component
│   └── UIControls.js      # UI controls
└── utils/
    └── DataLoader.js      # Data utilities
```

## 🤝 Contributing

This project is in early development. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Disclaimer**: For educational purposes only. Consult official sources for actual wildfire monitoring.