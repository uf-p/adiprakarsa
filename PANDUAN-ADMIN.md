# Adiprakarsa Institut — Panduan Admin (Ringkas)

> **Panduan lengkap:** Lihat [`PANDUAN-DEPLOYMENT.md`](PANDUAN-DEPLOYMENT.md)

## Test Lokal

```bash
cd adiprakarsa-institut
npm run dev
```

Buka **http://localhost:3000/admin/** → langsung bisa edit konten tanpa login.

> Data tersimpan di **localStorage browser**. Ganti browser = data hilang.

---

## Deploy ke Netlify (Produksi)

1. Push repo ke **GitHub/GitLab**
2. Login [netlify.com](https://netlify.com) → **Add new site** → Import dari Git
3. Setelah deploy, buka **Site settings > Identity > Enable**
4. Buka **Site settings > Identity > Services > Git Gateway** → Enable
5. Buka **Site settings > Identity > Registration** → Pilih "Invite only"
6. Undang admin: **Identity > Users > Invite** → masukkan email admin
7. Admin terima email → buka link → set password → login ke `/admin/`

### Ganti Backend ke Production

Buka `config.yml` di root, ganti:

```yaml
backend:
  name: git-gateway  # ← ganti dari test-repo
  branch: main       # ← uncomment baris ini
```

Commit & push → Netlify auto-redeploy.

---

## Struktur File yang Editable oleh Admin

| File | Isi | Edit via CMS |
|---|---|---|
| `data/site/*.json` | Hero, Misi, Fokus, Tentang, Kontak, Footer | ✅ |
| `data/team/*.json` | Data per anggota tim | ✅ |
| `data/articles/*.json` | Artikel (judul, konten, chart, file) | ✅ |
| `data/articles/manifest.json` | Daftar slug artikel | ✅ |

## Shortcut

- `Ctrl+K` — Buka pencarian di website
