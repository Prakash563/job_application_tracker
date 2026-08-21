import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createApplicationForUser,
  createResumeForUser,
  createSkillMatchForUser,
  deleteApplicationForUser,
  getApplicationForUser,
  getResumeForUser,
  linkResumeToApplicationForUser,
  listApplicationResumeIdsForUser,
  listApplicationsForUser,
  listResumesForUser,
  listSkillMatchesForApplication,
  updateApplicationForUser,
} from "../db";
import { invokeLLM, listLLMModels } from "../_core/llm";
import { storagePut } from "../storage";
import { APPLICATION_STATUSES, buildDeterministicSkillBaseline, calculateSearchMetrics, isAllowedStatusTransition } from "../jobTracker";
import { protectedProcedure, router } from "../_core/trpc";

const applicationInput = z.object({
  company: z.string().trim().min(1).max(160),
  role: z.string().trim().min(1).max(160),
  location: z.string().trim().max(160).optional().nullable(),
  salaryRange: z.string().trim().max(120).optional().nullable(),
  applicationDate: z.coerce.date(),
  status: z.enum(APPLICATION_STATUSES),
  notes: z.string().trim().max(10000).optional().nullable(),
  jobUrl: z.string().trim().url().max(2048).optional().nullable().or(z.literal("")),
});

function nullableText(value: string | null | undefined) {
  return value?.trim() ? value.trim() : null;
}

function normaliseApplicationInput(input: z.infer<typeof applicationInput>) {
  return {
    ...input,
    location: nullableText(input.location),
    salaryRange: nullableText(input.salaryRange),
    notes: nullableText(input.notes),
    jobUrl: nullableText(input.jobUrl),
  };
}

function sanitiseFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120) || "resume-file";
}

function decodeBase64(value: string) {
  const raw = value.includes(",") ? value.split(",").pop() ?? "" : value;
  return Buffer.from(raw, "base64");
}

const matchSchema = {
  name: "job_skill_match",
  strict: true,
  schema: {
    type: "object",
    properties: {
      matchedSkills: { type: "array", items: { type: "string" } },
      missingSkills: { type: "array", items: { type: "string" } },
      strengths: { type: "array", items: { type: "string" } },
      nextActions: { type: "array", items: { type: "string" } },
      summary: { type: "string" },
    },
    required: ["matchedSkills", "missingSkills", "strengths", "nextActions", "summary"],
    additionalProperties: false,
  },
} as const;

export const jobTrackerRouter = router({
  applications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const [items, links] = await Promise.all([
        listApplicationsForUser(ctx.user.id),
        listApplicationResumeIdsForUser(ctx.user.id),
      ]);
      const resumeIdsByApplication = links.reduce<Record<number, number[]>>((accumulator, link) => {
        accumulator[link.applicationId] = [...(accumulator[link.applicationId] ?? []), link.resumeId];
        return accumulator;
      }, {});
      return items.map(item => ({ ...item, resumeIds: resumeIdsByApplication[item.id] ?? [] }));
    }),
    create: protectedProcedure.input(applicationInput).mutation(async ({ ctx, input }) => {
      return createApplicationForUser(ctx.user.id, normaliseApplicationInput(input));
    }),
    update: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), data: applicationInput }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getApplicationForUser(ctx.user.id, input.id);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found." });
        if (!isAllowedStatusTransition(existing.status, input.data.status)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `The transition from ${existing.status} to ${input.data.status} is not allowed.`,
          });
        }
        return updateApplicationForUser(ctx.user.id, input.id, normaliseApplicationInput(input.data));
      }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const existing = await getApplicationForUser(ctx.user.id, input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found." });
      await deleteApplicationForUser(ctx.user.id, input.id);
      return { success: true };
    }),
  }),

  resumes: router({
    list: protectedProcedure.query(({ ctx }) => listResumesForUser(ctx.user.id)),
    upload: protectedProcedure
      .input(z.object({
        fileName: z.string().trim().min(1).max(255),
        mimeType: z.enum(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]),
        fileBase64: z.string().min(1),
        resumeText: z.string().trim().max(20000).optional().nullable(),
        applicationIds: z.array(z.number().int().positive()).max(20).default([]),
      }))
      .mutation(async ({ ctx, input }) => {
        const bytes = decodeBase64(input.fileBase64);
        if (!bytes.length || bytes.length > 5 * 1024 * 1024) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Resume files must be between 1 byte and 5 MB." });
        }
        const stored = await storagePut(
          `resumes/${ctx.user.id}/${Date.now()}-${sanitiseFileName(input.fileName)}`,
          bytes,
          input.mimeType,
        );
        const resume = await createResumeForUser(ctx.user.id, {
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSize: bytes.length,
          storageKey: stored.key,
          storageUrl: stored.url,
          resumeText: nullableText(input.resumeText),
        });
        if (!resume) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Resume metadata could not be saved." });
        await Promise.all(input.applicationIds.map(applicationId => linkResumeToApplicationForUser(ctx.user.id, resume.id, applicationId)));
        return resume;
      }),
    linkToApplication: protectedProcedure
      .input(z.object({ resumeId: z.number().int().positive(), applicationId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await linkResumeToApplicationForUser(ctx.user.id, input.resumeId, input.applicationId);
        return { success: true };
      }),
  }),

  skillMatching: router({
    listForApplication: protectedProcedure
      .input(z.object({ applicationId: z.number().int().positive() }))
      .query(({ ctx, input }) => listSkillMatchesForApplication(ctx.user.id, input.applicationId)),
    analyze: protectedProcedure
      .input(z.object({
        applicationId: z.number().int().positive(),
        jobDescription: z.string().trim().min(80).max(20000),
        manualSkills: z.string().trim().max(10000).optional().nullable(),
        resumeId: z.number().int().positive().optional().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        const application = await getApplicationForUser(ctx.user.id, input.applicationId);
        if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found." });

        const resume = input.resumeId ? await getResumeForUser(ctx.user.id, input.resumeId) : undefined;
        if (input.resumeId && !resume) throw new TRPCError({ code: "NOT_FOUND", message: "Resume not found." });
        const sourceText = nullableText(input.manualSkills) ?? nullableText(resume?.resumeText);
        if (!sourceText) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Enter skills manually or upload a resume with analysis text before running a match.",
          });
        }

        const baseline = buildDeterministicSkillBaseline(sourceText, input.jobDescription);
        let narrative = {
          strengths: baseline.matchedSkills.slice(0, 5).map(skill => `Evidence of ${skill} appears in your supplied skills.`),
          nextActions: baseline.missingSkills.slice(0, 5).map(skill => `Add concrete evidence of ${skill} or build a focused project before interviewing.`),
          summary: baseline.requiredSkills.length
            ? `Deterministic comparison found ${baseline.matchedSkills.length} matched skill${baseline.matchedSkills.length === 1 ? "" : "s"} and ${baseline.missingSkills.length} gap${baseline.missingSkills.length === 1 ? "" : "s"} across the recognised job requirements.`
            : "No recognised skills were detected in the job description. Add more detail or use a more specific description.",
        };

        try {
          const catalog = await listLLMModels();
          const model = catalog.data.find(item => item.id === "gpt-5-mini")?.id ?? catalog.data[0]?.id;
          const response = await invokeLLM({
            model,
            messages: [
              {
                role: "system",
                content: "You are a precise career assistant. Compare only stated skills. Do not infer personal attributes, make hiring decisions, or claim certainty. Return concise JSON that follows the supplied schema.",
              },
              {
                role: "user",
                content: `Candidate skills or resume text:\n${sourceText}\n\nJob description:\n${input.jobDescription}\n\nDeterministic baseline (do not alter matched or missing skills; use it only to ground the explanation):\nMatched: ${baseline.matchedSkills.join(", ") || "None"}\nMissing: ${baseline.missingSkills.join(", ") || "None"}`,
              },
            ],
            response_format: { type: "json_schema", json_schema: matchSchema },
          });
          const content = response.choices[0]?.message?.content;
          const analysis = typeof content === "string" ? JSON.parse(content) : null;
          if (!analysis) throw new Error("The skill matcher returned no structured analysis.");
          narrative = { strengths: analysis.strengths, nextActions: analysis.nextActions, summary: analysis.summary };
        } catch (error) {
          console.error("[Skill matching]", error);
        }
        return createSkillMatchForUser(ctx.user.id, {
          applicationId: input.applicationId,
          resumeId: resume?.id ?? null,
          sourceType: resume && !input.manualSkills?.trim() ? "resume" : "manual-skills",
          inputSkills: sourceText,
          jobDescription: input.jobDescription,
          matchedSkills: baseline.matchedSkills,
          missingSkills: baseline.missingSkills,
          strengths: narrative.strengths,
          nextActions: narrative.nextActions,
          summary: narrative.summary,
        });
      }),
  }),

  analytics: router({
    overview: protectedProcedure.query(async ({ ctx }) => {
      const items = await listApplicationsForUser(ctx.user.id);
      const metrics = calculateSearchMetrics(items.map(item => item.status));
      const statusDistribution = APPLICATION_STATUSES.map(status => ({
        status,
        count: items.filter(item => item.status === status).length,
      }));
      const monthly = new Map<string, number>();
      for (const item of items) {
        const label = `${item.applicationDate.getUTCFullYear()}-${String(item.applicationDate.getUTCMonth() + 1).padStart(2, "0")}`;
        monthly.set(label, (monthly.get(label) ?? 0) + 1);
      }
      return {
        ...metrics,
        statusDistribution,
        applicationsByMonth: Array.from(monthly.entries())
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([month, count]) => ({ month, count })),
      };
    }),
  }),
});
