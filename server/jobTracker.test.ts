import { describe, expect, it } from "vitest";
import { buildDeterministicSkillBaseline, calculateSearchMetrics, isAllowedStatusTransition } from "./jobTracker";

describe("application status workflow", () => {
  it("allows the ordered active workflow and explicit terminal routes", () => {
    expect(isAllowedStatusTransition("Saved", "Applied")).toBe(true);
    expect(isAllowedStatusTransition("Applied", "Interview")).toBe(true);
    expect(isAllowedStatusTransition("Interview", "Offer")).toBe(true);
    expect(isAllowedStatusTransition("Interview", "Rejected")).toBe(true);
    expect(isAllowedStatusTransition("Offer", "Withdrawn")).toBe(true);
  });

  it("blocks skipped, backwards, and terminal-state transitions", () => {
    expect(isAllowedStatusTransition("Saved", "Interview")).toBe(false);
    expect(isAllowedStatusTransition("Interview", "Applied")).toBe(false);
    expect(isAllowedStatusTransition("Rejected", "Applied")).toBe(false);
    expect(isAllowedStatusTransition("Withdrawn", "Offer")).toBe(false);
  });
});

describe("deterministic skill baseline", () => {
  it("returns reproducible overlaps and gaps from recognised skill terms", () => {
    const result = buildDeterministicSkillBaseline(
      "Python, SQL, pandas, data analysis, stakeholder management",
      "Need Python, SQL, React, data analysis, and Docker experience.",
    );

    expect(result.matchedSkills).toEqual(["python", "sql", "data analysis"]);
    expect(result.missingSkills).toEqual(["docker", "react"]);
  });

  it("does not invent skills when the source input is empty", () => {
    const result = buildDeterministicSkillBaseline("", "Python and SQL are required.");
    expect(result.matchedSkills).toEqual([]);
    expect(result.missingSkills).toEqual(["python", "sql"]);
  });
});

describe("search analytics", () => {
  it("calculates response and interview conversion rates from workflow states", () => {
    expect(calculateSearchMetrics(["Saved", "Applied", "Interview", "Offer", "Rejected", "Withdrawn"])).toEqual({
      totalApplications: 6,
      responseRate: 75,
      interviewConversionRate: 50,
    });
  });

  it("avoids a division error before any application has advanced", () => {
    expect(calculateSearchMetrics(["Saved"])).toEqual({
      totalApplications: 1,
      responseRate: 0,
      interviewConversionRate: 0,
    });
  });
});
