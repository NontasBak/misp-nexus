# MISP Nexus

React + Vite frontend for MISP, served behind one nginx reverse proxy.

## Local Proxy Layout

The root `docker-compose.yml` includes the upstream `misp-docker` compose file and adds `nexus-nginx` in front of both apps:

- Frontend: `http://localhost/`
- MISP backend and legacy UI: `http://localhost/misp/`
- Direct MISP debug ports: `http://localhost:8081/` and `https://localhost:8443/`

The frontend should call MISP with relative `/misp/...` URLs and `credentials: "include"` so the standard MISP session cookie is used.

## Configure MISP Docker

Do not edit the `misp-docker/` submodule directly. Copy the root env example into it when preparing a local run:

```bash
cp misp-docker.env.example misp-docker/.env
```

The example keeps the upstream `misp-docker` env structure intact, sets `BASE_URL=http://localhost/misp`, disables HTTPS-only cookies for local HTTP development, and moves direct MISP ports to `8081/8443` so the root proxy can own port `80`.

## Run

Build the frontend first because nginx serves `frontend/dist`:

```bash
npm --prefix frontend install
npm --prefix frontend run build
docker compose up -d
```
