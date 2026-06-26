# MISP Nexus

Rebuilding the MISP UI with React + Vite.

## Overview

- Frontend: `http://localhost/`
- MISP + legacy UI: `http://localhost/misp/`
- Direct MISP debug ports: `http://localhost:8081/` and `https://localhost:8443/`
- Frontend requests should use relative `/misp/...` URLs
- Authentication uses the standard MISP session cookie

```mermaid
flowchart TB
    Browser[Browser]
    Nginx[nexus-nginx]
    Frontend[Frontend build\nReact + Vite]
    Backend[MISP backend + legacy UI]

    Browser --> Nginx
    Nginx -->|/| Frontend
    Nginx -->|/misp| Backend
```

## Setup

- Clone with submodules:

```bash
git clone git@github.com:NontasBak/misp-nexus.git
git submodule update --init
```

- Create the MISP Docker env file:

```bash
cp misp-docker.env.example misp-docker/.env
```

## Run

```bash
cd frontend
pnpm install
pnpm build # or `pnpm dev` for development

cd ..
docker compose up -d
```
