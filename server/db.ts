import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  applications,
  InsertApplication,
  InsertResume,
  InsertSkillMatch,
  InsertUser,
  resumeApplications,
  resumes,
  skillMatches,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

function requireDb<T>(db: T | null): T {
  if (!db) throw new Error("Database connection is unavailable.");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listApplicationsForUser(userId: number) {
  const db = requireDb(await getDb());
  return db.select().from(applications).where(eq(applications.userId, userId)).orderBy(desc(applications.updatedAt));
}

export async function getApplicationForUser(userId: number, applicationId: number) {
  const db = requireDb(await getDb());
  const result = await db
    .select()
    .from(applications)
    .where(and(eq(applications.userId, userId), eq(applications.id, applicationId)))
    .limit(1);
  return result[0];
}

export async function createApplicationForUser(userId: number, input: Omit<InsertApplication, "id" | "userId" | "createdAt" | "updatedAt">) {
  const db = requireDb(await getDb());
  const result = await db.insert(applications).values({ ...input, userId });
  return getApplicationForUser(userId, Number(result[0].insertId));
}

export async function updateApplicationForUser(
  userId: number,
  applicationId: number,
  input: Partial<Omit<InsertApplication, "id" | "userId" | "createdAt" | "updatedAt">>,
) {
  const db = requireDb(await getDb());
  await db
    .update(applications)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(applications.userId, userId), eq(applications.id, applicationId)));
  return getApplicationForUser(userId, applicationId);
}

export async function deleteApplicationForUser(userId: number, applicationId: number) {
  const db = requireDb(await getDb());
  await db.delete(applications).where(and(eq(applications.userId, userId), eq(applications.id, applicationId)));
}

export async function listResumesForUser(userId: number) {
  const db = requireDb(await getDb());
  return db.select().from(resumes).where(eq(resumes.userId, userId)).orderBy(desc(resumes.createdAt));
}

export async function getResumeForUser(userId: number, resumeId: number) {
  const db = requireDb(await getDb());
  const result = await db.select().from(resumes).where(and(eq(resumes.userId, userId), eq(resumes.id, resumeId))).limit(1);
  return result[0];
}

export async function createResumeForUser(userId: number, input: Omit<InsertResume, "id" | "userId" | "createdAt" | "updatedAt">) {
  const db = requireDb(await getDb());
  const result = await db.insert(resumes).values({ ...input, userId });
  return getResumeForUser(userId, Number(result[0].insertId));
}

export async function linkResumeToApplicationForUser(userId: number, resumeId: number, applicationId: number) {
  const db = requireDb(await getDb());
  const [resume, application] = await Promise.all([
    getResumeForUser(userId, resumeId),
    getApplicationForUser(userId, applicationId),
  ]);
  if (!resume || !application) throw new Error("Resume or application was not found.");
  await db.insert(resumeApplications).values({ resumeId, applicationId }).onDuplicateKeyUpdate({ set: { applicationId } });
}

export async function listApplicationResumeIdsForUser(userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select({ applicationId: resumeApplications.applicationId, resumeId: resumeApplications.resumeId })
    .from(resumeApplications)
    .innerJoin(resumes, eq(resumeApplications.resumeId, resumes.id))
    .where(eq(resumes.userId, userId));
  return rows;
}

export async function listSkillMatchesForApplication(userId: number, applicationId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(skillMatches)
    .where(and(eq(skillMatches.userId, userId), eq(skillMatches.applicationId, applicationId)))
    .orderBy(desc(skillMatches.createdAt));
}

export async function createSkillMatchForUser(userId: number, input: Omit<InsertSkillMatch, "id" | "userId" | "createdAt">) {
  const db = requireDb(await getDb());
  const result = await db.insert(skillMatches).values({ ...input, userId });
  const record = await db.select().from(skillMatches).where(eq(skillMatches.id, Number(result[0].insertId))).limit(1);
  return record[0];
}
