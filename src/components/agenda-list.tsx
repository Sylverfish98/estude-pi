"use client";

import { useId, useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { tint } from "@/lib/colors";
import { CheckIcon, ExternalLinkIcon, GripIcon, TrashIcon } from "@/components/icons";
import { HoldToDelete } from "@/components/hold-to-delete";
import {
  reorderDayAgendamentos,
  reorderTopicAgendamentos,
  toggleAgendamento,
  deleteAgendamento,
} from "@/lib/actions/agendamentos";
import { PencilIcon } from "@/components/icons";
import { formatDMY } from "@/lib/dates";
import { AgendamentoEditModal, type AgendamentoEditValues } from "@/components/agendamento/agendamento-edit-modal";

export type AgendaItem = {
  id: string;
  name: string;
  link: string | null;
  dateISO?: string | null;
  isCompleted: boolean;
  subjectName?: string;
  subjectColor?: string;
};

type AgendaListProps = {
  items: AgendaItem[];
  isOwner?: boolean;
  reorder?: { kind: "topic"; topicId: string } | { kind: "day"; dateISO: string };
  editable?: boolean;
  deleteMode?: "hold" | "trash" | "none";
  tinted?: boolean;
  currentId?: string;
  studiedSeconds?: number;
  dailyGoalMinutes?: number;
  emptyText?: string;
};

const stopPointer = (e: React.PointerEvent) => e.stopPropagation();

function signature(items: AgendaItem[]) {
  return items.map((i) => `${i.id}:${i.isCompleted ? 1 : 0}`).join("|");
}

export function AgendaList({
  items,
  isOwner = true,
  reorder,
  editable = false,
  deleteMode = "none",
  tinted = false,
  currentId,
  studiedSeconds,
  dailyGoalMinutes,
  emptyText = "Nada por aqui.",
}: AgendaListProps) {
  const dndId = useId();
  const [list, setList] = useState(items);
  const [syncedItems, setSyncedItems] = useState(items);
  const [, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string>();
  const enableReorder = Boolean(reorder);

  if (syncedItems !== items) {
    setSyncedItems(items);
    setList(items);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onToggle(id: string) {
    setList((prev) => prev.map((i) => (i.id === id ? { ...i, isCompleted: !i.isCompleted } : i)));
    startTransition(() => void toggleAgendamento(id));
  }

  function onDelete(id: string) {
    setList((prev) => prev.filter((i) => i.id !== id));
    startTransition(() => void deleteAgendamento(id));
  }

  function onEditSaved(id: string, values: AgendamentoEditValues) {
    setList((prev) => prev.map((item) => (item.id === id ? { ...item, ...values } : item)));
    setEditingId(undefined);
  }

  function onEditDeleted(id: string) {
    setList((prev) => prev.filter((item) => item.id !== id));
    setEditingId(undefined);
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = list.findIndex((i) => i.id === active.id);
    const newIndex = list.findIndex((i) => i.id === over.id);
    const next = arrayMove(list, oldIndex, newIndex);
    const orderedIds = next.map((item) => item.id);

    setList((prev) => next);

    if (reorder?.kind === "topic") startTransition(() => void reorderTopicAgendamentos(reorder.topicId, orderedIds));
    if (reorder?.kind === "day") startTransition(() => void reorderDayAgendamentos(reorder.dateISO, orderedIds));
  }

  const studyTime =
    studiedSeconds === undefined ? null : (
      <StudyTimeCard studiedSeconds={studiedSeconds} dailyGoalMinutes={dailyGoalMinutes} />
    );

  if (list.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        {studyTime}
        <p className="px-1 py-6 text-center body text-fg3">{emptyText}</p>
      </div>
    );
  }

  const rows = list.map((item) => (
    <Row
      key={item.id}
      item={item}
      isOwner={isOwner}
      enableReorder={isOwner && enableReorder}
      editable={isOwner && editable}
      deleteMode={deleteMode}
      tinted={tinted}
      isCurrent={item.id === currentId}
      onToggle={onToggle}
      onDelete={onDelete}
      onEdit={() => setEditingId(item.id)}
    />
  ));

  if (!enableReorder) {
    return (
      <div className="flex flex-col gap-2">
        {studyTime}
        <ul className="flex flex-col gap-1">{rows}</ul>
        <EditModal
          item={list.find((item) => item.id === editingId)}
          onClose={() => setEditingId(undefined)}
          onSaved={onEditSaved}
          onDeleted={onEditDeleted}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {studyTime}
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={list.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-1 ">{rows}</ul>
        </SortableContext>
      </DndContext>
      <EditModal
        item={list.find((item) => item.id === editingId)}
        onClose={() => setEditingId(undefined)}
        onSaved={onEditSaved}
        onDeleted={onEditDeleted}
      />
    </div>
  );
}

function EditModal({
  item,
  onClose,
  onSaved,
  onDeleted,
}: {
  item?: AgendaItem;
  onClose: () => void;
  onSaved: (id: string, values: AgendamentoEditValues) => void;
  onDeleted: (id: string) => void;
}) {
  if (!item) return null;
  return (
    <AgendamentoEditModal
      key={item.id}
      item={item}
      onClose={onClose}
      onSaved={(values) => onSaved(item.id, values)}
      onDeleted={() => onDeleted(item.id)}
    />
  );
}

function StudyTimeCard({ studiedSeconds, dailyGoalMinutes }: { studiedSeconds: number; dailyGoalMinutes?: number }) {
  const totalMinutes = Math.floor(studiedSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const studiedLabel = hours > 0 ? `${hours}h ${minutes}min` : `${totalMinutes} min`;
  const metGoal = dailyGoalMinutes !== undefined && studiedSeconds >= dailyGoalMinutes * 60;

  return (
    <div
      className={`flex items-center justify-between rounded-[5px] px-2.5 py-1.5 detail ${metGoal ? "bg-green-100 text-green-800" : "bg-cream text-fg3"}`}
    >
      <span>Tempo estudado</span>
      <span className="flex items-center gap-1 font-medium">
        {metGoal ? <CheckIcon className="h-3.5 w-3.5" /> : null}
        {studiedLabel}
        {dailyGoalMinutes !== undefined ? ` / ${dailyGoalMinutes} min` : ""}
      </span>
    </div>
  );
}

type RowProps = {
  item: AgendaItem;
  enableReorder: boolean;
  editable: boolean;
  deleteMode: "hold" | "trash" | "none";
  tinted: boolean;
  isCurrent: boolean;
  isOwner: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
};

function Row({
  item,
  enableReorder,
  editable,
  deleteMode,
  tinted,
  isCurrent,
  onToggle,
  onDelete,
  onEdit,
  isOwner,
}: RowProps) {
  const sortable = useSortable({ id: item.id, disabled: !enableReorder });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;

  const bg = tinted && item.subjectColor ? tint(item.subjectColor) : "var(--color-cream-card)";

  const content = (
    <>
      <button
        type="button"
        onPointerDown={stopPointer}
        onClick={() => onToggle(item.id)}
        aria-label={item.isCompleted ? "Desmarcar" : "Concluir"}
        aria-pressed={item.isCompleted}
        className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[2px] border border-ink bg-cream-card"
        disabled={!isOwner}
      >
        {item.isCompleted ? <CheckIcon className="h-3.5 w-3.5 text-fg1" /> : null}
      </button>

      <span
        className={`flex-1 truncate ${isCurrent ? "body font-medium" : "detail"} ${
          item.isCompleted ? "text-fg3 line-through" : "text-fg1"
        }`}
      >
        {item.name}
      </span>

      {item.link && (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          onPointerDown={stopPointer}
          aria-label="Abrir link de estudo"
          className="shrink-0 text-orange-700 hover:text-orange-600"
        >
          <ExternalLinkIcon className="h-4 w-4" />
        </a>
      )}

      {item.dateISO ? (
        <span className="shrink-0 rounded-full border-[1.75px] border-amber/50  px-1.5 py-0.5 text-[11px] font-medium text-amber">
          {formatDMY(item.dateISO)}
        </span>
      ) : null}
    </>
  );

  const bodyClass = "flex flex-1 items-center gap-2 px-2 py-1.5";

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        background: bg,
        opacity: isDragging ? 0.7 : 1,
      }}
      className={`flex items-stretch overflow-hidden rounded-[4px] ${isCurrent ? "ring-2 ring-orange" : ""}`}
    >
      {isOwner && deleteMode === "hold" ? (
        <HoldToDelete className={bodyClass} onConfirm={() => onDelete(item.id)}>
          {content}
        </HoldToDelete>
      ) : (
        <div className={bodyClass}>{content}</div>
      )}

      {deleteMode === "trash" ? (
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          aria-label="Excluir"
          className="grid w-10 shrink-0 place-items-center border-l border-ink/15 text-danger hover:bg-danger/10"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      ) : null}

      {editable ? (
        <button
          type="button"
          onPointerDown={stopPointer}
          onClick={onEdit}
          aria-label={`Editar ${item.name}`}
          className="grid w-9 shrink-0 place-items-center text-fg4 hover:text-fg1"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
      ) : null}

      {enableReorder ? (
        <button
          type="button"
          aria-label="Reordenar"
          className="grid w-9 shrink-0 cursor-grab touch-none place-items-center text-fg4 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripIcon className="h-4 w-4" />
        </button>
      ) : null}
    </li>
  );
}
