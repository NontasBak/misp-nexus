# MISP Nexus

Rebuilding the MISP UI from scratch, using React + Vite

## Local Proxy Layout

The root `docker-compose.yml` includes the upstream `misp-docker` compose file and adds `nexus-nginx` in front of both apps:

- Frontend: `http://localhost/`
- MISP backend and legacy UI: `http://localhost/misp/`
- Direct MISP debug ports: `http://localhost:8081/` and `https://localhost:8443/`

The frontend should call MISP with relative `/misp/...` URLs and `credentials: "include"` so the standard MISP session cookie is used.

## Clone repository

The repository contains submodules, so make sure you clone them as well:

```bash
git clone git@github.com:NontasBak/misp-nexus.git
git submodule update --init
```

## Configure MISP Docker

Do not edit the `misp-docker/` submodule directly. Copy the root env example into it when preparing a local run:

```bash
cp misp-docker.env.example misp-docker/.env
```

The example keeps the upstream `misp-docker` env structure intact, sets `BASE_URL=http://localhost` so MISP runs at `/` internally, disables HTTPS-only cookies for local HTTP development, and moves direct MISP ports to `8081/8443` so the root proxy can own port `80`. The root nginx proxy exposes the legacy UI externally at `/misp`.

## Run

Build the frontend first because nginx serves `frontend/dist`:

```bash
cd frontend
pnpm install
pnpm run build

cd ..
docker compose up -d
```
