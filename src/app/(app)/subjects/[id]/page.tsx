import { requireUser } from "@/lib/auth";
import { getSubjectDetail } from "@/lib/data";
import { TopicList } from "@/components/topic/topic-list";
import { NewTopicFab } from "@/components/topic/new-topic-fab";
import { SubjectHeader } from "@/components/subject/subject-header";
import Link from "next/link";
import { dateToISO } from "@/lib/dates";

export default async function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const subject = await getSubjectDetail(user.id, id);
  if (!subject) return <NotFound />;

  const isOwner = user.id === subject.userId;

  return (
    <div className="w-full flex flex-col">
      <SubjectHeader subject={subject} isOwner={isOwner}></SubjectHeader>

      {!isOwner && (
        <div className="flex items-center mb-4 p-2 px-4 border bg-gray-200 text-blue border-blue rounded-md">
          Esta matéria pertence a outro usuário, mas você pode copiá-la a sua conta através do botão &quot;+ Clonar
          Matéria&quot; acima.
        </div>
      )}

      {subject.topics.length > 0 ? (
        <TopicList
          isOwner={isOwner}
          topics={subject.topics.map((topic) => ({
            id: topic.id,
            name: topic.name,
            agendamentos: topic.agendamentos.map((a) => ({
              id: a.id,
              name: a.name,
              link: a.link,
              dateISO: a.date ? dateToISO(a.date) : null,
              isCompleted: a.isCompleted,
            })),
          }))}
        />
      ) : (
        <div className="panel px-4 py-10 text-center body text-fg3">
          {isOwner ? (
            <p>
              Nenhum tópico ainda. Toque no botão <span className="font-medium text-fg1">+</span> para criar.
            </p>
          ) : (
            <p>O autor da matéria não criou nenhum tópico...</p>
          )}
        </div>
      )}

      {isOwner && <NewTopicFab subjectId={subject.id} />}
    </div>
  );
}

function NotFound() {
  return (
    <div className="h-full flex w-full pt-[15%]">
      <div className="panel w-full flex p-5 h-50 items-center justify-center flex-col gap-4">
        <p className="heading">Erro</p>
        <div className="flex flex-col gap-2">
          <p className="body">Não conseguimos encontrar essa matéria...</p>
          <Link
            href="/"
            className="brutal-ghost btn-press inline-flex justify-center items-center px-2 py-0.5 body text-fg3 [--ghost:#5b5b5b]"
          >
            Voltar
          </Link>
        </div>
      </div>
    </div>
  );
}
