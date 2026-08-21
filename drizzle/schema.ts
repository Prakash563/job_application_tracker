import { index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const APPLICATION_STATUS_VALUES = [
  "Saved",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
] as const;

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "user"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const applications = mysqlTable(
  "applications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    company: varchar("company", { length: 160 }).notNull(),
    role: varchar("role", { length: 160 }).notNull(),
    location: varchar("location", { length: 160 }),
    salaryRange: varchar("salaryRange", { length: 120 }),
    applicationDate: timestamp("applicationDate").notNull(),
    status: mysqlEnum("application_status", APPLICATION_STATUS_VALUES).default("Saved").notNull(),
    notes: text("notes"),
    jobUrl: varchar("jobUrl", { length: 2048 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("applications_user_status_idx").on(table.userId, table.status),
    index("applications_user_date_idx").on(table.userId, table.applicationDate),
  ],
);

export const resumes = mysqlTable(
  "resumes",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    fileName: varchar("fileName", { length: 255 }).notNull(),
    mimeType: varchar("mimeType", { length: 120 }).notNull(),
    fileSize: int("fileSize").notNull(),
    storageKey: varchar("storageKey", { length: 512 }).notNull(),
    storageUrl: varchar("storageUrl", { length: 1024 }).notNull(),
    resumeText: text("resumeText"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("resumes_user_created_idx").on(table.userId, table.createdAt)],
);

export const resumeApplications = mysqlTable(
  "resume_applications",
  {
    id: int("id").autoincrement().primaryKey(),
    resumeId: int("resumeId").notNull().references(() => resumes.id, { onDelete: "cascade" }),
    applicationId: int("applicationId").notNull().references(() => applications.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("resume_application_unique").on(table.resumeId, table.applicationId),
    index("resume_applications_application_idx").on(table.applicationId),
  ],
);

export const skillMatches = mysqlTable(
  "skill_matches",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    applicationId: int("applicationId").notNull().references(() => applications.id, { onDelete: "cascade" }),
    resumeId: int("resumeId").references(() => resumes.id, { onDelete: "set null" }),
    sourceType: mysqlEnum("match_source", ["resume", "manual-skills"]).notNull(),
    inputSkills: text("inputSkills").notNull(),
    jobDescription: text("jobDescription").notNull(),
    matchedSkills: json("matchedSkills").notNull(),
    missingSkills: json("missingSkills").notNull(),
    strengths: json("strengths").notNull(),
    nextActions: json("nextActions").notNull(),
    summary: text("summary").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("skill_matches_user_application_idx").on(table.userId, table.applicationId)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;
export type Resume = typeof resumes.$inferSelect;
export type InsertResume = typeof resumes.$inferInsert;
export type ResumeApplication = typeof resumeApplications.$inferSelect;
export type SkillMatch = typeof skillMatches.$inferSelect;
export type InsertSkillMatch = typeof skillMatches.$inferInsert;
