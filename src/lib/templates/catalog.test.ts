import { describe, expect, it } from "vitest";
import { getStudyTemplate, getTemplateCounts } from "./catalog";

describe("ENEM template", () => {
  it("contains the curated hierarchy with indexed study links", () => {
    const template = getStudyTemplate("enem");
    expect(template).toBeDefined();
    if (!template) return;

    expect(getTemplateCounts(template)).toEqual({ subjects: 8, topics: 63, agendamentos: 302 });
    const agendamentos = template.subjects.flatMap((subject) => subject.topics.flatMap((topic) => topic.agendamentos));
    const linkedAgendamentos = agendamentos.filter(
      (agendamento): agendamento is (typeof agendamentos)[number] & { link: string } => Boolean(agendamento.link),
    );

    expect(linkedAgendamentos).toHaveLength(181);
    expect(linkedAgendamentos.length).toBeGreaterThanOrEqual(agendamentos.length * 0.25);
    expect(
      linkedAgendamentos.every((agendamento) => new URL(agendamento.link).hostname === "brasilescola.uol.com.br"),
    ).toBe(true);
  });

  it("loads the sample template from the catalog", () => {
    const template = getStudyTemplate("revisao-ensino-medio");
    expect(template).toBeDefined();
    if (!template) return;

    expect(getTemplateCounts(template)).toEqual({ subjects: 3, topics: 6, agendamentos: 12 });
  });
});
