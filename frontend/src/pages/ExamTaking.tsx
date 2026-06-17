import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { ArrowLeft, Clock, Award, ShieldAlert, CheckCircle, Loader2 } from "lucide-react";

interface Option {
  id: string;
  content: string;
}

interface Question {
  id: string;
  type: "multiple_choice" | "true_false" | "fill_blank";
  content: string;
  score: number;
  options: Option[];
}

interface Exam {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  courseId: string;
  questions: Question[];
  course: {
    title: string;
  };
}

const ExamTaking: React.FC = () => {
  const { id: examId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0); // Time in seconds
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  const timerRef = useRef<any>(null);
  const answersRef = useRef(answers);

  // Keep answers ref updated for auto-submit timer callback
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Load Exam
  useEffect(() => {
    const fetchExam = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/exams/${examId}`);
        setExam(response.data);
      } catch (err) {
        console.error("Failed to load exam:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExam();

    // Clean up timer on unmount
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examId]);

  // Start Exam and countdown timer
  const handleStartExam = () => {
    if (!exam) return;
    setHasStarted(true);
    const durationInSeconds = exam.duration * 60;
    setTimeLeft(durationInSeconds);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSelectAnswer = (questionId: string, value: string) => {
    setAnswers({
      ...answers,
      [questionId]: value,
    });
  };

  const handleAutoSubmit = async () => {
    alert("Hết giờ làm bài! Hệ thống đang tự động nộp bài thi của bạn.");
    submitPayload(answersRef.current);
  };

  const handleSubmitQuiz = async () => {
    if (window.confirm("Bạn có chắc chắn muốn nộp bài thi ngay bây giờ?")) {
      submitPayload(answers);
    }
  };

  const submitPayload = async (payloadAnswers: { [questionId: string]: string }) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const response = await api.post("/results/submit", {
        examId,
        answers: payloadAnswers,
      });

      const { resultId } = response.data;
      navigate(`/results/${resultId}?submitted=true`);
    } catch (err) {
      console.error("Failed to submit exam:", err);
      alert("Đã xảy ra lỗi khi nộp bài thi. Vui lòng liên hệ Admin.");
    } finally {
      setSubmitting(false);
    }
  };

  // Convert seconds left to MM:SS format
  const formatTimeLeft = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24">
        <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Đang chuẩn bị đề thi...</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="max-w-md mx-auto mt-16 p-8 text-center glass-card">
        <Award className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Đề thi không tồn tại</h2>
        <p className="text-slate-400 text-sm">Đề thi này không hợp lệ hoặc đã bị gỡ.</p>
        <Link to="/" className="btn-primary mt-6 mx-auto">
          Quay lại Bảng điều khiển
        </Link>
      </div>
    );
  }

  // Question Navigator helpers
  const totalQuestions = exam.questions.length;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 animate-fade-in">
      {!hasStarted ? (
        /* ==================== SCREEN 1: QUIZ SUMMARY / START INSTRUCTIONS ==================== */
        <div className="max-w-2xl mx-auto glass-card p-8">
          <Link
            to={`/courses/${exam.courseId}`}
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Hủy bỏ, quay lại khóa học
          </Link>

          <div className="flex items-center gap-3 text-amber-500 text-xs font-bold uppercase tracking-wider mb-2.5">
            <Award className="w-5.5 h-5.5 animate-pulse" /> Sẵn sàng bắt đầu bài thi
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-4">{exam.title}</h1>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            {exam.description || "Bài thi trắc nghiệm lý thuyết tổng hợp kiểm tra năng lực cuối bài học."}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-dark-900 border border-dark-700/60 flex items-center gap-3.5">
              <Clock className="w-6 h-6 text-brand-400" />
              <div>
                <div className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Thời gian thi</div>
                <div className="text-sm font-bold text-white">{exam.duration} phút</div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-dark-900 border border-dark-700/60 flex items-center gap-3.5">
              <Award className="w-6 h-6 text-brand-400" />
              <div>
                <div className="text-xs font-semibold text-slate-455 uppercase tracking-wider">Tổng số câu</div>
                <div className="text-sm font-bold text-white">{exam.questions.length} câu hỏi</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 text-amber-300 text-xs leading-relaxed mb-8 flex gap-2.5">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <div>
              <span className="font-bold">Lưu ý trước khi thi: </span>
              Khi bấm nút "Bắt đầu làm bài", đồng hồ đếm ngược sẽ bắt đầu chạy ngay lập tức. Hãy đảm bảo bạn có đường truyền mạng ổn định. Bạn không thể dừng hoặc tải lại trang khi đang làm bài.
            </div>
          </div>

          <button onClick={handleStartExam} className="w-full btn-primary cursor-pointer text-sm">
            Bắt đầu làm bài thi
          </button>
        </div>
      ) : (
        /* ==================== SCREEN 2: ACTIVE QUIZ SHEET ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Panel: Question Sheet (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {exam.questions.map((question, index) => {
              const studentChoice = answers[question.id] || "";
              return (
                <div
                  key={question.id}
                  id={`q-${question.id}`}
                  className={`glass-card p-6 border-l-4 transition-all ${
                    studentChoice ? "border-l-brand-500" : "border-l-dark-600"
                  }`}
                >
                  {/* Prompt */}
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <span className="text-xs font-extrabold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded">
                      Câu hỏi {index + 1} ({question.score}đ)
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base leading-relaxed mb-6">
                    {question.content}
                  </h3>

                  {/* Rendering inputs depending on type */}
                  {question.type === "multiple_choice" && (
                    <div className="flex flex-col gap-3">
                      {question.options.map((opt) => {
                        const isChecked = studentChoice === opt.id;
                        return (
                          <label
                            key={opt.id}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs sm:text-sm font-medium cursor-pointer transition-all ${
                              isChecked
                                ? "bg-brand-500/10 border-brand-500/40 text-white"
                                : "bg-dark-900 border-dark-700/60 text-slate-300 hover:bg-dark-850"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              checked={isChecked}
                              onChange={() => handleSelectAnswer(question.id, opt.id)}
                              className="w-4 h-4 text-brand-500 border-dark-700 focus:ring-brand-500"
                            />
                            <span>{opt.content}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {question.type === "true_false" && (
                    <div className="grid grid-cols-2 gap-4">
                      {question.options.map((opt) => {
                        const isSelected = studentChoice === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSelectAnswer(question.id, opt.id)}
                            className={`p-3.5 rounded-xl border font-bold text-xs sm:text-sm cursor-pointer transition-all ${
                              isSelected
                                ? "bg-brand-500/10 border-brand-500/40 text-brand-350"
                                : "bg-dark-900 border-dark-700/60 text-slate-400 hover:bg-dark-850"
                            }`}
                          >
                            {opt.content}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {question.type === "fill_blank" && (
                    <input
                      type="text"
                      placeholder="Nhập câu trả lời của bạn vào đây..."
                      value={studentChoice}
                      onChange={(e) => handleSelectAnswer(question.id, e.target.value)}
                      className="glass-input text-xs sm:text-sm"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Panel: Sticky Timer, Stats and Navigation Index (4 cols) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 flex flex-col gap-6">
            {/* Timer card */}
            <div className="glass-card p-6 flex flex-col items-center">
              <div className="flex items-center gap-2 text-slate-400 font-semibold text-xs uppercase tracking-wider mb-2">
                <Clock className="w-4 h-4" /> Thời gian còn lại
              </div>
              <div
                className={`text-3xl font-black tracking-widest font-mono ${
                  timeLeft < 60 ? "text-red-500 animate-pulse" : "text-white"
                }`}
              >
                {formatTimeLeft(timeLeft)}
              </div>

              {/* Progress bar */}
              <div className="w-full bg-dark-900 h-1.5 rounded-full overflow-hidden mt-4">
                <div
                  className="bg-brand-500 h-full transition-all duration-1000"
                  style={{
                    width: `${(timeLeft / (exam.duration * 60)) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Questions navigation grid card */}
            <div className="glass-card p-6">
              <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest mb-4">
                Tiến độ làm bài ({answeredCount} / {totalQuestions})
              </h4>
              <div className="grid grid-cols-5 gap-2.5 mb-6">
                {exam.questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  return (
                    <a
                      key={q.id}
                      href={`#q-${q.id}`}
                      className={`h-9 rounded-lg flex items-center justify-center font-bold text-xs border transition-all ${
                        isAnswered
                          ? "bg-brand-600/20 text-brand-300 border-brand-500/40"
                          : "bg-dark-900 text-slate-450 border-dark-700/60"
                      }`}
                    >
                      Q{idx + 1}
                    </a>
                  );
                })}
              </div>

              <button
                onClick={handleSubmitQuiz}
                disabled={submitting}
                className="w-full btn-primary text-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang nộp bài...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4.5 h-4.5" /> Nộp bài thi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamTaking;
