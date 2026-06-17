import { Response } from "express";
import prisma from "../config/db";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

export const submitExam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { examId, answers } = req.body; // answers: { [questionId]: string | string[] }

    if (!userId) {
      return res.status(401).json({ message: "Người dùng chưa được xác thực." });
    }

    if (!examId || !answers) {
      return res.status(400).json({ message: "Mã đề thi và danh sách câu trả lời là bắt buộc." });
    }

    // Get exam with questions and options
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!exam) {
      return res.status(404).json({ message: "Đề thi không tồn tại." });
    }

    let totalPoints = 0;
    let earnedPoints = 0;
    const gradedDetails: any[] = [];

    for (const q of exam.questions) {
      totalPoints += q.score;
      const studentAnswer = answers[q.id];
      let isCorrect = false;
      let correctAnswers: string[] = [];

      if (q.type === "multiple_choice" || q.type === "true_false") {
        // Find correct options
        const correctOptions = q.options.filter((o) => o.isCorrect);
        correctAnswers = correctOptions.map((o) => o.id);

        if (studentAnswer) {
          // Check if option ID matches correct options
          isCorrect = correctOptions.some((o) => o.id === studentAnswer);
        }
      } else if (q.type === "fill_blank") {
        // Check text match case-insensitively and trim spaces
        const correctOptions = q.options.filter((o) => o.isCorrect);
        correctAnswers = correctOptions.map((o) => o.content.toLowerCase().trim());

        if (studentAnswer && typeof studentAnswer === "string") {
          const sanitizedAnswer = studentAnswer.toLowerCase().trim();
          isCorrect = correctAnswers.includes(sanitizedAnswer);
        }
      }

      if (isCorrect) {
        earnedPoints += q.score;
      }

      gradedDetails.push({
        questionId: q.id,
        questionText: q.content,
        questionType: q.type,
        score: q.score,
        studentAnswer,
        correctAnswers,
        isCorrect,
      });
    }

    // Scale score to 10 points
    const scaledScore = totalPoints > 0 ? parseFloat(((earnedPoints / totalPoints) * 10).toFixed(2)) : 0;

    // Create Result
    const result = await prisma.result.create({
      data: {
        userId,
        examId,
        score: scaledScore,
        answers: gradedDetails,
      },
      include: {
        exam: {
          select: {
            title: true,
            course: { select: { title: true } },
          },
        },
      },
    });

    return res.status(201).json({
      message: "Nộp bài thi thành công.",
      score: scaledScore,
      earnedPoints,
      totalPoints,
      resultId: result.id,
    });
  } catch (error: any) {
    console.error("SubmitExam error:", error);
    return res.status(500).json({ message: "Lỗi chấm bài thi.", error: error.message });
  }
};

export const getMyResults = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const results = await prisma.result.findMany({
      where: { userId },
      include: {
        exam: {
          select: {
            title: true,
            course: { select: { title: true } },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });
    return res.status(200).json(results);
  } catch (error: any) {
    console.error("GetMyResults error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống.", error: error.message });
  }
};

export const getAllResults = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role;

    if (userRole !== "ADMIN") {
      return res.status(403).json({ message: "Bạn không có quyền xem thông tin này." });
    }

    const results = await prisma.result.findMany({
      include: {
        user: {
          select: { name: true, email: true },
        },
        exam: {
          select: {
            title: true,
            course: { select: { title: true } },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });
    return res.status(200).json(results);
  } catch (error: any) {
    console.error("GetAllResults error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống.", error: error.message });
  }
};

export const getResultById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const result = await prisma.result.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        exam: {
          include: {
            course: {
              select: { title: true },
            },
            questions: {
              include: { options: true }
            }
          }
        },
      },
    });

    if (!result) {
      return res.status(404).json({ message: "Không tìm thấy kết quả bài thi." });
    }

    // Security: Student can only view their own results
    if (userRole === "STUDENT" && result.userId !== userId) {
      return res.status(403).json({ message: "Bạn không được phép xem kết quả của người khác." });
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("GetResultById error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống.", error: error.message });
  }
};
