# Job Application Tracker — How the System Works

## Purpose

The application gives each authenticated user one workspace for their job search. A user can save a lead, move it through the exact workflow of **Saved**, **Applied**, **Interview**, **Offer**, **Rejected**, and **Withdrawn**, attach one or more resumes, compare their skills with a job description, and use analytics to understand their search progress.

## End-to-End User Flow

| Step | User action | System behaviour |
|---|---|---|
| 1 | Signs in with Manus OAuth | The existing OAuth flow establishes a session and exposes the authenticated user to protected backend procedures. |
| 2 | Creates an application | The backend validates the exact status value, stores the user-scoped record, and returns it to the dashboard. |
| 3 | Updates the application stage | The workflow validator prevents backwards or invalid stage transitions unless the user explicitly marks an application as Withdrawn. |
| 4 | Uploads a resume | The client sends the file to a protected endpoint. The server places the bytes in S3 and stores only metadata, storage key, and URL in the database. |
| 5 | Runs a skill match | The user provides a job description and either selects a resume or enters a skills list. The server sends only the relevant text to the LLM and requests structured JSON containing matched skills, gaps, strengths, and next actions. |
| 6 | Reviews the result | The result is stored with the application so users can compare job opportunities later. |
| 7 | Opens analytics | Aggregated, user-scoped metrics calculate monthly application activity, status distribution, response rate, and interview conversion rate. |

## Security Boundaries

All business procedures are protected. A user can only query, modify, associate, or analyze records whose `userId` matches the authenticated session. Resume bytes are stored in S3 rather than the relational database. The LLM runs only on the server, so platform credentials are never exposed to the browser.

## Core Data Model

| Entity | Role | Key relationships |
|---|---|---|
| `users` | Authenticated workspace owner supplied by Manus OAuth. | Owns applications, resumes, and skill-match history. |
| `applications` | Job opportunity and its workflow status. | Belongs to one user; can link to many resumes and skill-match results. |
| `resumes` | Metadata for an S3 object plus optional user-supplied text for analysis. | Belongs to one user; can associate with many applications. |
| `resume_applications` | Many-to-many association between resumes and applications. | Ensures one resume can support multiple opportunities. |
| `skill_matches` | Persisted structured AI comparison between job requirements and supplied skills or resume text. | Belongs to one user and one application; can reference a resume. |

## Architecture Diagram Review

The rendered architecture diagram confirms the intended boundary: the browser communicates only with protected tRPC procedures, while application records and resume metadata are persisted in the relational database. Resume bytes travel only from the protected resume service to S3. Skill matching uses a deterministic baseline on the server and may request an LLM narrative without exposing platform credentials to the client.

## AI Matching Scope

The AI matcher is an assistance feature, not a hiring recommendation engine. It identifies overlap and gaps between supplied skills or resume text and a job description. Results should be reviewed by the user, because an LLM can omit relevant context or infer relationships that are not stated in the source text.

## Status Workflow

The workflow is ordered as follows:

```text
Saved → Applied → Interview → Offer
                 ↘ Rejected
Saved / Applied / Interview / Offer → Withdrawn
```

`Rejected` and `Withdrawn` are terminal stages. `Withdrawn` is explicitly permitted from any active stage. The application preserves the exact stage names requested in the product brief.
