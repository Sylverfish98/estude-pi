"use client";

import { SubHeader } from "@/components/sub-header";
import { Subject } from "@prisma/client";
import { SubjectHeaderActions } from "@/components/subject/subject-header-actions";
import { copySubject } from "@/lib/actions/subjects";
import { useState } from "react";
import { redirect } from "next/navigation";

type Props = {
  subject: Subject;
  isOwner: boolean;
};

export function SubjectHeader({ subject, isOwner }: Props) {
  return (
    <SubHeader title={subject.name}>
      {isOwner ? (
        <SubjectHeaderActions id={subject.id} name={subject.name} color={subject.color} isPublic={subject.isPublic} />
      ) : (
        <CopySubject id={subject.id} />
      )}
    </SubHeader>
  );
}

function CopySubject({ id }: { id: string }) {
  const [isCloning, setIsCloning] = useState<boolean>(false);

  async function handleCopySubject() {
    setIsCloning(true);
    const response = await copySubject(id);

    if (response.ok) {
      redirect("/");
    }

    setIsCloning(false);
  }

  return (
    <button
      type="button"
      onClick={() => handleCopySubject()}
      aria-label="Copiar matéria"
      className="brutal-sm btn-press grid h-8 w-36 px-1 place-items-center bg-cream text-amber border-amber shadow-amber disabled:opacity-50"
      disabled={isCloning}
    >
      {isCloning ? "...Aguarde" : "+ Clonar Matéria"}
    </button>
  );
}
