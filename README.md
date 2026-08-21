# Career Compass — Job Application Tracker

Career Compass is a job-search command center designed as both a recruiter-facing portfolio demo and a separately deployable full-stack application.

## Two Ways to Explore the Project

| Experience | Best for | Authentication and data |
|---|---|---|
| **GitHub Pages recruiter demo** | Recruiters, hiring managers, and portfolio review | No login. Interactive records remain in the visitor’s browser only. |
| **Authenticated production application** | Real users managing a private job search | Manus OAuth, user-scoped database records, S3 resumes, and server-side AI explanations. |

The public demo source lives in [`recruiter-demo/`](recruiter-demo/). It includes an application workflow lab, local browser persistence, local resume metadata, deterministic skill-gap comparison, analytics, and an architecture explanation without requiring any sign-in.

## Public Recruiter Demo

When GitHub Pages is enabled, visit:

```text
https://prakash563.github.io/job_application_tracker/
```

The public demo intentionally does **not** collect user data or upload resume files. It is a browser-only walkthrough, not a replacement for the production application.

## Full-Stack Product Capabilities

| Capability | Production implementation |
|---|---|
| Protected workspace | Manus OAuth and protected tRPC procedures scope every record to the signed-in user. |
| Application tracking | Exact workflow: **Saved**, **Applied**, **Interview**, **Offer**, **Rejected**, and **Withdrawn**. |
| Resume management | Resume file bytes are stored in S3; metadata and associations live in the relational database. |
| Skill matching | Deterministic skill overlap and gap calculation with an optional server-side AI explanation. |
| Analytics | Applications by month, status distribution, response rate, and interview conversion rate. |

## Architecture and Documentation

The repository includes the following supporting material:

- [`docs/PROJECT_WORKFLOW.md`](docs/PROJECT_WORKFLOW.md) for the end-to-end product workflow.
- [`docs/IMPLEMENTATION_NOTES.md`](docs/IMPLEMENTATION_NOTES.md) for technical decisions and limitations.
- [`docs/RECRUITER_DEMO.md`](docs/RECRUITER_DEMO.md) for public-demo boundaries and testing instructions.
- [`docs/architecture.png`](docs/architecture.png) for the full-stack architecture diagram.

## Commands

```bash
# Authenticated, full-stack application
pnpm dev
pnpm test
pnpm check

# No-login GitHub Pages recruiter demo
pnpm dev:pages
pnpm build:pages
pnpm preview:pages
```

## Important Boundaries

GitHub Pages is static hosting, so the public demo cannot run the production server, real authentication, database, S3 uploads, or server-side LLM calls. Those remain part of the separately deployable full-stack path. The public demo is deliberately transparent about this distinction.
