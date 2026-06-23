import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { BookOpen, FileText, Award, Plus, Trash2, ArrowLeft, Upload, Loader2, Sparkles, Edit } from "lucide-react";

interface Document {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileSize: number;
  createdAt: string;
}

interface Exam {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  createdAt: string;
}

interface CourseDetails {
  id: string;
  title: string;
  description: string | null;
  documents: Document[];
  exams: Exam[];
  practiceSets: Array<{
    id: string;
    title: string;
    description: string | null;
    accessCode: string | null;
    _count?: { questions: number };
  }>;
}

const CourseDetail: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Upload Document Modal State
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [docTitle, setDocTitle] = useState<string>("");
  const [docDescription, setDocDescription] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchCourseDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/courses/${courseId}`);
      setCourse(response.data);
    } catch (error) {
      console.error("Failed to load course details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const handleOpenUpload = () => {
    setDocTitle("");
    setDocDescription("");
    setSelectedFile(null);
    setUploadError(null);
    setIsUploadOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        setUploadError("Chỉ chấp nhận file PDF.");
        setSelectedFile(null);
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        setUploadError("Dung lượng file vượt quá giới hạn 100MB.");
        setSelectedFile(null);
        return;
      }
      setUploadError(null);
      setSelectedFile(file);
      if (!docTitle) {
        // Pre-fill title with file name without extension
        setDocTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !selectedFile || !courseId) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("title", docTitle);
    formData.append("description", docDescription);
    formData.append("courseId", courseId);
    formData.append("file", selectedFile);

    try {
      await api.post("/documents", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      fetchCourseDetails();
      setIsUploadOpen(false);
    } catch (error: any) {
      console.error("Failed to upload document:", error);
      setUploadError(error.response?.data?.message || "Đã xảy ra lỗi khi tải lên tài liệu.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string, docTitle: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa tài liệu "${docTitle}"?`)) {
      try {
        await api.delete(`/documents/${docId}`);
        fetchCourseDetails();
      } catch (error) {
        console.error("Failed to delete document:", error);
        alert("Xóa tài liệu thất bại.");
      }
    }
  };

  const handleDeleteExam = async (examId: string, examTitle: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa bài thi "${examTitle}"? Tất cả kết quả thi của học viên cũng sẽ bị xóa.`)) {
      try {
        await api.delete(`/exams/${examId}`);
        fetchCourseDetails();
      } catch (error) {
        console.error("Failed to delete exam:", error);
        alert("Xóa bài thi thất bại.");
      }
    }
  };

  // Utility to convert file bytes to KB/MB readable formats
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24">
        <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Đang tải chi tiết khóa học...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-md mx-auto mt-16 p-8 text-center glass-card">
        <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Khóa học không tồn tại</h2>
        <p className="text-slate-400 text-sm">Khóa học có thể đã bị xóa hoặc không hợp lệ.</p>
        <Link to="/" className="btn-primary mt-6 mx-auto">
          Quay lại Bảng điều khiển
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-fade-in">
      {/* Navigation Header */}
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Quay lại Bảng điều khiển
      </Link>

      {/* Course Detail Card */}
      <div className="glass-card p-8 mb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 blur-[80px] pointer-events-none rounded-full" />
        <div className="flex items-center gap-3 text-brand-400 text-xs font-bold uppercase tracking-wider mb-2.5">
          <Sparkles className="w-4 h-4 animate-pulse" /> Chi tiết khóa học
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-4">{course.title}</h1>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-4xl">
          {course.description || "Chưa có thông tin mô tả đầy đủ cho khóa học này."}
        </p>
      </div>

      {/* Grid for Documents and Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: PDF Documents (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5.5 h-5.5 text-brand-400" /> Tài liệu PDF online
              <span className="text-xs bg-dark-750 text-slate-400 px-2 py-0.5 rounded-full border border-dark-700">
                {course.documents.length}
              </span>
            </h2>
            {user?.role === "ADMIN" && (
              <button onClick={handleOpenUpload} className="px-4 py-2 bg-dark-800 hover:bg-dark-700 border border-dark-600/50 hover:border-brand-500/30 text-xs font-semibold text-brand-400 hover:text-brand-300 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all">
                <Upload className="w-4 h-4" /> Tải lên tài liệu
              </button>
            )}
          </div>

          {course.documents.length === 0 ? (
            <div className="text-center p-12 glass-card flex-grow flex flex-col justify-center items-center">
              <FileText className="w-10 h-10 text-slate-655 mb-3" />
              <p className="text-slate-450 text-xs font-semibold">Chưa có tài liệu nào tải lên.</p>
              {user?.role === "ADMIN" && (
                <button onClick={handleOpenUpload} className="px-3.5 py-2 bg-brand-600/10 text-brand-400 border border-brand-500/20 hover:bg-brand-600/20 text-xs font-bold mt-3.5 rounded-xl cursor-pointer transition-all">
                  Tải lên PDF ngay
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {course.documents.map((doc) => (
                <div key={doc.id} className="glass-card p-5 hover:bg-dark-800/80 group transition-all duration-300 flex items-center justify-between gap-6">
                  <Link to={`/documents/${doc.id}`} className="flex-grow flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0 group-hover:scale-105 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white group-hover:text-brand-400 transition-colors line-clamp-1">
                        {doc.title}
                      </h4>
                      <p className="text-slate-450 text-xs mt-0.5 line-clamp-1">
                        {doc.description || "Tài liệu học tập tự học"}
                      </p>
                      <span className="inline-block text-[10px] font-bold text-slate-450 uppercase tracking-wide mt-2">
                        {formatFileSize(doc.fileSize)} • Đăng tải: {new Date(doc.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </Link>
                  {user?.role === "ADMIN" && (
                    <button
                      onClick={() => handleDeleteDocument(doc.id, doc.title)}
                      className="p-2.5 rounded-xl bg-red-950/20 hover:bg-red-900/30 border border-red-900/20 hover:border-red-500/30 text-red-400 cursor-pointer transition-all active:scale-95"
                      title="Xóa tài liệu"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Quiz Exams (5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="w-5.5 h-5.5 text-brand-400" /> Bài kiểm tra
              <span className="text-xs bg-dark-750 text-slate-400 px-2 py-0.5 rounded-full border border-dark-700">
                {course.exams.length}
              </span>
            </h2>
            {user?.role === "ADMIN" && (
              <Link to={`/courses/${courseId}/exams/create`} className="px-4 py-2 bg-dark-800 hover:bg-dark-700 border border-dark-600/50 hover:border-brand-500/30 text-xs font-semibold text-brand-400 hover:text-brand-300 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all">
                <Plus className="w-4 h-4" /> Tạo đề thi mới
              </Link>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5.5 h-5.5 text-brand-400" /> Ôn tập tự do
              <span className="text-xs bg-dark-750 text-slate-400 px-2 py-0.5 rounded-full border border-dark-700">
                {course.practiceSets?.length || 0}
              </span>
            </h2>
            {user?.role === "ADMIN" && (
              <Link to={`/courses/${courseId}/practice/create`} className="px-4 py-2 bg-dark-800 hover:bg-dark-700 border border-dark-600/50 hover:border-brand-500/30 text-xs font-semibold text-brand-400 hover:text-brand-300 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all">
                <Plus className="w-4 h-4" /> Tạo bộ ôn
              </Link>
            )}
          </div>

          {(course.practiceSets?.length || 0) > 0 && (
            <div className="flex flex-col gap-4 mb-8">
              {course.practiceSets.map((set) => (
                <Link key={set.id} to={`/practice/${set.id}`} className="glass-card p-5 hover:bg-dark-800/80 group transition-all duration-300 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-white group-hover:text-brand-400 transition-colors line-clamp-1">
                      {set.title}
                    </h4>
                    <p className="text-slate-455 text-xs mt-0.5 line-clamp-1">
                      {set.description || "Bộ đề ôn tập theo môn học"}
                    </p>
                    <span className="inline-block text-[10px] font-bold text-brand-300 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20 uppercase tracking-wider mt-2.5">
                      {set._count?.questions || 0} câu hỏi
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-brand-400">Vào ôn tập</span>
                </Link>
              ))}
            </div>
          )}

          {course.exams.length === 0 ? (
            <div className="text-center p-12 glass-card flex-grow flex flex-col justify-center items-center">
              <Award className="w-10 h-10 text-slate-655 mb-3" />
              <p className="text-slate-455 text-xs font-semibold">Chưa có bài thi nào hoạt động.</p>
              {user?.role === "ADMIN" && (
                <Link to={`/courses/${courseId}/exams/create`} className="px-3.5 py-2 bg-brand-600/10 text-brand-400 border border-brand-500/20 hover:bg-brand-600/20 text-xs font-bold mt-3.5 rounded-xl cursor-pointer transition-all">
                  Tạo đề thi ngay
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {course.exams.map((exam) => (
                <div key={exam.id} className="glass-card p-5 hover:bg-dark-800/80 group transition-all duration-300 flex items-center justify-between gap-4">
                  <Link
                    to={user?.role === "ADMIN" ? `/results?examId=${exam.id}` : `/exams/${exam.id}`}
                    className="flex-grow flex items-start gap-3.5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white group-hover:text-brand-400 transition-colors line-clamp-1">
                        {exam.title}
                      </h4>
                      <p className="text-slate-455 text-xs mt-0.5 line-clamp-1">
                        {exam.description || "Bài thi đánh giá học tập"}
                      </p>
                      <span className="inline-block text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider mt-2.5">
                        Thời gian: {exam.duration} phút
                      </span>
                    </div>
                  </Link>

                  {user?.role === "ADMIN" && (
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/exams/manage/${exam.id}/edit`}
                        className="p-2.5 rounded-xl bg-brand-950/20 hover:bg-brand-900/30 border border-brand-900/20 hover:border-brand-500/30 text-brand-400 cursor-pointer transition-all active:scale-95 flex items-center justify-center"
                        title="Chỉnh sửa đề thi"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteExam(exam.id, exam.title)}
                        className="p-2.5 rounded-xl bg-red-950/20 hover:bg-red-900/30 border border-red-900/20 hover:border-red-500/30 text-red-400 cursor-pointer transition-all active:scale-95 flex items-center justify-center"
                        title="Xóa đề thi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload PDF Document Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-card p-6 animate-slide-up">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Upload className="w-5 h-5 text-brand-400" /> Tải lên tài liệu PDF online
            </h3>

            {uploadError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-red-400 text-xs flex gap-2">
                <Trash2 className="w-4.5 h-4.5 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadDocument} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Tiêu đề tài liệu
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tiêu đề tài liệu học..."
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="glass-input text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Mô tả ngắn gọn
                </label>
                <textarea
                  placeholder="Nhập mô tả tóm tắt nội dung tài liệu..."
                  rows={2}
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                  className="glass-input text-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Chọn file PDF (Tối đa 100MB)
                </label>
                <div className="relative border-2 border-dashed border-dark-600/85 hover:border-brand-500/40 rounded-xl p-6 flex flex-col items-center justify-center bg-dark-950/40 hover:bg-dark-900/30 transition-all cursor-pointer">
                  <input
                    type="file"
                    required
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-slate-500 mb-2" />
                  <span className="text-xs font-semibold text-slate-300">
                    {selectedFile ? selectedFile.name : "Kéo thả hoặc nhấp để chọn file PDF"}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1">
                    {selectedFile ? formatFileSize(selectedFile.size) : "Chấp nhận file định dạng .pdf tối đa 100MB"}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="btn-secondary text-xs cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile || !docTitle.trim()}
                  className="btn-primary text-xs cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang tải lên...
                    </>
                  ) : (
                    "Tải lên tài liệu"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
