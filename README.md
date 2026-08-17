# LPDP Scholarship Survey & Analytics Platform (Prototype)
🔗 **Live Application:** [caps-lpdp-survey.vercel.app](https://caps-lpdp-survey.vercel.app/)

[![React](https://img.shields.io/badge/React-18%2F19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-Build_Tool-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Responsive_UI-06B6D4.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_BaaS-3ECF8E.svg?logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Production_Deployment-000000.svg?logo=vercel&logoColor=white)](https://caps-lpdp-survey.vercel.app/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An end-to-end telemetry survey and analytics web platform developed as an academic capstone case study (CAPS-05) for evaluating scholarship service satisfaction at the **Department of Computer Science**, **SSMI**, **IPB University**.

The platform provides full survey lifecycle management, dynamic multi-step questionnaire rendering, database-level Row-Level Security (RLS) data isolation, and automated real-time computation of scientific satisfaction indices—specifically the **Customer Satisfaction Index (CSI)** and **Importance-Performance Analysis (IPA)** quadrant mapping.

> **Disclaimer:** This application is an independent academic prototype and research project developed for educational purposes, and is not an official system directly operated by LPDP.

---

## Table of Contents
- [Project Overview](#project-overview)
- [System Architecture & Engineering Highlights](#system-architecture--engineering-highlights)
- [Key Features](#key-features)
  - [Executive Command Center (Admin)](#executive-command-center-admin)
  - [Interactive Survey Builder](#interactive-survey-builder)
  - [Respondent Experience (Awardee)](#respondent-experience-awardee)
- [Database Schema & Data Models](#database-schema--data-models)
- [Technology Stack](#technology-stack)
- [Live Demo & Test Credentials](#live-demo--test-credentials)
- [Installation & Local Setup](#installation--local-setup)
- [Project Resources](#project-resources)
- [Authors & Academic Affiliation](#authors--academic-affiliation)
- [License](#license)

---

## Project Overview

The evaluation of scholarship service quality often suffers from passive data accumulation and manual report compilation, resulting in delayed institutional decision-making. 

This project delivers **Analytical Telemetry Phase v2.0**, a total re-platforming from legacy static systems into a high-performance Single Page Application (SPA) backed by serverless PostgreSQL. The platform automates data collection, data transformation, and strategic reporting using the **Knowledge Discovery in Databases (KDD)** lifecycle.

---

## System Architecture & Engineering Highlights

1. **Total Re-Platforming & Serverless BaaS**: Migrated from document-based storage to a relational PostgreSQL model via Supabase, enforcing foreign key integrity, cascade operations, and atomic transactions.
2. **Automated CSI & IPA Calculations**: Formulates quantitative respondent scores into weighted satisfaction indices ($CSI$) and plots coordinate matrices ($IPA$) across 4 strategic quadrants (*Concentrate Here*, *Keep Up Good Work*, *Low Priority*, *Possible Overkill*).
3. **Database-Level Row-Level Security (RLS)**: Enforces zero-trust data access rules directly in PostgreSQL, ensuring awardees can only view and submit their own responses while administrators retain analytical oversight.
4. **Network Optimization**: Employs Supabase header metadata parameters (`{ count: 'exact', head: true }`) for lightweight statistical polling, drastically reducing unnecessary bandwidth and JSON payload transfers.

---

## Key Features

### Executive Command Center (Admin)
* **Real-Time Statistical Telemetry**: Dynamic dashboard visualizing respondent counts, completion rates, and participation distribution.
* **IPA Quadrant Visualization**: Interactive scatter plots powered by `Recharts` mapping attribute importance against perceived performance.
* **CSI Scoring Engine**: Automated mathematical computation of overall service satisfaction percentages.
* **Critical Feedback Triage**: Progressive disclosure mechanism highlighting low-rating submissions for immediate administrative review.

### Interactive Survey Builder
* **Dynamic Questionnaire Structuring**: Organize questions into distinct logical sections with drag-and-drop / ordering triggers ($\uparrow/\downarrow$).
* **Diverse Question Schemas**: Supports Likert Scale matrices (IPA format), free text, single choice, multiple choice, and dropdowns.
* **Atomic Survey Duplication**: Stored procedure execution to clone entire questionnaire structures without duplicating historical response data.
* **Real-Time Autosave & Preview**: Draft persistence with a sandbox preview mode that bypasses database writes.

### Respondent Experience (Awardee)
* **Survey Hub**: Centralized dashboard showcasing open and completed survey obligations.
* **Multi-Step Form Flow**: Paginated section navigation with progress tracking to reduce cognitive fatigue.
* **Automatic Profile Binding**: Pre-fills demographic data (name, university, province) directly from the authenticated session.
* **Internationalization (i18n)**: Seamless dual-language toggle between Indonesian and English.

---

## Database Schema & Data Models

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 18 / 19, TypeScript |
| **Build & Tooling** | Vite, ESLint, PostCSS |
| **Styling & Icons** | Tailwind CSS v3 / v4, Lucide React |
| **State & Navigation** | React Router DOM v6, Sonner Notifications |
| **Analytics & Charts** | Recharts Data Visualization |
| **Internationalization**| i18next, react-i18next |
| **Backend & Database** | Supabase (PostgreSQL), Row-Level Security (RLS) |
| **Hosting & CI/CD** | Vercel Platform |

---

## Live Demo & Test Credentials

The application is deployed and accessible online:
🔗 **Live Application:** [caps-lpdp-survey.vercel.app](https://caps-lpdp-survey.vercel.app/)

### Demo Credentials

| Role | Email | Password | Scope of Access |
|---|---|---|---|
| **Administrator** | `admin3@gmail.com` | `admin1234` | Command Center, IPA/CSI Analytics, Survey Builder, Export |
| **Awardee (Respondent)** | `awardee@gmail.com` | `awardee1234` | Survey Hub, Multi-Step Form Submission, Profile Binding |

---

## Installation & Local Setup

### Prerequisites
* **Node.js** `v18.0.0` or higher
* **npm** `v9.0.0` or higher
* A registered **Supabase** project instance

### Step-by-Step Setup

1. **Clone the Repository**:
   ```bash
   git clone [https://github.com/nghifaria/caps-lpdp-survey.git](https://github.com/nghifaria/caps-lpdp-survey.git)
   cd caps-lpdp-survey
   ```

2. **Install Dependencies**:
```bash
npm install

```


3. **Configure Environment Variables**:
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=[https://your-supabase-project-id.supabase.co](https://your-supabase-project-id.supabase.co)
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

```


4. **Run Local Development Server**:
```bash
npm run dev

```


Open your browser at `http://localhost:5173`.
5. **Build for Production**:
```bash
npm run build

```



---

## Project Resources

* **Live Web App**: [https://caps-lpdp-survey.vercel.app/](https://caps-lpdp-survey.vercel.app/)
* **Academic Report (PDF)**: [Google Drive Document](https://drive.google.com/file/d/1DcOl-q1TXrQgk20dbBCMes12AsKlfh69/view?usp=drive_link)
* **Source Code Repository**: [GitHub Repository](https://www.google.com/search?q=https://github.com/nghifaria/caps-lpdp-survey)

---

## Authors & Academic Affiliation

Developed by **Kelompok 5 (Paralel P1)** for the **Capstone Project (CAPS-05)**, **Computer Science Study Program**, **IPB University**:

* **Naufal Ghifari Afdhala** — G6401231029 ([nghifari@apps.ipb.ac.id](https://www.google.com/search?q=mailto%3Anghifari%40apps.ipb.ac.id))
* **Fatiyya Ilmi Zahra** — G6401231016 ([fatiyyailmizahra@apps.ipb.ac.id](https://www.google.com/search?q=mailto%3Afatiyyailmizahra%40apps.ipb.ac.id))
* **Deshi Ardiani** — G6401231018 ([deshiardiani@apps.ipb.ac.id](https://www.google.com/search?q=mailto%3Adeshiardiani%40apps.ipb.ac.id))
* **Yoga Cristopher Gulo** — G6401231137 ([yogacristopher@apps.ipb.ac.id](https://www.google.com/search?q=mailto%3Ayogacristopher%40apps.ipb.ac.id))



---

## License

This project is licensed under the [MIT License](https://www.google.com/search?q=LICENSE) — feel free to use and adapt it for academic and portfolio purposes.

