import multer from "multer";

// Max size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    // Only accept PDF documents
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận tài liệu định dạng PDF (.pdf)"));
    }
  },
});
