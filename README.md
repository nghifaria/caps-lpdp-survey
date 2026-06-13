# Sistem Survei Beasiswa LPDP

Aplikasi web komprehensif untuk mengelola dan mengisi survei/kuesioner kepuasan layanan beasiswa LPDP. Proyek ini dibangun menggunakan tumpukan teknologi modern dengan fokus pada performa, skalabilitas, dan kenyamanan pengguna (UX).

Tautan Website:
https://caps-lpdp-survey.vercel.app/

Akun Demo:

Role Awardee:
email: awardee@gmail.com
password: awardee1234

Role Admin:
email: admin3@gmail.com
password: admin1234

## 🚀 Fitur Utama

### 👑 Untuk Admin
* **Dashboard Terpusat**: Ringkasan data partisipasi, jumlah responden, dan analitik kuadran (*Importance-Performance Analysis*).
* **Manajemen Survei (CRUD)**: Buat, edit, aktifkan, arsipkan, hingga hapus permanen survei.
* **Duplikat Survei**: Fitur untuk menyalin seluruh struktur survei (bagian, pertanyaan, dan pilihan) tanpa menyalin respons.
* **Editor Kuesioner Interaktif**:
  * Pengelompokan pertanyaan berdasarkan Bagian (*Sections*).
  * *Autosave* (Simpan Otomatis) saat mengetik.
  * Penyusunan urutan (*sorting*) pertanyaan dan bagian menggunakan tombol praktis (↑/↓).
  * Dukungan berbagai tipe pertanyaan (Matriks IPA, Isian Bebas, Pilihan Ganda, Checkbox, Dropdown, dll).
* **Multi-Bahasa (i18n)**: Toggle bahasa Indonesia / English pada antarmuka *dashboard* (Sidebar).
* **Preview Mode**: Admin dapat menguji pengisian survei tanpa menyimpan data ke database.
* **Ekspor Data**: Mendukung ekspor respons ke format CSV.

### 👥 Untuk Responden (Awardee)
* **Survey Hub**: Halaman beranda yang menampilkan daftar survei aktif yang harus diisi.
* **Pengisian Multi-Step**: Formulir dibagi per bagian (*section-by-section*) agar tidak membebani responden.
* **Integrasi Profil Otomatis**: Beberapa pertanyaan spesifik (seperti Nama, Provinsi, Universitas) akan terisi otomatis mengambil dari data profil pengguna.
* **Aman & Nyaman**: Antarmuka responsif yang bersih (*clean UI*), dilengkapi petunjuk (*guideline*) dan tanya jawab (*FAQ*).

## 🛠️ Stack Teknologi

* **Frontend**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Build Tool**: [Vite](https://vitejs.dev/)
* **Routing**: [React Router DOM v6](https://reactrouter.com/)
* **Styling**: [Tailwind CSS v3](https://tailwindcss.com/)
* **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Toasts/Notifikasi**: [Sonner](https://sonner.emilkowal.ski/)
* **Internationalization**: [i18next](https://www.i18next.com/) & `react-i18next`

## 📦 Cara Instalasi & Menjalankan Lokal

1. **Clone repositori**
   ```bash
   git clone https://github.com/nghifaria/caps-lpdp-survey.git
   cd caps-lpdp-survey
   ```

2. **Install dependensi**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variable**
   Buat file `.env` di *root directory* dan tambahkan *credentials* Supabase Anda:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Jalankan Server Development**
   ```bash
   npm run dev
   ```
   Aplikasi dapat diakses melalui `http://localhost:5173`.

## 🗄️ Struktur Database Utama
Aplikasi ini memiliki beberapa entitas utama di PostgreSQL (Supabase):
* `profiles`: Data pengguna (Admin & Awardee).
* `surveys`: Entitas induk kuesioner.
* `sections`: Bagian/pengelompokan dalam survei.
* `questions`: Data spesifik pertanyaan yang menempel pada *section*.
* `responses`: Sesi respons survei yang di-submit.
* `answers`: Jawaban spesifik untuk masing-masing `questions`.

## 📄 Lisensi
Proyek ini dikembangkan secara spesifik untuk keperluan Survei Layanan Beasiswa LPDP.
