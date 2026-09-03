"use client";

import { useId, useState, useTransition } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
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
import { TopicAccordion } from "@/components/topic/topic-accordion";
import type { AgendaItem } from "@/components/agenda-list";
import { GripIcon } from "@/components/icons";
import { reorderTopics } from "@/lib/actions/topics";

type TopicListItem = {
  id: string;
  name: string;
  agendamentos: AgendaItem[];
};

type Props = {
  topics: TopicListItem[];
  isOwner: boolean;
};

export function TopicList({ topics, isOwner }: Props) {
  const dndId = useId();
  const [list, setList] = useState(topics);
  const [syncedTopics, setSyncedTopics] = useState(topics);
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (syncedTopics !== topics) {
    setSyncedTopics(topics);
    setList(topics);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = list.findIndex((topic) => topic.id === active.id);
    const newIndex = list.findIndex((topic) => topic.id === over.id);
    const next = arrayMove(list, oldIndex, newIndex);

    setList((current) => next);
    startTransition(() => void reorderTopics(next.map((topic) => topic.id)));
  }

  return (
    <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={list.map((topic) => topic.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2.5">
          {list.map((topic, index) => (
            <SortableTopic key={topic.id} topic={topic} isOwner={isOwner} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableTopic({ topic, isOwner }: { topic: TopicListItem; isOwner: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: topic.id,
    disabled: !isOwner,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.7 : 1 }}
    >
      <TopicAccordion
        topic={{ id: topic.id, name: topic.name }}
        agendamentos={topic.agendamentos}
        isOwner={isOwner}
        dragHandle={(handleClick) => {
          return isOwner ? (
            <button
              type="button"
              onMouseDown={(event) => {
                event.stopPropagation();
                handleClick();
              }}
              aria-label={`Reordenar ${topic.name}`}
              className="grid h-5 w-5 shrink-0 cursor-grab touch-none place-items-center text-fg4 active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripIcon className="h-4 w-4" />
            </button>
          ) : null;
        }}
      />
    </div>
  );
}
