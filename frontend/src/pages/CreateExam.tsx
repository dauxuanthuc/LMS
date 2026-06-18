import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { ArrowLeft, Plus, Trash2, CheckCircle2, ShieldAlert, Award, Save, HelpCircle, Loader2 } from "lucide-react";

interface QuestionInput {
  type: "multiple_choice" | "true_false" | "fill_blank";
  content: string;
  imageUrl?: string | null;
  score: number;
  options: {
    content: string;
    isCorrect: boolean;
  }[];
}

const CreateExam: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [duration, setDuration] = useState<number>(30); // Default 30 mins
  const [questions, setQuestions] = useState<QuestionInput[]>([
    {
      type: "multiple_choice",
      content: "",
      imageUrl: null,
      score: 2.5,
      options: [
        { content: "", isCorrect: true },
        { content: "", isCorrect: false },
        { content: "", isCorrect: false },
        { content: "", isCorrect: false },
      ],
    },
  ]);

  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        type: "multiple_choice",
        content: "",
        imageUrl: null,
        score: 2.5,
        options: [
          { content: "", isCorrect: true },
          { content: "", isCorrect: false },
          { content: "", isCorrect: false },
          { content: "", isCorrect: false },
        ],
      },
    ]);
  };

  const handleRemoveQuestion = (qIndex: number) => {
    if (questions.length === 1) {
      alert("Đề thi phải chứa ít nhất 1 câu hỏi.");
      return;
    }
    setQuestions(questions.filter((_, idx) => idx !== qIndex));
  };

  const handleQuestionTypeChange = (qIndex: number, newType: "multiple_choice" | "true_false" | "fill_blank") => {
    const updated = [...questions];
    updated[qIndex].type = newType;

    if (newType === "true_false") {
      updated[qIndex].options = [
        { content: "Đúng (True)", isCorrect: true },
        { content: "Sai (False)", isCorrect: false },
      ];
    } else if (newType === "fill_blank") {
      updated[qIndex].options = [{ content: "", isCorrect: true }];
    } else {
      updated[qIndex].options = [
        { content: "", isCorrect: true },
        { content: "", isCorrect: false },
        { content: "", isCorrect: false },
        { content: "", isCorrect: false },
      ];
    }

    setQuestions(updated);
  };

  const handleQuestionTextChange = (qIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].content = value;
    setQuestions(updated);
  };

  const handleQuestionScoreChange = (qIndex: number, value: number) => {
    const updated = [...questions];
    updated[qIndex].score = isNaN(value) ? 0 : value;
    setQuestions(updated);
  };

  const handleOptionTextChange = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex].content = value;
    setQuestions(updated);
  };

  const handleOptionCorrectChange = (qIndex: number, oIndex: number) => {
    const updated = [...questions];
    if (updated[qIndex].type === "multiple_choice" || updated[qIndex].type === "true_false") {
      // Toggle correctness (Single select model for simplicity)
      updated[qIndex].options = updated[qIndex].options.map((opt, idx) => ({
        ...opt,
        isCorrect: idx === oIndex,
      }));
    }
    setQuestions(updated);
  };

  const handleQuestionImageUpload = async (qIndex: number, file: File | null) => {
    if (!file) return;

    setError(null);
    setUploadingImageIndex(qIndex);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await api.post("/exams/upload-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const imageUrl = response.data?.imageUrl;
      if (imageUrl) {
        const updated = [...questions];
        updated[qIndex].imageUrl = imageUrl;
        setQuestions(updated);
      }
    } catch (err: any) {
      console.error("Failed to upload exam question image:", err);
      setError(err.response?.data?.message || "Không thể tải ảnh câu hỏi bài thi.");
    } finally {
      setUploadingImageIndex(null);
    }
  };

  const handleClearQuestionImage = (qIndex: number) => {
    const updated = [...questions];
    updated[qIndex].imageUrl = null;
    setQuestions(updated);
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) {
      setError("Tiêu đề đề thi không được để trống.");
      return;
    }

    if (duration <= 0) {
      setError("Thời gian thi phải lớn hơn 0 phút.");
      return;
    }

    // Verify all questions have content
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.content.trim()) {
        setError(`Câu hỏi số ${i + 1} chưa điền nội dung câu hỏi.`);
        return;
      }
      
      // Verify options
      if (q.type === "multiple_choice") {
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].content.trim()) {
            setError(`Câu hỏi số ${i + 1} có lựa chọn thứ ${j + 1} để trống.`);
            return;
          }
        }
      } else if (q.type === "fill_blank") {
        if (!q.options[0].content.trim()) {
          setError(`Câu hỏi số ${i + 1} chưa nhập từ điền đúng.`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      await api.post("/exams", {
        title,
        description,
        duration,
        courseId,
        questions,
      });

      navigate(`/courses/${courseId}`);
    } catch (err: any) {
      console.error("Failed to create exam:", err);
      setError(err.response?.data?.message || "Đã xảy ra lỗi khi tạo đề thi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 animate-fade-in">
      {/* Header */}
      <Link to={`/courses/${courseId}`} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Quay lại chi tiết khóa học
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b border-dark-700/60 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Award className="w-8 h-8 text-amber-500" /> Tạo bài kiểm tra mới
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Xây dựng đề thi trắc nghiệm, đúng sai và điền từ, thiết lập thang điểm.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-red-300 text-xs flex gap-2.5">
          <ShieldAlert className="w-4.5 h-4.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSaveExam} className="flex flex-col gap-8">
        {/* Exam Base Details */}
        <div className="glass-card p-6 flex flex-col gap-5">
          <h3 className="text-lg font-bold text-white mb-2">1. Thông tin chung</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Tiêu đề bài kiểm tra
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Kiểm tra chương 1..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="glass-input text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Thời gian thi (phút)
              </label>
              <input
                type="number"
                required
                min={1}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="glass-input text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Mô tả / Hướng dẫn thi
            </label>
            <textarea
              placeholder="Nhập hướng dẫn thi cho học viên..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass-input text-sm"
            />
          </div>
        </div>

        {/* Questions Manager */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-brand-400" /> 2. Danh sách câu hỏi ({questions.length})
            </h3>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="px-4 py-2.5 bg-brand-600/10 border border-brand-500/20 text-brand-400 hover:bg-brand-600/20 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Thêm câu hỏi
            </button>
          </div>

          {questions.map((question, qIndex) => (
            <div key={qIndex} className="glass-card p-6 border-l-4 border-l-brand-500 relative flex flex-col gap-5">
              {/* Question Header Controls */}
              <div className="flex justify-between items-start gap-4">
                <span className="font-extrabold text-sm text-brand-400 bg-brand-500/10 px-3 py-1 rounded-lg">
                  Câu hỏi {qIndex + 1}
                </span>

                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(qIndex)}
                  className="p-1.5 rounded-lg bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-900/20 transition-all cursor-pointer"
                  title="Xóa câu hỏi này"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Type, Content, Score Row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Type Selection */}
                <div className="md:col-span-3 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loại câu hỏi</label>
                  <select
                    value={question.type}
                    onChange={(e) => handleQuestionTypeChange(qIndex, e.target.value as any)}
                    className="w-full bg-dark-950/80 border border-dark-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="multiple_choice">Trắc nghiệm (4 đáp án)</option>
                    <option value="true_false">Đúng / Sai</option>
                    <option value="fill_blank">Điền từ vào chỗ trống</option>
                  </select>
                </div>

                {/* Score Input */}
                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Điểm số</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={question.score}
                    onChange={(e) => handleQuestionScoreChange(qIndex, parseFloat(e.target.value))}
                    className="w-full bg-dark-950/80 border border-dark-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>

                {/* Question Prompt */}
                <div className="md:col-span-7 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nội dung câu hỏi</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: AI viết tắt của từ nào? hoặc Thẻ ______ dùng để tạo liên kết."
                    value={question.content}
                    onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                    className="w-full bg-dark-950/80 border border-dark-700 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Options Inputs Block */}
              <div className="bg-dark-900/40 p-4 rounded-xl border border-dark-700/40 flex flex-col gap-3">
                <div className="flex flex-col gap-2 p-3 rounded-xl bg-dark-950/40 border border-dark-700/50">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ảnh câu hỏi (tùy chọn)</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={(e) => handleQuestionImageUpload(qIndex, e.target.files?.[0] || null)}
                      className="text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-500/15 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-300 hover:file:bg-brand-500/25"
                    />
                    {uploadingImageIndex === qIndex && (
                      <span className="text-xs text-brand-300 inline-flex items-center gap-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải ảnh...
                      </span>
                    )}
                    {question.imageUrl && (
                      <button
                        type="button"
                        onClick={() => handleClearQuestionImage(qIndex)}
                        className="px-2.5 py-1 rounded-lg border border-red-800/40 bg-red-950/30 text-red-300 text-xs"
                      >
                        Xóa ảnh
                      </button>
                    )}
                  </div>

                  {question.imageUrl && (
                    <img
                      src={question.imageUrl}
                      alt={`exam-question-${qIndex + 1}`}
                      className="mt-1 max-h-64 w-full object-contain rounded-xl border border-dark-700/60 bg-dark-950/40"
                    />
                  )}
                </div>

                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
                  {question.type === "fill_blank" ? "Từ khóa/Đáp án điền đúng" : "Danh sách đáp án lựa chọn"}
                </label>

                {question.type === "multiple_choice" && (
                  <div className="flex flex-col gap-3">
                    {question.options.map((option, oIndex) => {
                      const letters = ["A", "B", "C", "D"];
                      return (
                        <div key={oIndex} className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleOptionCorrectChange(qIndex, oIndex)}
                            className={`p-1.5 rounded-full cursor-pointer transition-colors ${
                              option.isCorrect ? "text-emerald-400" : "text-slate-500 hover:text-slate-400"
                            }`}
                          >
                            <CheckCircle2 className="w-5 h-5 fill-current bg-dark-950 rounded-full" />
                          </button>
                          <span className="text-xs font-bold text-slate-400 w-4">{letters[oIndex]}.</span>
                          <input
                            type="text"
                            required
                            placeholder={`Nhập phương án ${letters[oIndex]}...`}
                            value={option.content}
                            onChange={(e) => handleOptionTextChange(qIndex, oIndex, e.target.value)}
                            className="flex-grow bg-dark-950/70 border border-dark-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {question.type === "true_false" && (
                  <div className="grid grid-cols-2 gap-4">
                    {question.options.map((option, oIndex) => (
                      <button
                        type="button"
                        key={oIndex}
                        onClick={() => handleOptionCorrectChange(qIndex, oIndex)}
                        className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-between cursor-pointer transition-all ${
                          option.isCorrect
                            ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/30"
                            : "bg-dark-950/50 text-slate-400 border-dark-700/60"
                        }`}
                      >
                        <span>{option.content}</span>
                        {option.isCorrect && <CheckCircle2 className="w-4 h-4 fill-emerald-500/25" />}
                      </button>
                    ))}
                  </div>
                )}

                {question.type === "fill_blank" && (
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Nhập chính xác từ cần điền đúng (không phân biệt hoa/thường)..."
                      value={question.options[0].content}
                      onChange={(e) => handleOptionTextChange(qIndex, 0, e.target.value)}
                      className="w-full bg-dark-950/70 border border-dark-750 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Submit Buttons */}
        <div className="flex justify-end gap-3 mt-4">
          <Link to={`/courses/${courseId}`} className="btn-secondary text-sm">
            Hủy thiết lập
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary text-sm cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Đang thiết lập...
              </>
            ) : (
              <>
                <Save className="w-4.5 h-4.5" /> Lưu & Xuất bản đề thi
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateExam;
