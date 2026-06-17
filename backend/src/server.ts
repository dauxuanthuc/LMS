import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import * as path from "path";
import apiRoutes from "./routes/api.routes";
import { StorageService } from "./services/storage";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize file upload structure (e.g. create uploads dir if local)
StorageService.init();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local static file uploads
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
app.use("/uploads", express.static(path.resolve(uploadDir)));

// Register API routes
app.use("/api", apiRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Global Error Handler caught an error:", err);
  
  if (err instanceof Error) {
    return res.status(400).json({ message: err.message });
  }
  
  return res.status(500).json({ message: "Đã xảy ra lỗi không xác định trên máy chủ." });
});

// Root Route
app.get("/", (req: Request, res: Response) => {
  res.send("LMS API Server is running successfully.");
});

// Start Server
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`LMS Server is running on port: ${PORT}`);
  console.log(`Local Static Uploads served on: /uploads`);
  console.log(`========================================`);
});
