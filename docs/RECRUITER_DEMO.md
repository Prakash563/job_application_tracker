# Recruiter Demo and Production Application Paths

## Purpose

The repository now contains two intentional ways to experience Career Compass. The public recruiter demo removes the login wall and runs as a static GitHub Pages site. The original full-stack project remains the production path for real authentication, private records, S3 resume storage, and server-side AI explanations.

| Path | Audience | Data handling | Authentication | Hosting |
|---|---|---|---|---|
| `recruiter-demo/` | Recruiters and portfolio reviewers | Browser-local application and resume metadata only | None | GitHub Pages |
| Existing `client/` + `server/` app | Real users | Database records, S3 objects, server-side analysis | Manus OAuth | Managed full-stack host |

## Recruiter Testing Flow

The public demo is intentionally no-login. A reviewer can create an application, move it through the exact stages **Saved**, **Applied**, **Interview**, **Offer**, **Rejected**, and **Withdrawn**, select a local resume file to store its name and size in the browser, and use the Skill Lab to inspect a deterministic keyword comparison.

No file bytes, typed skills, applications, or analytics leave the browser in the public demo. Clearing browser data removes the local walkthrough state.

## Verified Public Demo Interaction

The standalone demo was tested without authentication. A browser-local application was created successfully, appeared in the workflow list, and was moved from **Saved** to **Interview** through the public interface. The test record existed only in the local browser state and was not inserted into the production database.

The Skill Lab was also verified using explicitly entered skills. It identified five matched recognised requirements and two gaps from the supplied description, producing a 71% coverage score entirely in the browser.

## Live Deployment Verification

The GitHub Pages workflow completed successfully and the public recruiter demo is live at [https://prakash563.github.io/job_application_tracker/](https://prakash563.github.io/job_application_tracker/). The live site was opened without authentication and its **Application lab** navigation rendered the local browser workflow controls correctly.

## Production Boundaries

The GitHub Pages demo does not claim to implement real authentication or cloud persistence. Those capabilities remain in the authenticated full-stack source, where protected procedures scope data to the signed-in user, S3 stores resume bytes, and the server performs the AI explanation layer.

## Local Commands

```bash
pnpm dev:pages
pnpm build:pages
pnpm preview:pages
```

The GitHub Actions workflow builds `recruiter-demo/` and deploys only `dist-pages/`; it does not deploy the production server.
