import { z } from "zod";
import enemTemplate from "./enem.json" with { type: "json" };

const keyedNameSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(1).max(120),
});

const templateAgendamentoSchema = keyedNameSchema.extend({
  link: z.string().url().optional(),
});

const templateTopicSchema = keyedNameSchema.extend({
  agendamentos: z.array(templateAgendamentoSchema).min(1),
});

const templateSubjectSchema = keyedNameSchema.extend({
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  topics: z.array(templateTopicSchema).min(1),
});

const studyTemplateSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  version: z.number().int().positive(),
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(240),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  subjects: z.array(templateSubjectSchema).min(1),
});

const catalogSchema = z.array(studyTemplateSchema).superRefine((templates, context) => {
  addDuplicateIssues(
    templates.map((template) => template.id),
    "id de modelo",
    context,
  );

  templates.forEach((template, templateIndex) => {
    addDuplicateIssues(
      template.subjects.map((subject) => subject.key),
      `chave de matéria em ${template.id}`,
      context,
      [templateIndex, "subjects"],
    );

    template.subjects.forEach((subject, subjectIndex) => {
      addDuplicateIssues(
        subject.topics.map((topic) => topic.key),
        `chave de tópico em ${template.id}/${subject.key}`,
        context,
        [templateIndex, "subjects", subjectIndex, "topics"],
      );

      subject.topics.forEach((topic, topicIndex) => {
        addDuplicateIssues(
          topic.agendamentos.map((agendamento) => agendamento.key),
          `chave de agendamento em ${template.id}/${subject.key}/${topic.key}`,
          context,
          [templateIndex, "subjects", subjectIndex, "topics", topicIndex, "agendamentos"],
        );
      });
    });
  });
});

function addDuplicateIssues(keys: string[], label: string, context: z.RefinementCtx, path: PropertyKey[] = []) {
  const seen = new Set<string>();
  keys.forEach((key, index) => {
    if (seen.has(key)) {
      context.addIssue({ code: "custom", message: `${label} duplicada: ${key}`, path: [...path, index] });
    }
    seen.add(key);
  });
}

export type StudyTemplate = z.infer<typeof studyTemplateSchema>;
export type TemplateSubject = StudyTemplate["subjects"][number];
export type TemplateTopic = TemplateSubject["topics"][number];
export type TemplateImportAvailability = Record<string, { existingSubject: boolean; existingTopicKeys: string[] }>;

const rawCatalog: unknown[] = [enemTemplate];

export const studyTemplates: StudyTemplate[] = catalogSchema.parse(rawCatalog);
export const hasStudyTemplates = studyTemplates.length > 0;

export function getStudyTemplate(templateId: string): StudyTemplate | undefined {
  return studyTemplates.find((template) => template.id === templateId);
}

export function getTemplateCounts(template: StudyTemplate) {
  return template.subjects.reduce(
    (counts, subject) => {
      counts.subjects += 1;
      counts.topics += subject.topics.length;
      counts.agendamentos += subject.topics.reduce((total, topic) => total + topic.agendamentos.length, 0);
      return counts;
    },
    { subjects: 0, topics: 0, agendamentos: 0 },
  );
}
