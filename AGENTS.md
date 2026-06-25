This repository is for the creation of a frontend on top of MISP using React + Vite.

## Rules

Do not modify the source code of MISP at all at `MISP/`. I will only use the `misp-docker` instance and only make changes to the `.env` file and nothing else. The `MISP/` directory is there only for lookup on the source code of MISP.

## Architecture

The architecture will be as follows: An nginx reverse proxy sitting in front of both the frontend build and the misp backend/legacy UI. The misp instance will run at `/misp` (base url), while the frontend will run at `/`. We shouldnt have any cors issues that way. The legacy UI should be always accessible via `/misp`.

Rgarding the endpoints on the frontend, try to mirror the ones on the legacy UI. For example, viewing the event with id 2 should be `/events/view/2`.

## Authentication

For authentication on the app you will use the default misp session cookies and NOT the API key. You can make requests using the API key on the terminal (using curl) using the API key to test various endpoints, but you'll use the session cookies on the actual app. The API key you can use is `ANo7vFPDAxIs0HxbvSuAW9UDCzrsKER3wF0ng3L2` (ONLY for `curl` requests, do not use it in the actual app). CSRF tokens are not required when making json requests.

## Documentation

For help regarding the documented API endpoints, you can check `MISP/app/webroot/doc/openapi.yaml` and the PyMISP implementation at `MISP/PyMISP`. There are way more API endpoints on the source code at `MISP/` which you can look for, they are just not documented. The API documentation might also not be 100% accurate, so use `curl` to verify them.

## Design

Use tailwind v4, shadcn, shadcn mcp server (if available), shadcn skill, tanstack table (with shadcn) and tanstack query. Keep the UI minimal.
