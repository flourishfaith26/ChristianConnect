import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { prisma } from '../lib/prisma';

const router = Router();
router.use(requireAuth);

/**
 * Format a Date object into UTC iCalendar string (YYYYMMDDTHHMMSSZ).
 */
function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// ─── GET /api/calendar/event/:id.ics ──────────────────────────────────────────
/**
 * Generates an .ics iCalendar file for Google/Apple Calendar sync for an event.
 */
router.get('/event/:id.ics', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) { res.status(404).json({ error: 'Event not found' }); return; }

    const startDate = new Date(event.eventDate);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // default 2 hour duration

    let icsContent = `BEGIN:VCALENDAR\r\n`;
    icsContent += `VERSION:2.0\r\n`;
    icsContent += `PRODID:-//ChristianConnect//Event Calendar//EN\r\n`;
    icsContent += `CALSCALE:GREGORIAN\r\n`;
    icsContent += `METHOD:PUBLISH\r\n`;
    icsContent += `BEGIN:VEVENT\r\n`;
    icsContent += `UID:event-${event.id}@christianconnect.app\r\n`;
    icsContent += `DTSTAMP:${formatIcsDate(new Date())}\r\n`;
    icsContent += `DTSTART:${formatIcsDate(startDate)}\r\n`;
    icsContent += `DTEND:${formatIcsDate(endDate)}\r\n`;
    icsContent += `SUMMARY:${event.title.replace(/,/g, '\\,')}\r\n`;
    if (event.description) {
      icsContent += `DESCRIPTION:${event.description.replace(/\n/g, '\\n').replace(/,/g, '\\,')}\r\n`;
    }
    icsContent += `LOCATION:${event.locationCity}\\, ${event.locationRegion}${event.address ? `\\, ${event.address}` : ''}\r\n`;
    icsContent += `END:VEVENT\r\n`;
    icsContent += `END:VCALENDAR\r\n`;

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="event-${event.id}.ics"`);
    res.send(icsContent);
  } catch (err) {
    console.error('[CalendarSync] event ics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/calendar/reading-plan.ics ──────────────────────────────────────
/**
 * Generates an .ics iCalendar file for Google/Apple Calendar sync for active reading plan.
 */
router.get('/reading-plan.ics', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const plan = await prisma.readingPlan.findFirst({
      where: { userId: req.dbUserId!, isActive: true },
      include: { days: { orderBy: { dayNumber: 'asc' } } },
    });

    if (!plan) { res.status(404).json({ error: 'No active reading plan' }); return; }

    let icsContent = `BEGIN:VCALENDAR\r\n`;
    icsContent += `VERSION:2.0\r\n`;
    icsContent += `PRODID:-//ChristianConnect//Reading Plan Calendar//EN\r\n`;
    icsContent += `CALSCALE:GREGORIAN\r\n`;

    const baseDate = new Date(plan.startDate);
    for (const day of plan.days) {
      const dayDate = new Date(baseDate);
      dayDate.setDate(dayDate.getDate() + (day.dayNumber - 1));
      dayDate.setHours(8, 0, 0, 0); // 8:00 AM local reminder

      const endDate = new Date(dayDate.getTime() + 30 * 60 * 1000);

      icsContent += `BEGIN:VEVENT\r\n`;
      icsContent += `UID:plan-${plan.id}-day-${day.dayNumber}@christianconnect.app\r\n`;
      icsContent += `DTSTAMP:${formatIcsDate(new Date())}\r\n`;
      icsContent += `DTSTART:${formatIcsDate(dayDate)}\r\n`;
      icsContent += `DTEND:${formatIcsDate(endDate)}\r\n`;
      icsContent += `SUMMARY:📖 ${plan.name} - Day ${day.dayNumber}: ${day.passageLabel}\r\n`;
      icsContent += `DESCRIPTION:Passage: ${day.passageLabel}\\nPassage Ref: ${day.passageRef}\r\n`;
      icsContent += `END:VEVENT\r\n`;
    }

    icsContent += `END:VCALENDAR\r\n`;

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="reading-plan-${plan.id}.ics"`);
    res.send(icsContent);
  } catch (err) {
    console.error('[CalendarSync] reading plan ics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
