import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { prisma, isDbConnected } from '../lib/prisma';
import { store } from '../lib/persistence';

const router = Router();
router.use(requireAuth);

const SEED_DISCIPLESHIP_COURSES = [
  {
    title: 'Foundations of Faith',
    description: 'A 4-week structured discipleship course designed for new believers. Learn the core tenets of Christianity, Bible study basics, prayer, and church community.',
    focus: 'new_converts',
    durationWeeks: 4,
    lessons: [
      {
        weekNumber: 1,
        title: 'Week 1: Who is Jesus & What is Salvation?',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        content: 'Salvation is the free gift of God through faith in Jesus Christ. Ephesians 2:8-9 teaches that we are saved by grace through faith.',
        discussionQuestions: ['What does salvation mean to you?', 'How has your life changed since accepting Christ?'],
      },
      {
        weekNumber: 2,
        title: 'Week 2: Learning to Read & Understand the Bible',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        content: 'The Bible is God’s inspired Word. 2 Timothy 3:16-17 explains that all Scripture is God-breathed and useful for teaching, rebuking, and training in righteousness.',
        discussionQuestions: ['How often do you read scripture?', 'What Bible translation feels clearest to you?'],
      },
      {
        weekNumber: 3,
        title: 'Week 3: Developing a Daily Conversation with God (Prayer)',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        content: 'Prayer is simple, honest communication with your Heavenly Father. In Matthew 6, Jesus gives us the Lord’s Prayer as a model.',
        discussionQuestions: ['What hinders your prayer life?', 'How can your community pray for you this week?'],
      },
      {
        weekNumber: 4,
        title: 'Week 4: Walking in Christian Community & Church',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        content: 'We were created for fellowship. Hebrews 10:24-25 urges us not to give up meeting together, but to encourage one another daily.',
        discussionQuestions: ['Why is church involvement vital?', 'What small group or ministry are you joining next?'],
      },
    ],
  },
];

// ─── GET /api/courses ────────────────────────────────────────────────────────
/**
 * List discipleship courses. Seeds "Foundations of Faith" if DB is empty.
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      const seed = SEED_DISCIPLESHIP_COURSES.map((c, i) => ({
        id: `course_${i + 1}`,
        ...c,
        lessons: c.lessons.map((l, j) => ({ id: `lesson_${i}_${j}`, courseId: `course_${i + 1}`, ...l })),
        progress: [],
      }));
      res.json(seed);
      return;
    }

    let courses = await prisma.discipleshipCourse.findMany({
      include: {
        lessons: { orderBy: { weekNumber: 'asc' } },
        progress: { where: { userId: req.dbUserId! } },
      },
    });

    if (courses.length === 0) {
      const seed = SEED_DISCIPLESHIP_COURSES[0];
      const created = await prisma.discipleshipCourse.create({
        data: {
          title: seed.title,
          description: seed.description,
          focus: seed.focus,
          durationWeeks: seed.durationWeeks,
          lessons: {
            create: seed.lessons,
          },
        },
        include: {
          lessons: { orderBy: { weekNumber: 'asc' } },
          progress: { where: { userId: req.dbUserId! } },
        },
      });
      courses = [created];
    }

    res.json(courses);
  } catch (err) {
    const seed = SEED_DISCIPLESHIP_COURSES.map((c, i) => ({
      id: `course_${i + 1}`,
      ...c,
      lessons: c.lessons.map((l, j) => ({ id: `lesson_${i}_${j}`, courseId: `course_${i + 1}`, ...l })),
      progress: [],
    }));
    res.json(seed);
  }
});

// ─── POST /api/courses/:id/progress ──────────────────────────────────────────
/**
 * Mark a week lesson completed for the current user.
 */
router.post('/:id/progress', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { weekNumber } = req.body;

    const course = await prisma.discipleshipCourse.findUnique({
      where: { id },
      include: { lessons: true },
    });

    if (!course) { res.status(404).json({ error: 'Course not found' }); return; }

    const existingProgress = await prisma.userCourseProgress.findUnique({
      where: { userId_courseId: { userId: req.dbUserId!, courseId: id } },
    });

    const currentCompleted = Array.isArray(existingProgress?.completedWeeks)
      ? (existingProgress.completedWeeks as number[])
      : [];

    const updatedWeeks = Array.from(new Set([...currentCompleted, Number(weekNumber)]));
    const isCompleted = updatedWeeks.length >= course.durationWeeks;

    const progress = await prisma.userCourseProgress.upsert({
      where: { userId_courseId: { userId: req.dbUserId!, courseId: id } },
      create: {
        userId: req.dbUserId!,
        courseId: id,
        completedWeeks: updatedWeeks as any,
        isCompleted,
      },
      update: {
        completedWeeks: updatedWeeks as any,
        isCompleted,
      },
    });

    res.json(progress);
  } catch (err) {
    console.error('[Courses] progress error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
