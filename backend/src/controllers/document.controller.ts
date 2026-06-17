import { Request, Response } from "express";
import prisma from "../config/db";
import { StorageService } from "../services/storage";

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const { title, description, courseId } = req.body;
    const file = req.file;

    if (!title || !courseId) {
      return res.status(400).json({ message: "Vui lòng cung cấp tiêu đề tài liệu và mã khóa học." });
    }

    if (!file) {
      return res.status(400).json({ message: "Vui lòng chọn file PDF để tải lên." });
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({ message: "Khóa học không tồn tại." });
    }

    // Upload to storage
    const uploadResult = await StorageService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        title,
        description: description || "",
        fileUrl: uploadResult.fileUrl,
        fileSize: uploadResult.fileSize,
        courseId,
      },
    });

    return res.status(201).json(document);
  } catch (error: any) {
    console.error("UploadDocument error:", error);
    return res.status(500).json({ message: "Lỗi tải lên tài liệu.", error: error.message });
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return res.status(404).json({ message: "Không tìm thấy tài liệu." });
    }

    // Delete file from storage (R2, Supabase, or Local uploads folder)
    await StorageService.deleteFile(document.fileUrl);

    // Delete record from database
    await prisma.document.delete({
      where: { id },
    });

    return res.status(200).json({ message: "Đã xóa tài liệu thành công." });
  } catch (error: any) {
    console.error("DeleteDocument error:", error);
    return res.status(500).json({ message: "Lỗi xóa tài liệu.", error: error.message });
  }
};

export const getDocumentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        course: {
          select: { title: true },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ message: "Tài liệu không tồn tại." });
    }

    return res.status(200).json(document);
  } catch (error: any) {
    console.error("GetDocumentById error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống.", error: error.message });
  }
};
