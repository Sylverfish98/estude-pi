"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { SubjectForm } from "@/components/subject/subject-form";
import { updateSubject, deleteSubject, setSubjectPublicStatus } from "@/lib/actions/subjects";
import { PencilIcon, TrashIcon } from "@/components/icons";
import { ConfirmationModal } from "@/components/confirmation-modal";

type Props = { id: string; name: string; color: string; isPublic: boolean };

export function SubjectHeaderActions({ id, name, color, isPublic }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      await deleteSubject(id);
      router.push("/");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Editar matéria"
        className="brutal-sm btn-press grid h-8 w-8 place-items-center bg-cream text-amber border-amber shadow-danger"
      >
        <PencilIcon className="h-4 w-4 text-amber" />
      </button>
      <button
        type="button"
        onClick={() => setConfirmingDelete(true)}
        aria-label="Excluir matéria"
        className="brutal-sm btn-press grid h-8 w-8 place-items-center bg-cream text-danger border-danger shadow-danger"
      >
        <TrashIcon className="h-4 w-4 " />
      </button>

      <Modal open={editing} onClose={() => setEditing(false)} title="Editar Matéria">
        <SubjectForm
          initialName={name}
          initialColor={color}
          initialVisibility={isPublic}
          submitLabel="Salvar"
          onSubmit={(name, color, isPublic) => updateSubject(id, name, color, isPublic)}
          onDone={() => setEditing(false)}
        />
      </Modal>

      <ConfirmationModal
        open={confirmingDelete}
        description={`Excluir a matéria "${name}"? Isso remove seus tópicos e agendamentos.`}
        pending={pending}
        onConfirm={handleDelete}
        onClose={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
