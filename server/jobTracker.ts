import { APPLICATION_STATUS_VALUES } from "../drizzle/schema";

export const APPLICATION_STATUSES = APPLICATION_STATUS_VALUES;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

const ACTIVE_STATUS_ORDER: ApplicationStatus[] = ["Saved", "Applied", "Interview", "Offer"];
const TERMINAL_STATUSES: ApplicationStatus[] = ["Rejected", "Withdrawn"];

export function isApplicationStatus(value: string): value is ApplicationStatus {
  return APPLICATION_STATUSES.includes(value as ApplicationStatus);
}

export function isAllowedStatusTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  if (from === to) return true;
  if (TERMINAL_STATUSES.includes(from)) return false;
  if (to === "Withdrawn") return true;
  if (to === "Rejected") return from === "Saved" || from === "Applied" || from === "Interview";

  const fromIndex = ACTIVE_STATUS_ORDER.indexOf(from);
  const toIndex = ACTIVE_STATUS_ORDER.indexOf(to);
  return fromIndex >= 0 && toIndex === fromIndex + 1;
}

export function calculateSearchMetrics(statuses: ApplicationStatus[]) {
  const total = statuses.length;
  const responses = statuses.filter(status => ["Interview", "Offer", "Rejected"].includes(status)).length;
  const interviews = statuses.filter(status => ["Interview", "Offer"].includes(status)).length;
  const applied = statuses.filter(status => ["Applied", "Interview", "Offer", "Rejected"].includes(status)).length;

  return {
    totalApplications: total,
    responseRate: applied ? Math.round((responses / applied) * 100) : 0,
    interviewConversionRate: applied ? Math.round((interviews / applied) * 100) : 0,
  };
}

const SKILL_TERMS = [
  "python", "sql", "excel", "tableau", "power bi", "pandas", "numpy", "scikit-learn", "machine learning", "statistics",
  "data analysis", "data visualization", "a/b testing", "experimentation", "forecasting", "etl", "data modeling", "postgresql",
  "mysql", "mongodb", "aws", "azure", "gcp", "docker", "kubernetes", "git", "github", "linux", "rest api", "graphql",
  "fastapi", "django", "flask", "react", "typescript", "javascript", "html", "css", "node.js", "java", "c++", "c#",
  "project management", "agile", "scrum", "stakeholder management", "communication", "leadership", "salesforce", "figma",
] as const;

function hasTerm(text: string, term: string) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp(`(^|[^a-z0-9+#.])${escaped}(?=$|[^a-z0-9+#.])`, "i").test(text);
}

export function buildDeterministicSkillBaseline(candidateText: string, jobDescription: string) {
  const candidateSkills = SKILL_TERMS.filter(term => hasTerm(candidateText, term));
  const requiredSkills = SKILL_TERMS.filter(term => hasTerm(jobDescription, term));
  const matchedSkills = requiredSkills.filter(term => candidateSkills.includes(term));
  const missingSkills = requiredSkills.filter(term => !candidateSkills.includes(term));
  return { candidateSkills, requiredSkills, matchedSkills, missingSkills };
}
