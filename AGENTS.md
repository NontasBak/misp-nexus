This repository is for the creation of a frontend on top of MISP using React + Vite.

## Rules

Do not modify the source code of MISP at all at `MISP/`. I will only use the `misp-docker` instance and only make changes to the `.env` file and nothing else. The `MISP/` directory is there only for lookup on the source code of MISP.

## Architecture

The architecture will be as follows: An nginx reverse proxy sitting in front of both the frontend build and the misp backend/legacy UI. The misp instance will run at `/misp` (base url), while the frontend will run at `/`. We shouldnt have any cors issues that way. The legacy UI should be always accessible via `/misp`.

Rgarding the endpoints on the frontend, try to mirror the ones on the legacy UI. For example, viewing the event with id 2 should be `/events/view/2`.

Use tanstack router for routing, with file-based routing.

## Authentication

For authentication on the app you will use the default misp session cookies and NOT the API key. You can make requests using the API key on the terminal (using curl) using the API key to test various endpoints, but you'll use the session cookies on the actual app. The API key you can use will be provided to you (ONLY for `curl` requests, do not use it in the actual app). CSRF tokens are not required when making json requests.

## MISP API Endpoint Documentation

For help regarding the documented API endpoints, you can check `MISP/app/webroot/doc/openapi.yaml` and the PyMISP implementation at `MISP/PyMISP`. There are way more API endpoints on the source code at `MISP/` which you can look for, they are just not documented. The API documentation might also not be 100% accurate, so use `curl` to verify them.

## Design

Use tailwind v4, shadcn, shadcn mcp server, shadcn skill, tanstack table (with shadcn), tanstack query, and tanstack form (with shadcn).

Keep the UI minimal. Focus mainly on functionality rather than design. Try to mimic the look and feel of the legacy UI, like if someone where to migrate from it the app should look and feel familiar.

## Implementation process

When the user asks to implement UI functionality, you should:

1. Check the shadcn skill for guidance, as well as use the shadcn mcp server to look for components that might be useful. For complex components, do a websearch of the component's documentation.
2. Find the relevant endpoints from the legacy MISP application, both on the UI and the API. Look into `MISP/app/webroot/doc/openapi.yaml` for guidance, as well as PyMISP if it's necessary.
3. Test the backend endpoints using `curl` to verify GET/POST endpoint request/response structure since there might be noticeable differences. You don't have to get the MISP instance into a "clean" state after performing POST requests, but try not to bloat it. Cleanup only if you find it necessary. You can use the API key provided to you, but on the app the authentication must be performed via session cookies. The app MUST use json requests/responses on the frontend, but you can request html responses via `curl` if you want to see the styling of the legacy UI (for reference only).
4. Implement the UI, try to keep the code clean.
5. Check for errors, but don't build the code or run `pnpm dev`.
