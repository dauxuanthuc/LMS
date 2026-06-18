import { Router } from "express";
import { login, getMe } from "../controllers/auth.controller";
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  toggleLockStatus,
} from "../controllers/user.controller";
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../controllers/course.controller";
import {
  uploadDocument,
  deleteDocument,
  getDocumentById,
} from "../controllers/document.controller";
import {
  getExamsByCourse,
  getExamById,
  createExam,
  deleteExam,
} from "../controllers/exam.controller";
import {
  submitExam,
  getMyResults,
  getAllResults,
  getResultById,
} from "../controllers/result.controller";
import {
  createPracticeSet,
  getPracticeSetsByCourse,
  findPracticeSetByCode,
  getPracticeSetById,
  createPracticeSession,
  gradePracticeSession,
} from "../controllers/practice.controller";
import { authenticate, requireRole } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================
router.post("/auth/login", login);
router.get("/auth/me", authenticate, getMe);

// ==========================================
// USER (STUDENT) MANAGEMENT (ADMIN ONLY)
// ==========================================
router.get("/users", authenticate, requireRole(["ADMIN"]), getStudents);
router.post("/users", authenticate, requireRole(["ADMIN"]), createStudent);
router.put("/users/:id", authenticate, requireRole(["ADMIN"]), updateStudent);
router.delete("/users/:id", authenticate, requireRole(["ADMIN"]), deleteStudent);
router.patch("/users/:id/toggle-lock", authenticate, requireRole(["ADMIN"]), toggleLockStatus);

// ==========================================
// COURSE ROUTES
// ==========================================
router.get("/courses", authenticate, getCourses);
router.get("/courses/:id", authenticate, getCourseById);
router.post("/courses", authenticate, requireRole(["ADMIN"]), createCourse);
router.put("/courses/:id", authenticate, requireRole(["ADMIN"]), updateCourse);
router.delete("/courses/:id", authenticate, requireRole(["ADMIN"]), deleteCourse);

// ==========================================
// DOCUMENT ROUTES
// ==========================================
router.post(
  "/documents",
  authenticate,
  requireRole(["ADMIN"]),
  upload.single("file"),
  uploadDocument
);
router.delete("/documents/:id", authenticate, requireRole(["ADMIN"]), deleteDocument);
router.get("/documents/:id", authenticate, getDocumentById);

// ==========================================
// EXAM ROUTES
// ==========================================
router.get("/courses/:courseId/exams", authenticate, getExamsByCourse);
router.get("/exams/:id", authenticate, getExamById);
router.post("/exams", authenticate, requireRole(["ADMIN"]), createExam);
router.delete("/exams/:id", authenticate, requireRole(["ADMIN"]), deleteExam);

// ==========================================
// RESULT & GRADING ROUTES
// ==========================================
router.post("/results/submit", authenticate, submitExam);
router.get("/results/me", authenticate, getMyResults);
router.get("/results", authenticate, requireRole(["ADMIN"]), getAllResults);
router.get("/results/:id", authenticate, getResultById);

// ==========================================
// PRACTICE ROUTES (FREE PRACTICE)
// ==========================================
router.post("/practice", authenticate, requireRole(["ADMIN"]), createPracticeSet);
router.get("/practice/courses/:courseId", authenticate, getPracticeSetsByCourse);
router.post("/practice/by-code", authenticate, findPracticeSetByCode);
router.get("/practice/:id", authenticate, getPracticeSetById);
router.post("/practice/:id/session", authenticate, createPracticeSession);
router.post("/practice/:id/grade", authenticate, gradePracticeSession);

export default router;
