import Link from "next/link";
import { SubHeader } from "@/components/sub-header";
import { getTemplateCounts, studyTemplates } from "@/lib/templates/catalog";

export default function TemplatesPage() {
  return (
    <div>
      <SubHeader title="Modelos de estudo" />

      {studyTemplates.length === 0 ? (
        <div className="panel px-5 py-10 text-center">
          <h2 className="subtitle">Novos modelos em breve</h2>
          <p className="mt-1 body text-fg3">Estamos preparando coleções para ajudar você a organizar seus estudos.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {studyTemplates.map((template) => {
            const counts = getTemplateCounts(template);
            return (
              <Link
                key={template.id}
                href={`/templates/${template.id}`}
                className="brutal btn-press flex h-30 flex-col overflow-hidden bg-card-surface"
              >
                <div className="h-2.5 border-b border-ink" style={{ background: template.accentColor }} />
                <div className="flex flex-col gap-1 p-3">
                  <h2 className="subtitle">{template.title}</h2>
                  <p className="line-clamp-1 detail text-fg3">{template.description}</p>
                  <p className="detail font-medium text-fg2">
                    {counts.subjects} matérias · {counts.topics} tópicos · {counts.agendamentos} agendamentos
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
