import { describe, expect, it } from "vitest";
import { buildAutoSchedule, type SubjectScheduleQueue } from "./auto-schedule";

function queue(subjectKey: string, ...items: string[]): SubjectScheduleQueue<string> {
  return { subjectKey, items };
}

describe("buildAutoSchedule", () => {
  it("continues the subject rotation across day boundaries", () => {
    const result = buildAutoSchedule(
      [queue("portugues", "P1", "P2"), queue("matematica", "M1", "M2"), queue("biologia", "B1", "B2")],
      {
        startDateISO: "2026-08-17",
        itemsPerDay: 2,
        weekdays: ["mon", "tue", "wed", "thu", "fri"],
        countExisting: false,
      },
    );

    expect(result.map(({ item, dateISO }) => [item, dateISO])).toEqual([
      ["P1", "2026-08-17"],
      ["M1", "2026-08-17"],
      ["B1", "2026-08-18"],
      ["P2", "2026-08-18"],
      ["M2", "2026-08-19"],
      ["B2", "2026-08-19"],
    ]);
  });

  it("removes exhausted subjects without disturbing the remaining order", () => {
    const result = buildAutoSchedule([queue("portugues", "P1"), queue("matematica", "M1", "M2", "M3")], {
      startDateISO: "2026-08-17",
      itemsPerDay: 2,
      weekdays: ["mon", "tue"],
      countExisting: false,
    });

    expect(result.map(({ item }) => item)).toEqual(["P1", "M1", "M2", "M3"]);
  });

  it("advances an inactive start date through the selected weekdays", () => {
    const result = buildAutoSchedule([queue("portugues", "P1", "P2")], {
      startDateISO: "2026-08-22",
      itemsPerDay: 1,
      weekdays: ["mon", "wed"],
      countExisting: false,
    });

    expect(result.map(({ dateISO }) => dateISO)).toEqual(["2026-08-24", "2026-08-26"]);
  });

  it("skips full days and uses only remaining capacity", () => {
    const result = buildAutoSchedule([queue("portugues", "P1", "P2")], {
      startDateISO: "2026-08-17",
      itemsPerDay: 3,
      weekdays: ["mon", "tue", "wed"],
      countExisting: true,
      existingDays: {
        "2026-08-17": { count: 3, maxDayOrder: 4 },
        "2026-08-18": { count: 2, maxDayOrder: 5 },
      },
    });

    expect(result).toEqual([
      { item: "P1", dateISO: "2026-08-18", dayOrder: 6 },
      { item: "P2", dateISO: "2026-08-19", dayOrder: 0 },
    ]);
  });

  it("ignores existing capacity while appending after existing daily order", () => {
    const result = buildAutoSchedule([queue("portugues", "P1", "P2")], {
      startDateISO: "2026-08-17",
      itemsPerDay: 2,
      weekdays: ["mon"],
      countExisting: false,
      existingDays: { "2026-08-17": { count: 10, maxDayOrder: 12 } },
    });

    expect(result).toEqual([
      { item: "P1", dateISO: "2026-08-17", dayOrder: 13 },
      { item: "P2", dateISO: "2026-08-17", dayOrder: 14 },
    ]);
  });

  it("rejects settings that could not produce a schedule", () => {
    expect(() =>
      buildAutoSchedule([queue("portugues", "P1")], {
        startDateISO: "2026-08-17",
        itemsPerDay: 0,
        weekdays: ["mon"],
        countExisting: false,
      }),
    ).toThrow(RangeError);

    expect(() =>
      buildAutoSchedule([queue("portugues", "P1")], {
        startDateISO: "2026-08-17",
        itemsPerDay: 1,
        weekdays: [],
        countExisting: false,
      }),
    ).toThrow(RangeError);

    expect(() =>
      buildAutoSchedule([queue("portugues", "P1")], {
        startDateISO: "2026-02-31",
        itemsPerDay: 1,
        weekdays: ["mon"],
        countExisting: false,
      }),
    ).toThrow(RangeError);
  });
});
