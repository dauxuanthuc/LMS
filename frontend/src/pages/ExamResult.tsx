import React, { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { ArrowLeft, Award, HelpCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface Question {
  id: string;
  type: string;
  content: string;
  score: number;
  options: {
    id: string;
    content: string;
    isCorrect: boolean;
  }[];
}

interface ResultDetails {
  id: string;
  score: number;
  submittedAt: string;
  answers: {
    questionId: string;
    questionText: string;
    questionType: string;
    score: number;
    studentAnswer: string;
    correctAnswers: string[];
    isCorrect: boolean;
  }[];
  user: {
    name: string;
    email: string;
  };
  exam?: {
    title: string;
    course?: { title: string };
    questions: Question[];
  };
}

const ExamResult: React.FC = () => {
  const { id: resultId } = useParams<{ id: string }>();
  const [result, setResult] = useState<ResultDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchResult = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/results/${resultId}`);
        setResult(response.data);

        // Fire celebration confetti if score is high and we just submitted
        const isNewSubmission = searchParams.get("submitted") === "true";
        if (response.data.score >= 5.0 && isNewSubmission) {
          const { default: confetti } = await import("canvas-confetti");
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#0e91eb", "#7ccafd", "#22c55e", "#f59e0b"],
          });
        }
      } catch (err) {
        console.error("Failed to load result details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [resultId, searchParams]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24">
        <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Đang tải kết quả thi...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="max-w-md mx-auto mt-16 p-8 text-center glass-card">
        <Award className="w-12 h-12 text-slate-655 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Không tìm thấy kết quả</h2>
        <p className="text-slate-455 text-sm">Kết quả thi này có thể không thuộc tài khoản của bạn hoặc đã bị xóa.</p>
        <Link to="/" className="btn-primary mt-6 mx-auto">
          Quay lại Bảng điều khiển
        </Link>
      </div>
    );
  }

  // Calculate quick metrics
  const correctCount = result.answers.filter((a) => a.isCorrect).length;
  const totalQuestions = result.answers.length;
  const isPass = result.score >= 5.0;
  const courseTitle = result.exam?.course?.title || "Khóa học không xác định";
  const examTitle = result.exam?.title || "Bài thi không xác định";
  const examQuestions = result.exam?.questions || [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">
      {/* Navigation and Course titles */}
      <div className="mb-8">
        <Link
          to={`/`}
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Trang chủ
        </Link>
        <div className="flex items-center gap-3 text-brand-400 text-xs font-bold uppercase tracking-wider mb-2">
          <span>Kết quả: {courseTitle}</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
          Báo cáo kết quả: {examTitle}
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Học viên: <span className="font-semibold text-slate-350">{result.user.name}</span> ({result.user.email}) • Ngày thi: {new Date(result.submittedAt).toLocaleString("vi-VN")}
        </p>
      </div>

      {/* Main Score Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Score box */}
        <div className="glass-card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden md:col-span-1 border-b-4 border-b-brand-500">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 blur-2xl pointer-events-none rounded-full" />
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Điểm số đạt được</div>
          <div className="text-5xl font-black text-white tracking-tight leading-none mb-3">
            {result.score} <span className="text-xs font-semibold text-slate-500">/ 10.0</span>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isPass
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {isPass ? "ĐẠT YÊU CẦU" : "KHÔNG ĐẠT"}
          </span>
        </div>

        {/* Answers breakdown info box */}
        <div className="glass-card p-6 md:col-span-2 flex flex-col justify-center gap-4">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-2">Tóm tắt quá trình làm bài</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-dark-900 border border-dark-700/60 rounded-xl">
              <div className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Số câu đúng</div>
              <div className="text-lg font-black text-white mt-1">
                {correctCount} <span className="text-xs font-semibold text-slate-500">/ {totalQuestions} câu</span>
              </div>
            </div>
            <div className="p-3 bg-dark-900 border border-dark-700/60 rounded-xl">
              <div className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Tỷ lệ chính xác</div>
              <div className="text-lg font-black text-white mt-1">
                {totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answer Explanations Breakdown */}
      <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-brand-400" /> Xem lại chi tiết đáp án
      </h2>

      <div className="flex flex-col gap-6">
        {result.answers.map((answer, index) => {
          // Find original options if multiple choice or true false
          const originalQuestion = examQuestions.find((q) => q.id === answer.questionId);
          
          return (
            <div
              key={answer.questionId}
              className={`glass-card p-6 border-l-4 ${
                answer.isCorrect ? "border-l-emerald-500" : "border-l-red-500"
              }`}
            >
              {/* Question badge & status */}
              <div className="flex justify-between items-center gap-4 mb-4">
                <span className="text-xs font-extrabold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded">
                  Câu {index + 1}
                </span>

                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                  {answer.isCorrect ? (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-4.5 h-4.5" /> Đúng (+{answer.score}đ)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-400">
                      <XCircle className="w-4.5 h-4.5" /> Sai (+0đ)
                    </span>
                  )}
                </div>
              </div>

              {/* Prompt */}
              <h3 className="font-bold text-white text-base leading-relaxed mb-6">
                {answer.questionText}
              </h3>

              {/* Rendering options with correct/incorrect highlights for review */}
              {answer.questionType === "multiple_choice" && originalQuestion && (
                <div className="flex flex-col gap-3">
                  {originalQuestion.options.map((opt) => {
                    const isStudentChoice = answer.studentAnswer === opt.id;
                    const isCorrectOption = opt.isCorrect;
                    
                    let bgBorderClass = "bg-dark-900 border-dark-700/60 text-slate-350";
                    if (isCorrectOption) {
                      bgBorderClass = "bg-emerald-950/15 border-emerald-500/40 text-emerald-300 font-semibold";
                    } else if (isStudentChoice && !isCorrectOption) {
                      bgBorderClass = "bg-red-950/15 border-red-500/40 text-red-300";
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 ${bgBorderClass}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            isStudentChoice ? "bg-brand-500" : "bg-transparent"
                          }`} />
                          <span>{opt.content}</span>
                        </div>

                        {/* Badges */}
                        {isCorrectOption && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wide">
                            Đáp án đúng
                          </span>
                        )}
                        {isStudentChoice && !isCorrectOption && (
                          <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 uppercase tracking-wide">
                            Lựa chọn của bạn
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {answer.questionType === "true_false" && originalQuestion && (
                <div className="grid grid-cols-2 gap-4">
                  {originalQuestion.options.map((opt) => {
                    const isStudentChoice = answer.studentAnswer === opt.id;
                    const isCorrectOption = opt.isCorrect;

                    let bgBorderClass = "bg-dark-900 border-dark-700/60 text-slate-450";
                    if (isCorrectOption) {
                      bgBorderClass = "bg-emerald-950/15 border-emerald-500/40 text-emerald-300 font-semibold";
                    } else if (isStudentChoice && !isCorrectOption) {
                      bgBorderClass = "bg-red-950/15 border-red-500/40 text-red-300";
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-xl border text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 ${bgBorderClass}`}
                      >
                        <span>{opt.content}</span>
                        {isCorrectOption && (
                          <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-widest mt-1">
                            Đáp án đúng
                          </span>
                        )}
                        {isStudentChoice && !isCorrectOption && (
                          <span className="text-[9px] font-extrabold text-red-400 uppercase tracking-widest mt-1">
                            Lựa chọn của bạn
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {answer.questionType === "fill_blank" && (
                <div className="flex flex-col gap-3">
                  <div className="p-3.5 bg-dark-900 border border-dark-700/60 rounded-xl text-xs sm:text-sm">
                    <span className="text-slate-455">Câu trả lời của bạn:</span>{" "}
                    <span
                      className={`font-bold ${answer.isCorrect ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {answer.studentAnswer || "(Để trống)"}
                    </span>
                  </div>
                  {!answer.isCorrect && (
                    <div className="p-3.5 bg-emerald-950/10 border border-emerald-500/25 rounded-xl text-xs sm:text-sm text-emerald-300">
                      <span className="font-semibold text-emerald-400">Đáp án chính xác được chấp nhận:</span>{" "}
                      {answer.correctAnswers.join(" hoặc ")}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExamResult;
