import { Response } from "express";
import prisma from "../config/db";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

type AnswerMap = Record<string, string>;

const generateAccessCode = async (): Promise<string> => {
  for (let i = 0; i < 20; i++) {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const existing = await prisma.practiceSet.findUnique({ where: { accessCode: code } });
    if (!existing) return code;
  }
  throw new Error("Không thể tạo mã ôn tập duy nhất. Vui lòng thử lại.");
};

const gradeQuestions = (
  questions: Array<{
    id: string;
    type: string;
    content: string;
    score: number;
    options: Array<{ id: string; content: string; isCorrect: boolean }>;
  }>,
  answers: AnswerMap
) => {
  let totalPoints = 0;
  let earnedPoints = 0;

  const details = questions.map((q) => {
    totalPoints += q.score;
    const studentAnswer = answers[q.id] || "";

    let isCorrect = false;
    let correctAnswers: string[] = [];

    if (q.type === "multiple_choice" || q.type === "true_false") {
      const correctOptions = q.options.filter((o) => o.isCorrect);
      correctAnswers = correctOptions.map((o) => o.id);
      isCorrect = correctOptions.some((o) => o.id === studentAnswer);
    } else if (q.type === "fill_blank") {
      const correctOptions = q.options.filter((o) => o.isCorrect);
      correctAnswers = correctOptions.map((o) => o.content.toLowerCase().trim());
      const normalized = studentAnswer.toLowerCase().trim();
      isCorrect = normalized.length > 0 && correctAnswers.includes(normalized);
    }

    if (isCorrect) earnedPoints += q.score;

    return {
      questionId: q.id,
      questionText: q.content,
      questionType: q.type,
      score: q.score,
      studentAnswer,
      correctAnswers,
      isCorrect,
    };
  });

  const scaledScore = totalPoints > 0 ? parseFloat(((earnedPoints / totalPoints) * 10).toFixed(2)) : 0;

  return {
    scaledScore,
    earnedPoints,
    totalPoints,
    details,
  };
};

export const createPracticeSet = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, courseId, questions } = req.body;

    if (!title || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "Vui lòng nhập tiêu đề và ít nhất 1 câu hỏi ôn tập." });
    }

    if (courseId) {
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        return res.status(404).json({ message: "Khóa học không tồn tại." });
      }
    }

    const accessCode = courseId ? null : await generateAccessCode();

    const created = await prisma.practiceSet.create({
      data: {
        title,
        description: description || "",
        courseId: courseId || null,
        accessCode,
        questions: {
          create: questions.map((q: any) => ({
            type: q.type,
            content: q.content,
            score: q.score ? parseFloat(q.score) : 1,
            options: {
              create: q.options.map((o: any) => ({
                content: o.content,
                isCorrect: o.isCorrect === true || o.isCorrect === "true",
              })),
            },
          })),
        },
      },
      include: {
        _count: { select: { questions: true } },
      },
    });

    return res.status(201).json(created);
  } catch (error: any) {
    console.error("CreatePracticeSet error:", error);
    return res.status(500).json({ message: "Lỗi tạo bộ đề ôn tập.", error: error.message });
  }
};

export const getPracticeSetsByCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId } = req.params;

    const sets = await prisma.practiceSet.findMany({
      where: { courseId },
      include: {
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(sets);
  } catch (error: any) {
    console.error("GetPracticeSetsByCourse error:", error);
    return res.status(500).json({ message: "Lỗi tải danh sách ôn tập.", error: error.message });
  }
};

export const findPracticeSetByCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code } = req.body;
    if (!code || !/^\d{4}$/.test(code)) {
      return res.status(400).json({ message: "Mã ôn tập phải gồm đúng 4 chữ số." });
    }

    const set = await prisma.practiceSet.findUnique({
      where: { accessCode: code },
      include: {
        _count: { select: { questions: true } },
        course: { select: { id: true, title: true } },
      },
    });

    if (!set) {
      return res.status(404).json({ message: "Không tìm thấy bộ ôn tập với mã đã nhập." });
    }

    return res.status(200).json(set);
  } catch (error: any) {
    console.error("FindPracticeSetByCode error:", error);
    return res.status(500).json({ message: "Lỗi tìm bộ ôn tập theo mã.", error: error.message });
  }
};

export const getPracticeSetById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;

    const set = await prisma.practiceSet.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true } },
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!set) {
      return res.status(404).json({ message: "Bộ ôn tập không tồn tại." });
    }

    if (userRole === "STUDENT") {
      return res.status(200).json({
        ...set,
        questions: set.questions.map((q) => ({
          ...q,
          options: q.options.map((o) => ({
            id: o.id,
            content: o.content,
            practiceQuestionId: o.practiceQuestionId,
          })),
        })),
      });
    }

    return res.status(200).json(set);
  } catch (error: any) {
    console.error("GetPracticeSetById error:", error);
    return res.status(500).json({ message: "Lỗi tải bộ ôn tập.", error: error.message });
  }
};

export const createPracticeSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { questionCount } = req.body;

    const set = await prisma.practiceSet.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true } },
        questions: {
          include: { options: true },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!set) {
      return res.status(404).json({ message: "Bộ ôn tập không tồn tại." });
    }

    const total = set.questions.length;
    if (total === 0) {
      return res.status(400).json({ message: "Bộ ôn tập chưa có câu hỏi." });
    }

    let selected = [...set.questions];
    const n = Number(questionCount);
    if (!Number.isNaN(n) && n > 0 && n < total) {
      const shuffled = [...set.questions].sort(() => Math.random() - 0.5);
      selected = shuffled.slice(0, n);
    }

    return res.status(200).json({
      id: set.id,
      title: set.title,
      description: set.description,
      accessCode: set.accessCode,
      course: set.course,
      totalQuestions: total,
      questions: selected.map((q) => ({
        id: q.id,
        type: q.type,
        content: q.content,
        score: q.score,
        options: q.options.map((o) => ({
          id: o.id,
          content: o.content,
          practiceQuestionId: o.practiceQuestionId,
        })),
      })),
    });
  } catch (error: any) {
    console.error("CreatePracticeSession error:", error);
    return res.status(500).json({ message: "Lỗi tạo phiên ôn tập.", error: error.message });
  }
};

export const gradePracticeSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { answers, questionIds, saveAttempt = false } = req.body as {
      answers: AnswerMap;
      questionIds?: string[];
      saveAttempt?: boolean;
    };

    if (!answers || typeof answers !== "object") {
      return res.status(400).json({ message: "Dữ liệu câu trả lời không hợp lệ." });
    }

    const set = await prisma.practiceSet.findUnique({
      where: { id },
      include: {
        questions: {
          include: { options: true },
        },
      },
    });

    if (!set) {
      return res.status(404).json({ message: "Bộ ôn tập không tồn tại." });
    }

    const targetQuestions = Array.isArray(questionIds) && questionIds.length > 0
      ? set.questions.filter((q) => questionIds.includes(q.id))
      : set.questions;

    if (targetQuestions.length === 0) {
      return res.status(400).json({ message: "Không tìm thấy câu hỏi để chấm." });
    }

    const graded = gradeQuestions(targetQuestions, answers);

    let attemptId: string | null = null;
    if (saveAttempt && req.user?.id) {
      const attempt = await prisma.practiceAttempt.create({
        data: {
          userId: req.user.id,
          practiceSetId: set.id,
          score: graded.scaledScore,
          answers: graded.details,
        },
      });
      attemptId = attempt.id;
    }

    return res.status(200).json({
      message: "Chấm ôn tập thành công.",
      score: graded.scaledScore,
      earnedPoints: graded.earnedPoints,
      totalPoints: graded.totalPoints,
      details: graded.details,
      attemptId,
    });
  } catch (error: any) {
    console.error("GradePracticeSession error:", error);
    return res.status(500).json({ message: "Lỗi chấm kết quả ôn tập.", error: error.message });
  }
};
