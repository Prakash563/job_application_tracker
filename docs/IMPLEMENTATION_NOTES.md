# Implementation Notes

## What Was Built

The Job Application Tracker is a protected personal workspace built on a React dashboard, Express, tRPC, Manus OAuth, a MySQL/TiDB database, S3 storage, and a server-side LLM integration. The pre-built `DashboardLayout` component remains the navigation shell for the Overview, Applications, Resumes, Skill match, Analytics, and Profile routes.

## Build Sequence

| Stage | Work completed | Why it matters |
|---|---|---|
| Product design | Defined the application lifecycle, data model, access boundaries, and exact workflow names. | Gives the database, UI, and validation rules one shared vocabulary. |
| Persistence | Added applications, resumes, resume-to-application links, and skill-match history tables with user ownership and foreign keys. | Keeps personal job-search data relational, traceable, and scoped to its owner. |
| Services | Added protected tRPC procedures for CRUD, S3 resume storage, deterministic matching, optional LLM narrative, and analytics. | Centralizes validation and ensures browsers never access database or LLM credentials. |
| Interface | Built dashboard pages for tracking applications, uploading resumes, comparing skills, reviewing analytics, and viewing a profile. | Translates the underlying workflow into a usable, recruiter-ready experience. |
| Quality | Added tests for status transitions, deterministic skill overlap, empty-input handling, and rate calculations. | Protects the business rules that are easiest to break during later enhancements. |

## Implementation Decisions

The exact status names remain **Saved**, **Applied**, **Interview**, **Offer**, **Rejected**, and **Withdrawn**. Active applications advance one stage at a time. `Rejected` is allowed from Saved, Applied, or Interview, and `Withdrawn` is allowed from any active stage. Terminal stages cannot be moved again without creating a new application record.

Resume file bytes are placed in S3 through the server-side storage helper. The relational database stores metadata and the S3 reference, not file contents. A many-to-many link table allows a resume version to support several applications while preserving ownership checks.

Skill matching deliberately combines two layers. The first layer is deterministic: it normalizes a fixed, documented skills vocabulary and calculates reproducible matched and missing skills. The second layer uses the server-side LLM only to write a concise explanation, evidence prompts, and next actions. If the LLM is unavailable, the deterministic result still persists and remains usable.

## Known Limitations

The first version accepts user-provided resume text for matching rather than extracting text from PDF and DOCX files. This design keeps the upload path reliable and makes the AI input explicit to the user. A future iteration can add server-side document extraction with appropriate privacy controls.

The LLM supports preparation guidance; it must not be treated as a hiring recommendation, a measure of candidate worth, or an objective assessment of eligibility. Users should verify skills and job requirements against the original materials.
