# HD Upscale · cryfsall

Website upscale gambar ke 1080p (Wink AI) dengan tema skeuomorphism.

## Deploy ke Vercel

1. Push folder ini ke GitHub (atau import langsung di Vercel).
2. Di **Vercel → Project → Settings → Environment Variables**:
   - Name: `JAKY_API_KEY`
   - Value: API key kamu dari [api.jaky.dev](https://api.jaky.dev)
   - Environment: Production, Preview, Development
3. Deploy.

API key **tidak** pernah ke browser — request lewat `/api/upscale` (serverless function).

## Lokal (opsional)

```bash
# install Vercel CLI
npm i -g vercel

# set env
cp .env.example .env
# edit .env → isi JAKY_API_KEY

vercel dev
```

Buka http://localhost:3000

## Fitur

- Header + logo + hamburger
- Navbar floating glass: HD · History · Developed
- Upscale via URL atau galeri (upload sementara → API)
- History tersimpan di localStorage
- Developed: cryfsall
