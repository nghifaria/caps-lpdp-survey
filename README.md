# caps-lpdp-survey
# caps-lpdp-survey
# LPDP Awardee Satisfaction Platform (Survey Insight)

Platform kuesioner mandiri berbasis web untuk mengukur tingkat kepuasan awardee LPDP menggunakan metode **Importance-Performance Analysis (IPA)**. Proyek ini dibangun untuk menggantikan ketergantungan pada platform survei pihak ketiga.

## 🛠 Tech Stack (2026 Standard)
- **Frontend**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS (LPDP Theme: Navy #003366 & Orange #F97316)
- **Backend as a Service (BaaS)**: Supabase (Auth, PostgreSQL, Storage)
- **State Management**: TanStack Query (React Query)
- **AI Agent-Based Development**: Optimized for Google Antigravity & OpenAI Codex

## 🧠 Core Principles (Karpathy's Vibecoding)
Proyek ini mengikuti pedoman perilaku yang ketat untuk mengurangi kesalahan koding AI:
1. **Think Before Coding**: Selalu buat rencana implementasi sebelum menulis baris kode.
2. **Simplicity First**: Jangan tambahkan fitur spekulatif. Minimal kode untuk hasil maksimal.
3. **Surgical Changes**: Edit hanya bagian yang diperlukan. Jangan merombak kode tetangga tanpa izin.
4. **Goal-Driven Execution**: Setiap perubahan harus memiliki kriteria keberhasilan yang dapat diverifikasi.

## 🎯 Project Scope
- **Responden**: Pengisian kuesioner dinamis dengan *branching logic* (Smart Form).
- **Admin**: Dashboard analitik dengan visualisasi Matriks IPA interaktif.
- **Data**: Ekspor hasil survei ke format CSV yang siap diolah.
- **Security**: Row Level Security (RLS) di Supabase untuk perlindungan data.

## 📊 Analytics Methodology (IPA)
Perhitungan kuadran didasarkan pada skor rata-rata:
- **Kepuasan (Performance)**: $\bar{X} = \frac{\sum X_i}{n}$
- **Kepentingan (Importance)**: $\bar{Y} = \frac{\sum Y_i}{n}$

## 📂 Directory Structure
```text
src/
├── assets/         # Images, LPDP Logos, Fonts
├── components/     # Reusable UI Components
├── hooks/          # Custom hooks (fetching, auth)
├── lib/            # Supabase config & external tools
├── pages/          # Full page views (Landing, Admin, Survey)
├── types/          # Strict TypeScript interfaces
└── supabase/       # SQL Migrations & Database Seeding 