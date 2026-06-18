import React, { useEffect, useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import api from "../services/api";
import { ArrowLeft, Plus, Trash2, CheckCircle2, ShieldAlert, Save, HelpCircle, Loader2, Sparkles } from "lucide-react";

interface QuestionInput {
  type: "multiple_choice" | "true_false" | "fill_blank";
  content: string;
  score: number;
  options: {
    content: string;
    isCorrect: boolean;
  }[];
}

const CreatePractice: React.FC = () => {
  const { id: courseId, practiceId } = useParams<{ id?: string; practiceId?: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [questions, setQuestions] = useState<QuestionInput[]>([
    {
      type: "multiple_choice",
      content: "",
      score: 1,
      options: [
        { content: "", isCorrect: true },
        { content: "", isCorrect: false },
        { content: "", isCorrect: false },
        { content: "", isCorrect: false },
      ],
    },
  ]);
  const [saving, setSaving] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [existingAccessCode, setExistingAccessCode] = useState<string | null>(null);

  const isStandalone = !courseId;
  const isEditMode = Boolean(practiceId);

  useEffect(() => {
    const fetchPracticeToEdit = async () => {
      if (!practiceId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/practice/${practiceId}`);
        const data = response.data;

        setTitle(data.title || "");
        setDescription(data.description || "");
        setExistingAccessCode(data.accessCode || null);

        const mappedQuestions = (data.questions || []).map((q: any) => ({
          type: q.type,
          content: q.content,
          score: Number(q.score) || 1,
          options: (q.options || []).map((o: any) => ({
            content: o.content,
            isCorrect: Boolean(o.isCorrect),
          })),
        }));

        if (mappedQuestions.length > 0) {
          setQuestions(mappedQuestions);
        }
      } catch (err: any) {
        console.error("Failed to load practice set for editing:", err);
        setError(err.response?.data?.message || "Không thể tải bộ ôn tập để chỉnh sửa.");
      } finally {
        setLoading(false);
      }
    };

    fetchPracticeToEdit();
  }, [practiceId]);

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        type: "multiple_choice",
        content: "",
        score: 1,
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
      alert("Bộ ôn tập phải có ít nhất 1 câu hỏi.");
      return;
    }
    setQuestions((prev) => prev.filter((_, idx) => idx !== qIndex));
  };

  const handleQuestionTypeChange = (qIndex: number, newType: QuestionInput["type"]) => {
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
    updated[qIndex].score = Number.isNaN(value) ? 0 : value;
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
      updated[qIndex].options = updated[qIndex].options.map((opt, idx) => ({
        ...opt,
        isCorrect: idx === oIndex,
      }));
    }
    setQuestions(updated);
  };

  const handleSavePractice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Tiêu đề bộ ôn tập không được để trống.");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.content.trim()) {
        setError(`Câu hỏi số ${i + 1} chưa có nội dung.`);
        return;
      }

      if (q.type === "multiple_choice") {
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].content.trim()) {
            setError(`Câu ${i + 1} có phương án ${j + 1} bị trống.`);
            return;
          }
        }
      }

      if (q.type === "fill_blank" && !q.options[0].content.trim()) {
        setError(`Câu ${i + 1} chưa nhập đáp án điền đúng.`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        title,
        description,
        courseId: courseId || null,
        questions,
      };

      const response = isEditMode
        ? await api.put(`/practice/${practiceId}`, payload)
        : await api.post("/practice", payload);

      if (!isEditMode && isStandalone && response.data.accessCode) {
        alert(`Đã tạo bộ ôn tập tự do. Mã ôn tập: ${response.data.accessCode}`);
      } else if (isEditMode) {
        alert("Đã cập nhật bộ ôn tập thành công.");
      }

      navigate(courseId ? `/courses/${courseId}` : "/");
    } catch (err: any) {
      console.error("Failed to save practice set:", err);
      setError(err.response?.data?.message || "Không thể lưu bộ ôn tập.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24">
        <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Đang tải bộ ôn tập...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 animate-fade-in">
      <Link
        to={courseId ? `/courses/${courseId}` : "/"}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </Link>

      <div className="flex flex-col gap-2 mb-8 border-b border-dark-700/60 pb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-brand-400" />
          {isEditMode
            ? "Chỉnh sửa bộ ôn tập"
            : isStandalone
              ? "Tạo bộ ôn tập tự do (theo mã)"
              : "Tạo bộ ôn tập cho môn học"}
        </h1>
        <p className="text-slate-400 text-sm">
          Học viên có thể chọn ôn toàn bộ câu hỏi hoặc nhập số câu muốn ôn ở mỗi phiên học.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-red-300 text-xs flex gap-2.5">
          <ShieldAlert className="w-4.5 h-4.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSavePractice} className="flex flex-col gap-8">
        <div className="glass-card p-6 flex flex-col gap-5">
          <h3 className="text-lg font-bold text-white mb-2">1. Thông tin chung</h3>

          {isStandalone && !isEditMode && (
            <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs">
              Mã ôn tập 4 số sẽ được tạo tự động sau khi lưu.
            </div>
          )}

          {isStandalone && isEditMode && existingAccessCode && (
            <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs">
              Mã ôn tập hiện tại: <span className="font-bold tracking-[0.2em]">{existingAccessCode}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tiêu đề bộ ôn tập
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Ôn tập Chương 1"
              className="glass-input text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Mô tả
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về nội dung ôn tập"
              className="glass-input text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-brand-400" /> Danh sách câu hỏi ({questions.length})
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
              <div className="flex justify-between items-start gap-4">
                <span className="font-extrabold text-sm text-brand-400 bg-brand-500/10 px-3 py-1 rounded-lg">
                  Câu hỏi {qIndex + 1}
                </span>

                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(qIndex)}
                  className="p-1.5 rounded-lg bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-900/20 transition-all cursor-pointer"
                  title="Xóa câu hỏi"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-3 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loại câu hỏi</label>
                  <select
                    value={question.type}
                    onChange={(e) => handleQuestionTypeChange(qIndex, e.target.value as QuestionInput["type"])}
                    className="w-full bg-dark-950/80 border border-dark-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="multiple_choice">Trắc nghiệm (4 đáp án)</option>
                    <option value="true_false">Đúng / Sai</option>
                    <option value="fill_blank">Điền từ</option>
                  </select>
                </div>

                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Điểm</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={question.score}
                    onChange={(e) => handleQuestionScoreChange(qIndex, parseFloat(e.target.value))}
                    className="w-full bg-dark-950/80 border border-dark-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-7 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nội dung câu hỏi</label>
                  <input
                    type="text"
                    required
                    value={question.content}
                    onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                    className="w-full bg-dark-950/80 border border-dark-700 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="bg-dark-900/40 p-4 rounded-xl border border-dark-700/40 flex flex-col gap-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
                  {question.type === "fill_blank" ? "Đáp án đúng" : "Các phương án"}
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
                  <input
                    type="text"
                    required
                    value={question.options[0].content}
                    onChange={(e) => handleOptionTextChange(qIndex, 0, e.target.value)}
                    className="w-full bg-dark-950/70 border border-dark-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Link to={courseId ? `/courses/${courseId}` : "/"} className="btn-secondary text-sm">
            Hủy
          </Link>
          <button type="submit" disabled={saving} className="btn-primary text-sm cursor-pointer">
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4.5 h-4.5" /> {isEditMode ? "Cập nhật bộ ôn tập" : "Lưu bộ ôn tập"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePractice;
