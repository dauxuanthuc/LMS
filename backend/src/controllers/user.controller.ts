import { Request, Response } from "express";
import * as bcrypt from "bcryptjs";
import prisma from "../config/db";

export const getStudents = async (req: Request, res: Response) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(students);
  } catch (error: any) {
    console.error("GetStudents error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống.", error: error.message });
  }
};

export const createStudent = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin: họ tên, email, mật khẩu." });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email này đã được sử dụng bởi một tài khoản khác." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStudent = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "STUDENT",
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
      },
    });

    return res.status(201).json(newStudent);
  } catch (error: any) {
    console.error("CreateStudent error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống.", error: error.message });
  }
};

export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, password, status } = req.body;

    const student = await prisma.user.findUnique({
      where: { id },
    });

    if (!student || student.role !== "STUDENT") {
      return res.status(404).json({ message: "Không tìm thấy học viên." });
    }

    // Check email availability if updated
    if (email && email !== student.email) {
      const emailCheck = await prisma.user.findUnique({ where: { email } });
      if (emailCheck) {
        return res.status(400).json({ message: "Email này đã được sử dụng." });
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (status) updateData.status = status;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedStudent = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
      },
    });

    return res.status(200).json(updatedStudent);
  } catch (error: any) {
    console.error("UpdateStudent error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống.", error: error.message });
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const student = await prisma.user.findUnique({
      where: { id },
    });

    if (!student || student.role !== "STUDENT") {
      return res.status(404).json({ message: "Không tìm thấy học viên." });
    }

    await prisma.user.delete({
      where: { id },
    });

    return res.status(200).json({ message: "Đã xóa học viên thành công." });
  } catch (error: any) {
    console.error("DeleteStudent error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống.", error: error.message });
  }
};

export const toggleLockStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const student = await prisma.user.findUnique({
      where: { id },
    });

    if (!student || student.role !== "STUDENT") {
      return res.status(404).json({ message: "Không tìm thấy học viên." });
    }

    const newStatus = student.status === "ACTIVE" ? "LOCKED" : "ACTIVE";

    const updated = await prisma.user.update({
      where: { id },
      data: { status: newStatus },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    });

    const statusMsg = newStatus === "LOCKED" ? "đã khóa" : "đã mở khóa";
    return res.status(200).json({
      message: `Tài khoản học viên ${statusMsg} thành công.`,
      user: updated,
    });
  } catch (error: any) {
    console.error("ToggleLock error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống.", error: error.message });
  }
};
