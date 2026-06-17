import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import PDFViewer from "../components/PDFViewer";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";

interface DocumentDetails {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  courseId: string;
  course: {
    title: string;
  };
}

const DocumentView: React.FC = () => {
  const { id: docId } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDocument = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/documents/${docId}`);
        setDoc(response.data);
      } catch (error) {
        console.error("Failed to load document details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [docId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24">
        <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Đang mở tài liệu...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="max-w-md mx-auto mt-16 p-8 text-center glass-card">
        <FileText className="w-12 h-12 text-slate-655 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Tài liệu không tồn tại</h2>
        <p className="text-slate-455 text-sm">Tài liệu có thể đã bị xóa hoặc không hợp lệ.</p>
        <Link to="/" className="btn-primary mt-6 mx-auto">
          Quay lại Bảng điều khiển
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 animate-fade-in">
      {/* Navigation and Title Header */}
      <div className="mb-6">
        <Link
          to={`/courses/${doc.courseId}`}
          className="inline-flex items-center gap-2 text-xs text-slate-450 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại {doc.course.title}
        </Link>
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight">{doc.title}</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              {doc.description || "Tài liệu lý thuyết / bài tập tự học."}
            </p>
          </div>
        </div>
      </div>

      {/* Embedded Secure PDF Viewer */}
      <div className="glass-card p-4">
        <PDFViewer fileUrl={doc.fileUrl} />
      </div>
    </div>
  );
};

export default DocumentView;
