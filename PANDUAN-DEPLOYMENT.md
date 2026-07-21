# Adiprakarsa Institut — Panduan Lengkap: Penyiapan Konten & Deployment

---

## Daftar Isi

1. [Arsitektur Sistem](#1-arsitektur-sistem)
2. [Prasyarat](#2-prasyarat)
3. [Penyiapan File Konten Web Perdana](#3-penyiapan-file-konten-web-perdana)
4. [Panduan Deployment Frontend (Netlify)](#4-panduan-deployment-frontend-netlify)
5. [Panduan Deployment Backend (Decap CMS + Git Gateway)](#5-panduan-deployment-backend-decap-cms--git-gateway)
6. [Panduan Pengelolaan Konten via CMS](#6-panduan-pengelolaan-konten-via-cms)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                    ADIPRAKARSA INSTITUT                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │   Frontend   │    │  Decap CMS   │    │  Netlify  │ │
│  │  (Static)    │◄──►│  (Admin UI)  │◄──►│  Backend  │ │
│  │              │    │              │    │           │ │
│  │  HTML/CSS/JS │    │  /admin/     │    │ Identity  │ │
│  │  Tailwind    │    │  config.yml  │    │ Git GW    │ │
│  │  Chart.js    │    │              │    │           │ │
│  └──────┬───────┘    └──────────────┘    └─────┬─────┘ │
│         │                                      │       │
│         ▼                                      ▼       │
│  ┌──────────────┐                    ┌──────────────┐  │
│  │  JSON Files  │                    │   Git Repo   │  │
│  │  data/*.json │                    │   GitHub     │  │
│  └──────────────┘                    └──────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Stack & Layanan

| Komponen | Teknologi | Keterangan |
|----------|-----------|------------|
| **Frontend** | HTML Statis + Tailwind CSS CDN | Tanpa build step |
| **CMS** | Decap CMS v3 | Open-source, fork dari Netlify CMS |
| **Backend CMS** | Netlify Identity + Git Gateway | Autentikasi + write ke Git repo |
| **Hosting** | Netlify | Static site hosting |
| **Data** | JSON files | Konten disimpan di `data/*.json` |
| **Charts** | Chart.js v4 | Visualisasi data di artikel |
| **Font** | Google Fonts | Inter + Montserrat |
| **Package Mgr** | npm | Untuk script dev/build |

### Struktur File

```
adiprakarsa-institut/
├── index.html              ← Halaman utama (beranda)
├── article.html            ← Halaman detail artikel
├── articles.html           ← Direktori riset
├── config.yml              ← Decap CMS config (harus di root)
├── netlify.toml            ← Netlify build config
├── package.json            ← npm scripts
├── PANDUAN-ADMIN.md        ← Panduan admin (lama)
├── PANDUAN-DEPLOYMENT.md   ← Panduan ini
│
├── admin/
│   └── index.html          ← Decap CMS loader
│
├── css/
│   └── styles.css          ← Shared styles (article/articles pages)
│
├── js/
│   └── sync.js             ← CMS sync layer (JSON → HTML)
│
└── data/
    ├── site/
    │   ├── hero.json       ← Hero section
    │   ├── missions.json   ← Misi lembaga
    │   ├── focus.json      ← 5 bidang fokus riset
    │   ├── about.json      ← Tentang lembaga
    │   ├── contact.json    ← Informasi kontak
    │   └── footer.json     ← Footer
    ├── team/
    │   ├── winarso.json    ← Anggota tim
    │   ├── iwan-gunawan.json
    │   └── muhammad-padang.json
    ├── articles/
    │   ├── manifest.json   ← Daftar slug artikel
    │   └── *.json          ← File artikel
    └── content.json        ← Legacy (tidak dipakai)
```

---

## 2. Prasyarat

### Untuk Pengembangan Lokal

- [ ] Node.js v18+ terinstall
- [ ] Git terinstall
- [ ] Text editor (VS Code, dll)
- [ ] Browser modern (Chrome/Firefox/Edge)

### Untuk Deployment Produksi

- [ ] Akun GitHub/GitLab
- [ ] Akun Netlify (gratis tier cukup)
- [ ] Domain sendiri (opsional, bisa pakai `*.netlify.app`)
- [ ] Email aktif untuk undangan admin

---

## 3. Penyiapan File Konten Web Perdana

### 3.1 Clone Repository

```bash
git clone https://github.com/USERNAME/adiprakarsa-institut.git
cd adiprakarsa-institut
```

### 3.2 Install Dependencies

```bash
npm install
```

### 3.3 Jalankan Server Lokal

```bash
npm run dev
# atau
npx serve .
```

Buka http://localhost:3000

### 3.4 Struktur File Konten yang Perlu Disiapkan

#### A. File Hero (data/site/hero.json)

```json
{
  "badge": "Lembaga Riset · Berdiri 2026",
  "title_line1": "Kajian Kebijakan Publik",
  "title_highlight": "Berbasis Riset",
  "title_line2": "Strategis Terkini",
  "description": "Deskripsi singkat tentang lembaga...",
  "vision_label": "Visi Lembaga",
  "vision_text": "\"Visi lembaga dalam kutipan...\"",
  "cta_primary": {"text": "Akses Dokumen Riset", "url": "#direktori"},
  "cta_secondary": {"text": "Tentang Lembaga", "url": "#tentang"},
  "stats": [
    {"value": "2026", "label": "Tahun Pendirian", "sublabel": "Lembaga"},
    {"value": "5", "label": "Bidang Fokus", "sublabel": "Kajian Strategis"},
    {"value": "2030", "label": "Target Agenda", "sublabel": "Riset Nasional"}
  ],
  "agenda_card": {
    "label": "Agenda Riset",
    "title": "Judul Agenda",
    "status": "Aktif",
    "items": [
      {"name": "Bidang 1", "status": "Dalam Kajian", "percent": 75, "color": "gold"}
    ],
    "team_initials": [
      {"initials": "WN", "color": "navy"}
    ],
    "team_names": "Winarso, Iwan, dkk."
  }
}
```

#### B. File Misi (data/site/missions.json)

```json
[
  {"mission": "Misi pertama lembaga"},
  {"mission": "Misi kedua lembaga"},
  {"mission": "Misi ketiga lembaga"}
]
```

#### C. File Fokus Riset (data/site/focus.json)

```json
{
  "section_label": "Fokus Riset",
  "title": "Lima Bidang Kajian Strategis",
  "description": "Deskripsi singkat tentang fokus riset...",
  "items": [
    {
      "title": "Kebijakan Fiskal & Anggaran",
      "description": "Deskripsi bidang fiskal...",
      "status": "Dalam Kajian",
      "status_type": "active",
      "icon": "currency"
    }
  ],
  "cta_card": {
    "label": "Bersama Membangun",
    "title": "Ajakan Kolaborasi",
    "description": "Teks ajakan kolaborasi...",
    "button_text": "Hubungi Kami",
    "button_url": "#kontak"
  }
}
```

**Pilihan icon:** `currency`, `people`, `building`, `map`, `globe`
**Pilihan status_type:** `active` (hijau), `pipeline` (biru)

#### D. File Tentang (data/site/about.json)

```json
{
  "section_label": "Tentang Lembaga",
  "title": "Profil Adiprakarsa Institut",
  "paragraphs": [
    {"p": "Paragraf deskripsi pertama..."},
    {"p": "Paragraf deskripsi kedua..."}
  ],
  "values": [
    {"title": "Independen", "description": "Tidak berafiliasi politik"},
    {"title": "Metodologis", "description": "Berbasis data dan bukti"}
  ],
  "profile": [
    {"label": "Tahun Berdiri", "value": "2026"},
    {"label": "Domisili", "value": "Bandung, Jawa Barat"},
    {"label": "Bidang Utama", "value": "Kebijakan Publik"}
  ]
}
```

#### E. File Tim (data/team/*.json)

Buat satu file per anggota tim. Nama file = ID tim (huruf kecil, strip).

```json
{
  "id": "winarso",
  "name": "Winarso, S.S.T., M.A.P.",
  "role": "Direktur Eksekutif",
  "initials": "WN",
  "color": "navy",
  "bio": "Bio singkat tentang keahlian...",
  "photo": ""
}
```

**Pilihan warna avatar:** `navy`, `navy-alt`, `emerald`, `gold`
**Kosongkan `photo`** untuk menggunakan inisial sebagai avatar.

#### F. File Kontak (data/site/contact.json)

```json
{
  "section_label": "Kontak",
  "title": "Hubungi Kami",
  "description": "Deskripsi singkat...",
  "address": "Alamat lengkap lembaga",
  "email": "info@adiprakarsa-institut.or.id",
  "hours": "Senin–Jumat, 08.00–17.00 WIB",
  "collab_card": {
    "label": "Kolaborasi",
    "text": "Teks ajakan kolaborasi..."
  }
}
```

#### G. File Footer (data/site/footer.json)

```json
{
  "description": "Deskripsi singkat untuk footer...",
  "copyright": "© 2026 Lembaga Riset Nusantara Adhi Prakarsa (Adiprakarsa Institut). Seluruh hak cipta dilindungi.",
  "directories_title": "Direktori Riset",
  "directories_links": [
    {"text": "Kebijakan Fiskal & Anggaran", "url": "#fokus-riset"}
  ],
  "about_title": "Tentang Lembaga",
  "about_links": [
    {"text": "Sejarah & Pendirian", "url": "#tentang"}
  ],
  "contact_title": "Kontak",
  "legal_links": [
    {"text": "Kebijakan Privasi", "url": "#"},
    {"text": "Syarat Penggunaan", "url": "#"}
  ]
}
```

#### H. File Manifest Artikel (data/articles/manifest.json)

```json
{
  "articles": [
    "slug-artikel-pertama",
    "slug-artikel-kedua"
  ]
}
```

**Penting:** Tambahkan slug artikel di sini SETELAH membuat artikel baru.

#### I. File Artikel (data/articles/*.json)

```json
{
  "slug": "judul-artikel",
  "title": "Judul Artikel Lengkap",
  "excerpt": "Ringkasan 1-2 kalimat...",
  "content": "## Pendahuluan\n\nIsi konten dalam format Markdown...\n\n## Temuan Utama\n\n1. Temuan pertama\n2. Temuan kedua",
  "author": "Nama Penulis, Gelar",
  "date": "2026-07-15",
  "sector": "fiskal",
  "scope": "Nasional",
  "status": "draft",
  "reading_time": "12 menit",
  "charts": [
    {
      "id": "chart-unique-id",
      "title": "Judul Grafik",
      "type": "bar",
      "labels": ["2020", "2021", "2022"],
      "datasets": [
        {
          "label": "Nama Legend",
          "data": [10, 20, 30],
          "backgroundColor": "rgba(13, 27, 42, 0.8)"
        }
      ]
    }
  ],
  "attachments": [
    {
      "name": "Nama File.pdf",
      "file": "/uploads/nama-file.pdf",
      "size": "2.4 MB",
      "type": "pdf"
    }
  ],
  "references": [
    "Referensi pertama",
    "Referensi kedua"
  ]
}
```

**Pilihan sektor:** `fiskal`, `sosial`, `tatakelola`, `infrastruktur`, `lingkungan`
**Pilihan status:** `draft`, `review`, `final`
**Pilihan tipe chart:** `bar`, `line`, `pie`, `doughnut`, `scatter`, `radar`, `polarArea`
**Pilihan tipe file:** `pdf`, `excel`, `powerpoint`, `word`, `other`

### 3.5 Upload File (PDF, Excel, PowerPoint)

1. Letakkan file di folder `uploads/`
2. Referensikan di artikel dengan path `/uploads/nama-file.pdf`
3. Pastikan CORS header diaktifkan di `netlify.toml`

### 3.6 Verifikasi Konten

Buka http://localhost:3000 dan pastikan:

- [ ] Hero section tampil dengan benar
- [ ] Misi lembaga muncul
- [ ] 5 bidang fokus riset tampil
- [ ] Section tentang lembaga ada
- [ ] Tim peneliti muncul
- [ ] Informasi kontak benar
- [ ] Footer lengkap
- [ ] Artikel bisa diakses dari direktori

---

## 4. Panduan Deployment Frontend (Netlify)

### 4.1 Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit: Adiprakarsa Institut v1.0"
git branch -M main
git remote add origin https://github.com/USERNAME/adiprakarsa-institut.git
git push -u origin main
```

### 4.2 Deploy ke Netlify

1. Buka [app.netlify.com](https://app.netlify.com)
2. Klik **"Add new site"** → **"Import an existing project"**
3. Pilih **GitHub** → authorize Netlify
4. Pilih repository `adiprakarsa-institut`
5. Konfigurasi build:
   - **Branch to deploy:** `main`
   - **Build command:** `echo 'Static site - no build needed'`
   - **Publish directory:** `.`
6. Klik **"Deploy site"**

### 4.3 Konfigurasi Domain (Opsional)

1. Buka **Site settings** → **Domain management**
2. Klik **"Add custom domain"**
3. Masukkan domain (contoh: `adiprakarsa-institut.or.id`)
4. Update DNS di registrar domain:
   - Type: `CNAME`
   - Name: `@` atau `www`
   - Value: `YOUR-SITE.netlify.app`
5. Aktifkan HTTPS (otomatis via Let's Encrypt)

### 4.4 Verifikasi Deploy

Buka `https://YOUR-SITE.netlify.app` dan pastikan:

- [ ] Beranda tampil dengan benar
- [ ] Artikel bisa diakses
- [ ] JSON data loaded
- [ ] Tidak ada error di console

---

## 5. Panduan Deployment Backend (Decap CMS + Git Gateway)

### 5.1 Aktifkan Netlify Identity

1. Buka **Site settings** → **Identity**
2. Klik **"Enable Identity"**
3. Konfigurasi:
   - **Registration:** Invite only (recommended)
   - **Emails:** Custom (gunakan Netlify) atau Third-party (Mailgun, SendGrid)
   - **Git Gateway:** Enable

### 5.2 Aktifkan Git Gateway

1. Buka **Site settings** → **Identity** → **Services** → **Git Gateway**
2. Klik **"Enable Git Gateway"**
3. Netlify akan otomatis generate access token untuk GitHub/GitLab

### 5.3 Konfigurasi CMS Backend

Buka `config.yml` di root repository:

```yaml
backend:
  name: git-gateway
  branch: main

media_folder: "uploads"
public_folder: "/uploads"
publish_mode: editorial_workflow
```

**Commit & push** perubahan ini:

```bash
git add config.yml
git commit -m "Switch CMS backend to git-gateway for production"
git push
```

### 5.4 Undang Admin

1. Buka **Site settings** → **Identity** → **Users**
2. Klik **"Invite"**
3. Masukkan email admin (contoh: `admin@adiprakarsa-institut.or.id`)
4. Admin terima email → klik link → set password
5. Admin bisa login ke `https://YOUR-SITE.netlify.app/admin/`

### 5.5 Verifikasi CMS

1. Buka `https://YOUR-SITE.netlify.app/admin/`
2. Login dengan email + password yang sudah diset
3. Pastikan bisa:
   - [ ] Edit konten hero
   - [ ] Edit misi lembaga
   - [ ] Edit fokus riset
   - [ ] Tambah/edit tim peneliti
   - [ ] Buat artikel baru
   - [ ] Upload file lampiran

---

## 6. Panduan Pengelolaan Konten via CMS

### 6.1 Edit Konten Halaman

1. Login ke `/admin/`
2. Pilih collection yang ingin diedit:
   - **Beranda (Hero & Visi)** — Edit hero section
   - **Misi Lembaga** — Edit poin-poin misi
   - **Fokus Riset (5 Bidang)** — Edit bidang kajian
   - **Tentang Lembaga** — Edit profil & nilai
   - **Tim Peneliti** — Tambah/edit anggota tim
   - **Kontak & Informasi** — Edit info kontak
   - **Footer Situs** — Edit footer
3. Klik **"Publish"** untuk menyimpan perubahan

### 6.2 Buat Artikel Baru

1. Buka `/admin/` → **File Artikel** → **New File Artikel**
2. Isi field:
   - **Slug URL:** `judul-artikel` (huruf kecil, strip)
   - **Judul Artikel:** Judul lengkap
   - **Ringkasan:** 1-2 kalimat
   - **Konten Artikel:** Tulis dalam format Markdown
   - **Penulis:** Nama lengkap + gelar
   - **Tanggal Publikasi:** Pilih tanggal
   - **Sektor:** Pilih dari dropdown
   - **Status:** Draft/Review/Final
3. Tambah **Grafik** (opsional):
   - Klik "Add Item" di bagian Grafik
   - Pilih tipe chart (bar/line/pie/dll)
   - Isi labels dan data
4. Tambah **Lampiran** (opsional):
   - Upload file PDF/Excel/PPT
5. Klik **"Publish"**
6. **PENTING:** Tambahkan slug artikel ke `data/articles/manifest.json`:
   - Buka **Daftar Artikel (Manifest)**
   - Tambah slug yang baru dibuat
   - Publish

### 6.3 Workflow Editorial

Sistem menggunakan **editorial workflow**:

1. **Draft** — Artikel dalam proses penulisan
2. **Review** — Artikel dikirim untuk review
3. **Final** — Artikel sudah siap dipublikasikan

Perubahan konten melewati proses approval sebelum merge ke branch utama.

### 6.4 Upload File

1. Buka artikel yang ingin ditambah lampiran
2. Scroll ke bagian **Lampiran File**
3. Klik **"Choose File"** atau drag & drop
4. File tersimpan di folder `uploads/`
5. Publish artikel

---

## 7. Troubleshooting

### Masalah Umum

#### CMS tidak bisa login

**Solusi:**
- Pastikan Netlify Identity sudah aktif
- Pastikan Git Gateway sudah aktif
- Pastikan user sudah diundang via Identity > Users
- Cek email untuk link setup password

#### Konten tidak update setelah edit di CMS

**Solusi:**
- Pastikan sudah klik **"Publish"** (bukan hanya "Save")
- Cek branch yang benar di `config.yml` (`branch: main`)
- Tunggu beberapa detik untuk Netlify rebuild

#### Artikel tidak muncul di direktori

**Solusi:**
- Pastikan slug sudah ditambahkan ke `data/articles/manifest.json`
- Pastikan file artikel ada di `data/articles/*.json`
- Pastikan field `status` bukan `draft` jika ingin tampil

#### JSON data tidak load

**Solusi:**
- Cek CORS header di `netlify.toml`
- Pastikan path file JSON benar
- Buka DevTools > Network untuk cek response

#### Admin link tidak muncul di website

**Solusi:**
- Pastikan admin link ada di `index.html`:
  ```html
  <a href="/admin/" id="admin-link">⚙ Admin Panel</a>
  ```
- Cek CSS styling untuk admin link

### Reset Password Admin

1. Buka `/admin/`
2. Klik **"Forgot password?"**
3. Masukkan email admin
4. Cek email untuk link reset
5. Set password baru

### Backup Data

**Local (test-repo):**
- Data tersimpan di localStorage browser
- Export: DevTools > Application > Local Storage > copy data
- Import: paste data ke localStorage di browser baru

**Production (git-gateway):**
- Data tersimpan di Git repository
- Backup otomatis via Git history
- Manual backup: clone repository

---

## Checklist Penyiapan Produksi

- [ ] Semua file konten JSON sudah diisi
- [ ] Logo/branding sudah sesuai
- [ ] Email kontak sudah benar
- [ ] Domain sudah dikonfigurasi
- [ ] HTTPS aktif
- [ ] Netlify Identity aktif
- [ Git Gateway aktif
- [ ] Admin sudah diundang
- [ ] CMS bisa diakses
- [ ] Artikel pertama sudah dibuat
- [ ] File lampiran sudah diupload
- [ ] Semua link berfungsi
- [ ] Mobile responsive
- [ ] SEO meta tags sudah benar

---

## Kontak Support

- **Netlify Support:** [https://www.netlify.com/support/](https://www.netlify.com/support/)
- **Decap CMS Docs:** [https://decapcms.org/docs/](https://decapcms.org/docs/)
- **Netlify Identity Docs:** [https://docs.netlify.com/identity/overview/](https://docs.netlify.com/identity/overview/)

---

*Terakhir diperbarui: 19 Juli 2026*
*Adiprakarsa Institut — Lembaga Riset Nusantara Adhi Prakarsa*
