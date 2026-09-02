import { addDaysISO, isValidISODate, weekdayOfISO } from "../dates";

export const SCHEDULE_WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type ScheduleWeekday = (typeof SCHEDULE_WEEKDAYS)[number];

export type SubjectScheduleQueue<T> = {
  subjectKey: string;
  items: T[];
};

export type ExistingDaySchedule = {
  count: number;
  maxDayOrder: number;
};

export type AutoScheduleOptions = {
  startDateISO: string;
  itemsPerDay: number;
  weekdays: ScheduleWeekday[];
  countExisting: boolean;
  existingDays?: Record<string, ExistingDaySchedule>;
};

export type AutoScheduleAssignment<T> = {
  item: T;
  dateISO: string;
  dayOrder: number;
};

const weekdayIndex = new Map<ScheduleWeekday, number>(SCHEDULE_WEEKDAYS.map((weekday, index) => [weekday, index]));

export function buildAutoSchedule<T>(
  subjectQueues: SubjectScheduleQueue<T>[],
  options: AutoScheduleOptions,
): AutoScheduleAssignment<T>[] {
  if (!isValidISODate(options.startDateISO)) throw new RangeError("Invalid start date.");
  if (!Number.isInteger(options.itemsPerDay) || options.itemsPerDay < 1) {
    throw new RangeError("Items per day must be a positive integer.");
  }

  const activeWeekdays = new Set(options.weekdays.map((weekday) => weekdayIndex.get(weekday)));
  if (activeWeekdays.size === 0 || activeWeekdays.has(undefined)) {
    throw new RangeError("At least one valid weekday is required.");
  }

  const queues = subjectQueues
    .filter((queue) => queue.items.length > 0)
    .map((queue) => ({ subjectKey: queue.subjectKey, items: [...queue.items] }));
  const assignments: AutoScheduleAssignment<T>[] = [];
  let subjectIndex = 0;
  let dateISO = nextActiveDate(options.startDateISO, activeWeekdays as Set<number>);

  while (queues.length > 0) {
    const existing = options.existingDays?.[dateISO] ?? { count: 0, maxDayOrder: -1 };
    const availableSlots = options.countExisting
      ? Math.max(0, options.itemsPerDay - existing.count)
      : options.itemsPerDay;
    let nextDayOrder = Math.max(existing.count, existing.maxDayOrder + 1);

    for (let slot = 0; slot < availableSlots && queues.length > 0; slot += 1) {
      if (subjectIndex >= queues.length) subjectIndex = 0;
      const queue = queues[subjectIndex];
      const item = queue.items.shift();
      if (item === undefined) throw new Error("Schedule queue was unexpectedly empty.");

      assignments.push({ item, dateISO, dayOrder: nextDayOrder++ });
      if (queue.items.length === 0) {
        queues.splice(subjectIndex, 1);
        if (subjectIndex >= queues.length) subjectIndex = 0;
      } else {
        subjectIndex = (subjectIndex + 1) % queues.length;
      }
    }

    if (queues.length > 0) dateISO = nextActiveDate(addDaysISO(dateISO, 1), activeWeekdays as Set<number>);
  }

  return assignments;
}

function nextActiveDate(startDateISO: string, activeWeekdays: Set<number>): string {
  let dateISO = startDateISO;
  while (!activeWeekdays.has(weekdayOfISO(dateISO))) dateISO = addDaysISO(dateISO, 1);
  return dateISO;
}
