import { notFound } from "next/navigation";
import { SubHeader } from "@/components/sub-header";
import { TemplateImporter } from "@/components/templates/template-importer";
import { requireUser } from "@/lib/auth";
import { getTemplateImportAvailability } from "@/lib/data";
import { getStudyTemplate, getTemplateCounts } from "@/lib/templates/catalog";

export default async function TemplatePage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  const template = getStudyTemplate(templateId);
  if (!template) notFound();

  const user = await requireUser();
  const availability = await getTemplateImportAvailability(user.id, template);
  const counts = getTemplateCounts(template);

  return (
    <div>
      <SubHeader title={template.title} backHref="/templates" />
      <div className="mb-5 rounded-[10px] border border-fg4/60 bg-card-surface p-4">
        <p className="body text-fg2">{template.description}</p>
        <p className="mt-2 detail font-medium text-fg3">
          {counts.subjects} matérias · {counts.topics} tópicos · {counts.agendamentos} agendamentos
        </p>
      </div>
      <TemplateImporter template={template} availability={availability} />
    </div>
  );
}
