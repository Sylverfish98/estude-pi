"use client";

import { useState } from "react";
import { Modal } from "@/components/modal";
import { SubjectForm } from "@/components/subject/subject-form";
import { createSubject } from "@/lib/actions/subjects";
import { OUTLINE_PILL } from "@/components/ui";

export function NewSubjectButton(props: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${props.className} ${OUTLINE_PILL}`}>
        Nova
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nova Matéria">
        <SubjectForm submitLabel="Criar" onSubmit={createSubject} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
