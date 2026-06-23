import { Response } from "express";
import prisma from "../config/db";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { StorageService } from "../services/storage";

export const getExamsByCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const exams = await prisma.exam.findMany({
      where: { courseId },
      include: {
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(exams);
  } catch (error: any) {
    console.error("GetExamsByCourse error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống.", error: error.message });
  }
};

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const getExamById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
        course: {
          select: { title: true },
        },
      },
    });

    if (!exam) {
      return res.status(404).json({ message: "Không tìm thấy đề thi." });
    }

    // Security: If the caller is a STUDENT, strip the isCorrect details from options
    if (userRole === "STUDENT") {
      // Shuffle questions
      const shuffledQuestions = shuffleArray(exam.questions);

      const sanitizedQuestions = shuffledQuestions.map((question) => {
        // Only return options for multiple_choice and true_false
        // For fill_blank, the correct answers are stored in options, so do not send them to the client
        if (question.type === "fill_blank") {
          return {
            ...question,
            options: [],
          };
        }

        // Shuffle options only for multiple_choice questions (true_false should keep original Đúng/Sai order)
        const optionsToProcess = question.type === "multiple_choice"
          ? shuffleArray(question.options)
          : question.options;

        return {
          ...question,
          options: optionsToProcess.map((option) => ({
            id: option.id,
            questionId: option.questionId,
            content: option.content,
            // isCorrect is omitted for students
          })),
        };
      });

      return res.status(200).json({
        ...exam,
        questions: sanitizedQuestions,
      });
    }

    // If Admin, return full details including isCorrect flags
    return res.status(200).json(exam);
  } catch (error: any) {
    console.error("GetExamById error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống.", error: error.message });
  }
};

export const createExam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, duration, courseId, questions } = req.body;

    if (!title || !duration || !courseId) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ: Tiêu đề, Thời gian thi và Khóa học." });
    }

    // Create the exam with nested questions and options
    const newExam = await prisma.exam.create({
      data: {
        title,
        description: description || "",
        duration: parseInt(duration),
        courseId,
        questions: {
          create: questions.map((q: any) => ({
            type: q.type,
            content: q.content,
            imageUrl: q.imageUrl || null,
            score: q.score ? parseFloat(q.score) : 1.0,
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
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    return res.status(201).json(newExam);
  } catch (error: any) {
    console.error("CreateExam error:", error);
    return res.status(500).json({ message: "Lỗi tạo đề thi.", error: error.message });
  }
};

export const uploadExamImage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "Vui lòng chọn ảnh để tải lên." });
    }

    const uploadResult = await StorageService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    return res.status(201).json({ imageUrl: uploadResult.fileUrl, fileSize: uploadResult.fileSize });
  } catch (error: any) {
    console.error("UploadExamImage error:", error);
    return res.status(500).json({ message: "Lỗi tải ảnh câu hỏi bài thi.", error: error.message });
  }
};

const regradeExamResults = async (examId: string) => {
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

  if (!exam) return;

  const results = await prisma.result.findMany({
    where: { examId },
  });

  for (const result of results) {
    const oldGradedDetails = result.answers as any[];
    if (!Array.isArray(oldGradedDetails)) continue;

    let totalPoints = 0;
    let earnedPoints = 0;
    const newGradedDetails: any[] = [];

    // Map student's previous answers by questionId for fast lookup
    const studentAnswersMap = new Map<string, any>();
    for (const detail of oldGradedDetails) {
      if (detail && detail.questionId) {
        studentAnswersMap.set(detail.questionId, detail.studentAnswer);
      }
    }

    for (const q of exam.questions) {
      totalPoints += q.score;
      const studentAnswer = studentAnswersMap.get(q.id);
      let isCorrect = false;
      let correctAnswers: string[] = [];

      if (q.type === "multiple_choice" || q.type === "true_false") {
        const correctOptions = q.options.filter((o) => o.isCorrect);
        correctAnswers = correctOptions.map((o) => o.id);

        if (studentAnswer) {
          isCorrect = correctOptions.some((o) => o.id === studentAnswer);
        }
      } else if (q.type === "fill_blank") {
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

      newGradedDetails.push({
        questionId: q.id,
        questionText: q.content,
        questionType: q.type,
        score: q.score,
        studentAnswer,
        correctAnswers,
        isCorrect,
      });
    }

    const scaledScore = totalPoints > 0 ? parseFloat(((earnedPoints / totalPoints) * 10).toFixed(2)) : 0;

    await prisma.result.update({
      where: { id: result.id },
      data: {
        score: scaledScore,
        answers: newGradedDetails,
      },
    });
  }
};

export const updateExam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, duration, questions } = req.body;

    if (!title || !duration || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ: Tiêu đề, Thời gian thi và danh sách câu hỏi." });
    }

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!exam) {
      return res.status(404).json({ message: "Không tìm thấy đề thi." });
    }

    // 1. Update general exam details
    await prisma.exam.update({
      where: { id },
      data: {
        title,
        description: description || "",
        duration: parseInt(duration),
      },
    });

    // 2. Identify questions to delete
    const incomingQuestionIds = questions
      .map((q: any) => q.id)
      .filter((qId: any) => typeof qId === "string");

    await prisma.question.deleteMany({
      where: {
        examId: id,
        NOT: {
          id: { in: incomingQuestionIds },
        },
      },
    });

    // 3. Update or Create questions and their options
    for (const q of questions) {
      if (q.id && typeof q.id === "string") {
        // Update existing question
        await prisma.question.update({
          where: { id: q.id },
          data: {
            type: q.type,
            content: q.content,
            imageUrl: q.imageUrl || null,
            score: q.score ? parseFloat(q.score) : 1.0,
          },
        });

        // Identify options to delete for this question
        const incomingOptionIds = q.options
          .map((o: any) => o.id)
          .filter((oId: any) => typeof oId === "string");

        await prisma.option.deleteMany({
          where: {
            questionId: q.id,
            NOT: {
              id: { in: incomingOptionIds },
            },
          },
        });

        // Update or Create options
        for (const o of q.options) {
          if (o.id && typeof o.id === "string") {
            // Update option
            await prisma.option.update({
              where: { id: o.id },
              data: {
                content: o.content,
                isCorrect: o.isCorrect === true || o.isCorrect === "true",
              },
            });
          } else {
            // Create option
            await prisma.option.create({
              data: {
                questionId: q.id,
                content: o.content,
                isCorrect: o.isCorrect === true || o.isCorrect === "true",
              },
            });
          }
        }
      } else {
        // Create new question
        await prisma.question.create({
          data: {
            examId: id,
            type: q.type,
            content: q.content,
            imageUrl: q.imageUrl || null,
            score: q.score ? parseFloat(q.score) : 1.0,
            options: {
              create: q.options.map((o: any) => ({
                content: o.content,
                isCorrect: o.isCorrect === true || o.isCorrect === "true",
              })),
            },
          },
        });
      }
    }

    // Automatically regrade all existing student submissions based on the new exam content and answers
    await regradeExamResults(id);

    // Fetch and return the updated exam with questions and options
    const updatedExam = await prisma.exam.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    return res.status(200).json(updatedExam);
  } catch (error: any) {
    console.error("UpdateExam error:", error);
    return res.status(500).json({ message: "Lỗi chỉnh sửa đề thi.", error: error.message });
  }
};

export const deleteExam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const exam = await prisma.exam.findUnique({
      where: { id },
    });

    if (!exam) {
      return res.status(404).json({ message: "Không tìm thấy đề thi." });
    }

    await prisma.exam.delete({
      where: { id },
    });

    return res.status(200).json({ message: "Đã xóa đề thi thành công." });
  } catch (error: any) {
    console.error("DeleteExam error:", error);
    return res.status(500).json({ message: "Lỗi xóa đề thi.", error: error.message });
  }
};
