import multer from "multer";

// Max size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const storage = multer.memoryStorage();

export const uploadDocumentFile = multer({
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

export const uploadImage = multer({
  storage: storage,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (IMAGE_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận ảnh JPG, PNG, WEBP hoặc GIF."));
    }
  },
});

// Backward compatible export used by document routes.
export const upload = uploadDocumentFile;
