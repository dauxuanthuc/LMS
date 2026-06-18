import { Request, Response } from "express";
import prisma from "../config/db";

export const getCourses = async (req: Request, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        _count: {
          select: {
            documents: true,
            exams: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(courses);
  } catch (error: any) {
    console.error("GetCourses error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống.", error: error.message });
  }
};

export const getCourseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        documents: {
          orderBy: { createdAt: "desc" },
        },
        exams: {
          orderBy: { createdAt: "desc" },
        },
        practiceSets: {
          where: {
            courseId: {
              not: null,
            },
          },
          include: {
            _count: {
              select: { questions: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học." });
    }

    return res.status(200).json(course);
  } catch (error: any) {
    console.error("GetCourseById error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống.", error: error.message });
  }
};

export const createCourse = async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Tiêu đề khóa học là bắt buộc." });
    }

    const newCourse = await prisma.course.create({
      data: {
        title,
        description,
      },
    });

    return res.status(201).json(newCourse);
  } catch (error: any) {
    console.error("CreateCourse error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống.", error: error.message });
  }
};

export const updateCourse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Tiêu đề khóa học là bắt buộc." });
    }

    const course = await prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học." });
    }

    const updated = await prisma.course.update({
      where: { id },
      data: {
        title,
        description,
      },
    });

    return res.status(200).json(updated);
  } catch (error: any) {
    console.error("UpdateCourse error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống.", error: error.message });
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học." });
    }

    // Also need to clean up file storage for any documents belonging to this course
    const documents = await prisma.document.findMany({
      where: { courseId: id },
    });

    // Delete documents files
    const { StorageService } = require("../services/storage");
    for (const doc of documents) {
      await StorageService.deleteFile(doc.fileUrl);
    }

    await prisma.course.delete({
      where: { id },
    });

    return res.status(200).json({ message: "Đã xóa khóa học thành công." });
  } catch (error: any) {
    console.error("DeleteCourse error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống.", error: error.message });
  }
};
