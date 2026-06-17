import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Award, Calendar, Search, Loader2, ArrowRight } from "lucide-react";

interface Submission {
  id: string;
  score: number;
  submittedAt: string;
  user?: {
    name: string;
    email: string;
  };
  exam: {
    title: string;
    course: { title: string };
  };
}

const ResultsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<Submission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchParams] = useSearchParams();

  // Optionally filter results by examId if passed in query string (from course details redirect)
  const examFilterId = searchParams.get("examId");

  const fetchResults = async () => {
    setLoading(true);
    try {
      if (user?.role === "ADMIN") {
        const response = await api.get("/results");
        setResults(response.data);
      } else {
        const response = await api.get("/results/me");
        setResults(response.data);
      }
    } catch (err) {
      console.error("Failed to load results:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchResults();
    }
  }, [user]);

  // Apply filters: Search query (Candidate name, email, exam title) + Optional Exam ID filter
  const filteredResults = results.filter((res) => {
    const matchesSearch =
      res.exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user?.role === "ADMIN" &&
        (res.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          res.user?.email.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesExamFilter = examFilterId ? (res as any).examId === examFilterId : true;

    return matchesSearch && matchesExamFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8 border-b border-dark-700/60 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Award className="w-8 h-8 text-amber-500" />{" "}
            {user?.role === "ADMIN" ? "Bảng điểm tổng hợp" : "Lịch sử thi của tôi"}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {user?.role === "ADMIN"
              ? "Xem danh sách kết quả làm bài của tất cả học viên trong hệ thống."
              : "Theo dõi kết quả, điểm số và xem lại chi tiết bài làm của bạn."}
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="relative mb-6 w-full max-w-md">
        <input
          type="text"
          placeholder={
            user?.role === "ADMIN"
              ? "Tìm học viên, email hoặc đề thi..."
              : "Tìm kiếm tên bài kiểm tra..."
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="glass-input pl-11 text-sm"
        />
        <Search className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-24">
          <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4" />
          <p className="text-slate-400 font-medium">Đang tải kết quả thi...</p>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="text-center p-16 glass-card">
          <Award className="w-12 h-12 text-slate-655 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Chưa ghi nhận kết quả thi nào phù hợp.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dark-900 border-b border-dark-700/60 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4.5">Khóa học / Đề thi</th>
                  {user?.role === "ADMIN" && (
                    <>
                      <th className="px-6 py-4.5">Học viên</th>
                      <th className="px-6 py-4.5">Email</th>
                    </>
                  )}
                  <th className="px-6 py-4.5">Điểm số</th>
                  <th className="px-6 py-4.5">Kết quả</th>
                  <th className="px-6 py-4.5">Ngày nộp</th>
                  <th className="px-6 py-4.5 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/50 text-sm text-slate-350">
                {filteredResults.map((res) => {
                  const isPass = res.score >= 5.0;
                  return (
                    <tr key={res.id} className="hover:bg-dark-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{res.exam.title}</div>
                        <div className="text-[10px] text-slate-455 font-medium mt-0.5">
                          {res.exam.course.title}
                        </div>
                      </td>
                      {user?.role === "ADMIN" && (
                        <>
                          <td className="px-6 py-4 font-medium text-slate-200">{res.user?.name}</td>
                          <td className="px-6 py-4 text-xs">{res.user?.email}</td>
                        </>
                      )}
                      <td className="px-6 py-4 font-bold text-white text-base">{res.score}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border ${
                            isPass
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/15 text-red-400 border-red-500/20"
                          }`}
                        >
                          {isPass ? "ĐẠT" : "KHÔNG ĐẠT"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs flex items-center gap-1.5 mt-2.5 border-none">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(res.submittedAt).toLocaleDateString("vi-VN")}{" "}
                        {new Date(res.submittedAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/results/${res.id}`}
                          className="inline-flex p-2 bg-dark-700 hover:bg-dark-600 border border-dark-600/30 hover:border-brand-500/20 text-brand-400 hover:text-brand-300 rounded-xl transition-all cursor-pointer"
                          title="Xem chi tiết bài thi"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsDashboard;
