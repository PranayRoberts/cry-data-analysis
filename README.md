# CRY Data Analysis Dashboard

<p align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a1/Child_Rights_and_You_%28CRY%29_Organization_logo.png" alt="CRY Logo" width="200"/>
</p>

<p align="center">
  <strong>A comprehensive analytics dashboard for visualizing child welfare data from Child Rights and You (CRY) organization</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.1.0-61DAFB?logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-6.3.5-646CFF?logo=vite" alt="Vite"/>
  <img src="https://img.shields.io/badge/Plotly.js-Interactive-3F4F75?logo=plotly" alt="Plotly"/>
  <img src="https://img.shields.io/badge/TailwindCSS-4.1-06B6D4?logo=tailwindcss" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel" alt="Vercel"/>
</p>

<p align="center">
  <a href="https://cry-data-analysis.vercel.app"><strong>🌐 Live Demo: cry-data-analysis.vercel.app</strong></a>
</p>

---

## Overview

This dashboard provides comprehensive data visualization and analysis for CRY's child welfare programs across India. It processes and visualizes data from **360,000+ records** across multiple program areas:

| Data Source | Records |
|-------------|---------|
| Child Annual Survey | 126,502 |
| Child Education | 233,165 |
| Anganwadi Centers | 2,013 |
| Schools | 1,600 |

---

## Features

### Dashboard Modules

| Module | Description |
|--------|-------------|
| **Main Dashboard** | Overview with KPIs, state-wise comparisons, and quick navigation |
| **Key Insights** | AI-generated insights and strategic recommendations |
| **Anganwadi Dashboard** | Center infrastructure, services, and nutrition analysis |
| **Child Annual Dashboard** | Health, nutrition, age distribution, and welfare tracking |
| **Child Education Dashboard** | Enrollment, attendance, dropout analysis |
| **School Dashboard** | Infrastructure, teacher demographics, student-teacher ratios |
| **Advanced Analytics** | 20 interactive Plotly.js visualizations with India map |

### 20 Advanced Analytics Charts

1. **India Map** - Interactive choropleth with state-wise beneficiary distribution
2. **Gender Distribution by State** - Boys vs Girls across top 20 states
3. **Overall Gender Distribution** - Pie chart of total gender breakdown
4. **Enrollment Trends** - 5-year trend analysis (2020-2024)
5. **Multi-metric State Comparison** - Facilities and children by state (2-panel)
6. **Age Band Distribution** - Child demographics by age group and gender
7. **Dropout Reasons Analysis** - Top causes for school dropouts
8. **School Infrastructure** - Facility availability percentages
9. **Teacher Demographics** - Gender and employment type distribution
10. **Social Diversity** - Caste and religion distribution
11. **Year-over-Year Comparison** - 2023 vs 2024 growth metrics
12. **Partner Organization Distribution** - Facilities by partner NGO
13. **Facility Type Breakdown** - Schools and Anganwadi subtypes
14. **Student-Teacher Ratio** - STR distribution (optimal to critical)
15. **Nutrition Services Radar** - Anganwadi service coverage radar chart
16. **Regional Comparison** - North/South/East/West analysis
17. **Special Needs Distribution** - Inclusive education metrics by state
18. **Rural-Urban Distribution** - Location-based facility analysis
19. **District Coverage Heatmap** - Top districts by school coverage
20. **School Category Distribution** - Government vs private schools

### Key Capabilities

- **Interactive India Map** - Click any state to filter all charts
- **Dark/Light Mode** - Toggle between themes
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Chart Export** - Download charts as PNG images
- **Real-time Filtering** - State-based data drill-down
- **Session Security** - 2-hour timeout with brute force protection

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.0 | UI Framework |
| TypeScript | 5.8 | Type Safety |
| Vite | 6.3.5 | Build Tool & Dev Server |
| Plotly.js | 2.35 | Advanced Interactive Charts |
| Recharts | 2.15 | Standard Dashboard Charts |
| Tailwind CSS | 4.1 | Utility-first Styling |
| React Router | 7.6 | Navigation & Protected Routes |
| Lucide React | 0.511 | Icon Library |

### Data Processing (Python)
| Package | Purpose |
|---------|---------|
| pandas | Data manipulation & analysis |
| plotly | Chart data generation |
| openpyxl | Excel file processing |
| numpy | Numerical computations |

---

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+ (optional, for data regeneration)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/cry-data-analysis.git
cd cry-data-analysis

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Login Credentials
```
Username: admin
Password: CRY@Admin2025
```

---

## Project Structure

```
cry-data-analysis/
├── public/
│   ├── data/                         # JSON data files
│   │   ├── advanced_analytics.json   # 20 Plotly charts data
│   │   ├── anganwadi_data.json
│   │   ├── child_annual_data.json
│   │   ├── child_education_data.json
│   │   └── school_data.json
│   ├── india_states.geojson          # India map boundaries
│   └── india_states_simplified.geojson
├── src/
│   ├── components/
│   │   ├── Charts.tsx                # Reusable chart components
│   │   ├── Dashboard.tsx             # Base dashboard layout
│   │   ├── ErrorBoundary.tsx         # Error handling
│   │   └── ProtectedRoute.tsx        # Auth guard
│   ├── contexts/
│   │   └── AuthContext.tsx           # Authentication state
│   ├── hooks/
│   │   └── useData.ts                # Data fetching hooks
│   ├── pages/
│   │   ├── AdvancedAnalytics.tsx     # 20 Plotly visualizations
│   │   ├── AnganwadiDashboard.tsx
│   │   ├── ChildAnnualDashboard.tsx
│   │   ├── ChildEducationDashboard.tsx
│   │   ├── InsightsAndTrends.tsx     # Key insights page
│   │   ├── LoginPage.tsx
│   │   ├── MainDashboard.tsx
│   │   └── SchoolDashboard.tsx
│   ├── utils/
│   │   └── dataProcessor.ts          # Data utilities
│   ├── App.tsx
│   ├── App.css
│   ├── main.tsx
│   └── index.css
├── scripts/                          # Python data processing
│   ├── generate_advanced_analytics.py
│   ├── regenerate_json_data.py
│   ├── analyze_trends.py
│   └── analyze_excel_data.py
├── excel-data/                       # Source Excel files (gitignored)
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## Data Processing

### Regenerating Chart Data

If you have updated Excel files in the `excel-data/` folder:

```bash
# Setup Python environment (first time only)
python -m venv .venv
.venv\Scripts\activate          # Windows
source .venv/bin/activate       # macOS/Linux
pip install pandas plotly openpyxl numpy

# Regenerate JSON data from Excel
python scripts/regenerate_json_data.py

# Generate advanced analytics charts
python scripts/generate_advanced_analytics.py
```

### Source Excel Files
The dashboard processes 8 Excel files (2023 and 2024 data):
- Anganwadi center information
- Child annual information
- Child education data
- School-level information

---

## Deployment

### Live Application

The dashboard is deployed and accessible at:

**🌐 [https://cry-data-analysis.vercel.app](https://cry-data-analysis.vercel.app)**

> **🔐 Login Credentials:** For access to the live demo, please contact me at [GitHub](https://github.com/PranayRoberts) to request login credentials.

### Deploy Your Own Instance to Vercel

1. Fork this repository to your GitHub account
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click **"Add New Project"**
4. Import your forked `cry-data-analysis` repository
5. **Add Environment Variables** (Settings → Environment Variables):
   | Name | Value |
   |------|-------|
   | `VITE_DEMO_USERNAME` | `admin` |
   | `VITE_DEMO_PASSWORD` | `YourSecurePassword` |
6. Click **Deploy**
7. Your site will be live at `https://your-project.vercel.app`

> **Note:** Environment variables are required for authentication to work on Vercel.

### Build for Production

```bash
npm run build      # Creates optimized build in dist/
npm run preview    # Preview production build locally
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at localhost:5173 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## Security Features

| Feature | Description |
|---------|-------------|
| Session Authentication | Token-based with sessionStorage |
| Auto Timeout | 2-hour inactivity logout |
| Brute Force Protection | 5 failed attempts → 15-min lockout |
| Activity Tracking | Mouse/keyboard resets timeout |
| Secure Logout | Clears all session data |

> **Note:** For production, replace with proper backend authentication (JWT, OAuth, etc.)

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Modern browsers with ES2022 support

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Charts not loading | Run `python scripts/generate_advanced_analytics.py` |
| Login not working | Clear browser sessionStorage |
| Build errors | Delete `node_modules` and run `npm install` |
| Port in use | Use `npm run dev -- --port 3000` |
| Map not showing | Verify `india_states.geojson` exists in `/public/` |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is developed for Child Rights and You (CRY) organization.

---

## Acknowledgments

- [Child Rights and You (CRY)](https://www.cry.org/) - Mission and data
- [Plotly.js](https://plotly.com/javascript/) - Interactive visualizations
- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tooling
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

<p align="center">
  Made with ❤️ for children's rights
</p>
