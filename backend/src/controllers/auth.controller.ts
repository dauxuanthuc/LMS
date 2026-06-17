import { Request, Response } from "express";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import prisma from "../config/db";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

const JWT_SECRET = process.env.JWT_SECRET || "lms_super_secret_key_123_abc_xyz";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ email và mật khẩu." });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không chính xác." });
    }

    if (user.status === "LOCKED") {
      return res.status(403).json({ message: "Tài khoản của bạn đang bị khóa." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không chính xác." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Đã xảy ra lỗi hệ thống.", error: error.message });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Chưa xác thực." });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    return res.status(200).json({ user });
  } catch (error: any) {
    console.error("GetMe error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống.", error: error.message });
  }
};
