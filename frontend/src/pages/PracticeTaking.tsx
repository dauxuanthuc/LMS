import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Sparkles } from "lucide-react";

type CheckMode = "immediate" | "submit";

interface PracticeOption {
  id: string;
  content: string;
}

interface PracticeQuestion {
  id: string;
  type: "multiple_choice" | "true_false" | "fill_blank";
  content: string;
  imageUrl?: string | null;
  score: number;
  options: PracticeOption[];
}

interface PracticeSetDetail {
  id: string;
  title: string;
  description: string | null;
  accessCode: string | null;
  course: { id: string; title: string } | null;
  questions: PracticeQuestion[];
}

interface Feedback {
  isCorrect: boolean;
  correctAnswers: string[];
}

const PracticeTaking: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [practice, setPractice] = useState<PracticeSetDetail | null>(null);

  const [hasStarted, setHasStarted] = useState(false);
  const [questionMode, setQuestionMode] = useState<"all" | "custom">("all");
  const [customCount, setCustomCount] = useState<number>(10);
  const [checkMode, setCheckMode] = useState<CheckMode>("submit");

  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedbackMap, setFeedbackMap] = useState<Record<string, Feedback>>({});

  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<null | { score: number; earnedPoints: number; totalPoints: number }>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPractice = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await api.get(`/practice/${id}`);
        setPractice(response.data);
        setCustomCount(Math.min(10, response.data.questions.length || 10));
      } catch (err: any) {
        console.error("Failed to load practice set:", err);
        setError(err.response?.data?.message || "Không thể tải bộ ôn tập.");
      } finally {
        setLoading(false);
      }
    };

    fetchPractice();
  }, [id]);

  const selectedQuestionIds = useMemo(() => questions.map((q) => q.id), [questions]);

  const startSession = async () => {
    if (!id || !practice) return;

    try {
      setError(null);
      const payload: { questionCount?: number } = {};

      if (questionMode === "custom") {
        if (!customCount || customCount <= 0) {
          setError("Số câu ôn phải lớn hơn 0.");
          return;
        }
        payload.questionCount = customCount;
      }

      const response = await api.post(`/practice/${id}/session`, payload);
      setQuestions(response.data.questions || []);
      setHasStarted(true);
      setAnswers({});
      setFeedbackMap({});
      setResult(null);
    } catch (err: any) {
      console.error("Failed to start practice session:", err);
      setError(err.response?.data?.message || "Không thể bắt đầu phiên ôn tập.");
    }
  };

  const handleAnswerChange = async (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));

    if (checkMode !== "immediate" || !id) return;

    try {
      const response = await api.post(`/practice/${id}/grade`, {
        answers: { [questionId]: value },
        questionIds: [questionId],
        saveAttempt: false,
      });

      const detail = response.data.details?.[0];
      if (detail) {
        setFeedbackMap((prev) => ({
          ...prev,
          [questionId]: {
            isCorrect: detail.isCorrect,
            correctAnswers: detail.correctAnswers || [],
          },
        }));
      }
    } catch (err) {
      console.error("Immediate grading failed:", err);
    }
  };

  const submitSession = async () => {
    if (!id) return;

    setGrading(true);
    setError(null);

    try {
      const response = await api.post(`/practice/${id}/grade`, {
        answers,
        questionIds: selectedQuestionIds,
        saveAttempt: true,
      });

      setResult({
        score: response.data.score,
        earnedPoints: response.data.earnedPoints,
        totalPoints: response.data.totalPoints,
      });

      if (checkMode === "submit") {
        const details = response.data.details || [];
        const next: Record<string, Feedback> = {};
        details.forEach((d: any) => {
          next[d.questionId] = {
            isCorrect: d.isCorrect,
            correctAnswers: d.correctAnswers || [],
          };
        });
        setFeedbackMap(next);
      }
    } catch (err: any) {
      console.error("Failed to grade practice:", err);
      setError(err.response?.data?.message || "Không thể chấm kết quả ôn tập.");
    } finally {
      setGrading(false);
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

  if (!practice) {
    return (
      <div className="max-w-xl mx-auto mt-16 p-8 glass-card text-center">
        <h2 className="text-2xl font-bold text-white">Không tìm thấy bộ ôn tập</h2>
        <p className="text-slate-400 mt-2">{error || "Bộ ôn tập có thể đã bị xóa hoặc mã không hợp lệ."}</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">Về trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-in">
      <Link
        to={practice.course ? `/courses/${practice.course.id}` : "/"}
        className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </Link>

      {!hasStarted ? (
        <div className="glass-card p-8 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" /> Ôn tập tự do
            </div>
            <h1 className="text-3xl font-extrabold text-white">{practice.title}</h1>
            <p className="text-slate-400 mt-2">{practice.description || "Bộ đề ôn tập tự do."}</p>
            {practice.accessCode && (
              <p className="text-xs text-brand-300 mt-2">Mã ôn tập: {practice.accessCode}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Số câu muốn ôn</p>
              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-300 flex items-center gap-2">
                  <input
                    type="radio"
                    checked={questionMode === "all"}
                    onChange={() => setQuestionMode("all")}
                  />
                  Ôn tất cả ({practice.questions.length} câu)
                </label>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <label className="text-sm text-slate-300 flex items-center gap-2">
                  <input
                    type="radio"
                    checked={questionMode === "custom"}
                    onChange={() => setQuestionMode("custom")}
                  />
                  Ôn theo số câu
                </label>
                <input
                  type="number"
                  min={1}
                  max={practice.questions.length}
                  value={customCount}
                  onChange={(e) => setCustomCount(parseInt(e.target.value || "0", 10))}
                  className="w-24 glass-input text-sm py-2"
                  disabled={questionMode !== "custom"}
                />
              </div>
            </div>

            <div className="glass-card p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Chế độ chấm</p>
              <div className="flex flex-col gap-2 text-sm text-slate-300">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={checkMode === "immediate"}
                    onChange={() => setCheckMode("immediate")}
                  />
                  Tích đáp án là check đúng/sai ngay
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={checkMode === "submit"}
                    onChange={() => setCheckMode("submit")}
                  />
                  Nộp bài mới check đúng/sai
                </label>
              </div>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button onClick={startSession} className="btn-primary w-full md:w-auto">
            Bắt đầu ôn tập
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Phiên ôn tập: {practice.title}</h2>
              <p className="text-slate-400 text-sm">Đã trả lời {Object.keys(answers).length}/{questions.length} câu</p>
            </div>
            <button onClick={submitSession} disabled={grading} className="btn-primary">
              {grading ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang chấm...</> : "Hoàn tất phiên ôn"}
            </button>
          </div>

          {result && (
            <div className="glass-card p-5 border border-emerald-500/30">
              <div className="text-emerald-400 font-bold">Kết quả phiên ôn: {result.score}/10</div>
              <div className="text-slate-300 text-sm mt-1">Điểm thô: {result.earnedPoints}/{result.totalPoints}</div>
            </div>
          )}

          {questions.map((q, idx) => {
            const feedback = feedbackMap[q.id];
            const answer = answers[q.id] || "";

            return (
              <div key={q.id} className="glass-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-brand-400">Câu {idx + 1}</span>
                  <span className="text-xs text-slate-400">{q.score} điểm</span>
                </div>
                <h3 className="text-white font-semibold mb-4">{q.content}</h3>

                {q.imageUrl && (
                  <img
                    src={q.imageUrl}
                    alt={`practice-question-${idx + 1}`}
                    className="mb-4 max-h-80 w-full object-contain rounded-xl border border-dark-700/60 bg-dark-950/40"
                  />
                )}

                {(q.type === "multiple_choice" || q.type === "true_false") && (
                  <div className="flex flex-col gap-2">
                    {q.options.map((o) => (
                      <label key={o.id} className={`p-3 rounded-xl border cursor-pointer ${answer === o.id ? "border-brand-500" : "border-dark-700"}`}>
                        <input
                          type="radio"
                          name={q.id}
                          className="mr-2"
                          checked={answer === o.id}
                          onChange={() => handleAnswerChange(q.id, o.id)}
                        />
                        {o.content}
                      </label>
                    ))}
                  </div>
                )}

                {q.type === "fill_blank" && (
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    className="glass-input"
                    placeholder="Nhập đáp án của bạn"
                  />
                )}

                {feedback && (
                  <div className={`mt-3 text-sm flex items-start gap-2 ${feedback.isCorrect ? "text-emerald-400" : "text-red-400"}`}>
                    {feedback.isCorrect ? <CheckCircle2 className="w-4 h-4 mt-0.5" /> : <XCircle className="w-4 h-4 mt-0.5" />}
                    <div>
                      {feedback.isCorrect ? "Chính xác" : "Chưa đúng"}
                      {!feedback.isCorrect && feedback.correctAnswers.length > 0 && (
                        <div className="text-xs text-slate-400 mt-1">Đáp án đúng: {feedback.correctAnswers.join(" / ")}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PracticeTaking;
