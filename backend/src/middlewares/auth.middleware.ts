import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import prisma from "../config/db";

const JWT_SECRET = process.env.JWT_SECRET || "lms_super_secret_key_123_abc_xyz";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "ADMIN" | "STUDENT";
    status: "ACTIVE" | "LOCKED";
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không tìm thấy token xác thực." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: "ADMIN" | "STUDENT";
    };

    // Verify user still exists in database and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user) {
      return res.status(401).json({ message: "Tài khoản không tồn tại trong hệ thống." });
    }

    if (user.status === "LOCKED") {
      return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin." });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as "ADMIN" | "STUDENT",
      status: user.status as "ACTIVE" | "LOCKED",
    };

    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn." });
  }
};

export const requireRole = (roles: ("ADMIN" | "STUDENT")[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Bạn cần đăng nhập trước." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Bạn không có quyền thực hiện hành động này." });
    }

    next();
  };
};
