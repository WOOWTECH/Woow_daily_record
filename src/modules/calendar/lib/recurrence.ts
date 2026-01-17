// src/modules/calendar/lib/recurrence.ts
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isBefore,
  isAfter,
  differenceInMilliseconds,
  parseISO,
} from 'date-fns';
import type { Event, EventOccurrence } from '../types';

interface RRuleParts {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  byDay?: string[];
  count?: number;
  until?: Date;
}

/**
 * Parse an iCal RRULE string into parts
 */
export function parseRRule(rrule: string): RRuleParts | null {
  if (!rrule) return null;

  const parts: RRuleParts = {
    freq: 'DAILY',
    interval: 1,
  };

  const segments = rrule.split(';');
  for (const segment of segments) {
    const [key, value] = segment.split('=');
    switch (key) {
      case 'FREQ':
        parts.freq = value as RRuleParts['freq'];
        break;
      case 'INTERVAL':
        parts.interval = parseInt(value, 10);
        break;
      case 'BYDAY':
        parts.byDay = value.split(',');
        break;
      case 'COUNT':
        parts.count = parseInt(value, 10);
        break;
      case 'UNTIL':
        parts.until = new Date(value);
        break;
    }
  }

  return parts;
}

/**
 * Build an RRULE string from parts
 */
export function buildRRule(parts: Partial<RRuleParts>): string {
  const segments: string[] = [];

  if (parts.freq) {
    segments.push(`FREQ=${parts.freq}`);
  }
  if (parts.interval && parts.interval > 1) {
    segments.push(`INTERVAL=${parts.interval}`);
  }
  if (parts.byDay && parts.byDay.length > 0) {
    segments.push(`BYDAY=${parts.byDay.join(',')}`);
  }
  if (parts.count) {
    segments.push(`COUNT=${parts.count}`);
  }
  if (parts.until) {
    segments.push(`UNTIL=${parts.until.toISOString()}`);
  }

  return segments.join(';');
}

/**
 * Get next occurrence date based on frequency
 */
function getNextOccurrence(date: Date, freq: RRuleParts['freq'], interval: number): Date {
  switch (freq) {
    case 'DAILY':
      return addDays(date, interval);
    case 'WEEKLY':
      return addWeeks(date, interval);
    case 'MONTHLY':
      return addMonths(date, interval);
    case 'YEARLY':
      return addYears(date, interval);
    default:
      return addDays(date, interval);
  }
}

/**
 * Expand a recurring event into individual occurrences within a date range
 */
export function expandRecurringEvent(
  event: Event,
  rangeStart: Date,
  rangeEnd: Date,
  maxOccurrences: number = 100
): EventOccurrence[] {
  if (!event.recurrence_rule) {
    // Non-recurring event
    const startTime = parseISO(event.start_time);
    const endTime = parseISO(event.end_time);

    // Check if event falls within range
    if (isAfter(startTime, rangeEnd) || isBefore(endTime, rangeStart)) {
      return [];
    }

    return [{
      ...event,
      occurrence_start: startTime,
      occurrence_end: endTime,
      is_recurring: false,
      original_event_id: event.id,
    }];
  }

  const rrule = parseRRule(event.recurrence_rule);
  if (!rrule) return [];

  const occurrences: EventOccurrence[] = [];
  const eventStart = parseISO(event.start_time);
  const eventEnd = parseISO(event.end_time);
  const duration = differenceInMilliseconds(eventEnd, eventStart);

  const recurrenceEnd = event.recurrence_end
    ? parseISO(event.recurrence_end)
    : addYears(rangeEnd, 1); // Default to 1 year if no end

  let currentStart = eventStart;
  let count = 0;

  while (
    isBefore(currentStart, rangeEnd) &&
    isBefore(currentStart, recurrenceEnd) &&
    count < maxOccurrences &&
    (!rrule.count || count < rrule.count)
  ) {
    const currentEnd = new Date(currentStart.getTime() + duration);

    // Check if this occurrence falls within our range
    if (
      (isAfter(currentStart, rangeStart) || isAfter(currentEnd, rangeStart)) &&
      isBefore(currentStart, rangeEnd)
    ) {
      occurrences.push({
        ...event,
        occurrence_start: currentStart,
        occurrence_end: currentEnd,
        is_recurring: true,
        original_event_id: event.id,
      });
    }

    // Move to next occurrence
    currentStart = getNextOccurrence(currentStart, rrule.freq, rrule.interval);
    count++;
  }

  return occurrences;
}

/**
 * Expand multiple events into occurrences
 */
export function expandEvents(
  events: Event[],
  rangeStart: Date,
  rangeEnd: Date
): EventOccurrence[] {
  const allOccurrences: EventOccurrence[] = [];

  for (const event of events) {
    const occurrences = expandRecurringEvent(event, rangeStart, rangeEnd);
    allOccurrences.push(...occurrences);
  }

  // Sort by start time
  return allOccurrences.sort(
    (a, b) => a.occurrence_start.getTime() - b.occurrence_start.getTime()
  );
}

/**
 * Get a human-readable description of a recurrence rule
 */
export function describeRecurrence(rrule: string | null): string {
  if (!rrule) return 'Does not repeat';

  const parts = parseRRule(rrule);
  if (!parts) return 'Does not repeat';

  const interval = parts.interval > 1 ? `every ${parts.interval} ` : '';

  switch (parts.freq) {
    case 'DAILY':
      return parts.interval > 1 ? `Every ${parts.interval} days` : 'Daily';
    case 'WEEKLY':
      return parts.interval > 1 ? `Every ${parts.interval} weeks` : 'Weekly';
    case 'MONTHLY':
      return parts.interval > 1 ? `Every ${parts.interval} months` : 'Monthly';
    case 'YEARLY':
      return parts.interval > 1 ? `Every ${parts.interval} years` : 'Yearly';
    default:
      return 'Repeats';
  }
}
