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
