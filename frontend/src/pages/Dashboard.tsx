import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { BookOpen, FileText, Award, Users, Plus, Pencil, Trash2, Loader2, ArrowRight } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  _count?: {
    documents: number;
    exams: number;
  };
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({ coursesCount: 0, usersCount: 0, resultsCount: 0, avgScore: 0 });

  // Modal State
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (user?.role === "ADMIN") {
        const [courseRes, userRes, resultsRes] = await Promise.all([
          api.get("/courses"),
          api.get("/users"),
          api.get("/results"),
        ]);

        setCourses(courseRes.data);
        setStats({
          coursesCount: courseRes.data.length,
          usersCount: userRes.data.length,
          resultsCount: resultsRes.data.length,
          avgScore: 0,
        });
      } else {
        const [courseRes, resultsRes] = await Promise.all([
          api.get("/courses"),
          api.get("/results/me"),
        ]);

        setCourses(courseRes.data);
        const scores = resultsRes.data.map((r: any) => r.score);
        const avg = scores.length > 0 ? (scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1) : 0;
        setStats({
          coursesCount: courseRes.data.length,
          usersCount: 0,
          resultsCount: resultsRes.data.length,
          avgScore: Number(avg),
        });
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleOpenModal = (course: Course | null = null) => {
    if (course) {
      setSelectedCourse(course);
      setTitle(course.title);
      setDescription(course.description || "");
    } else {
      setSelectedCourse(null);
      setTitle("");
      setDescription("");
    }
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setSelectedCourse(null);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      if (selectedCourse) {
        // Edit course
        await api.put(`/courses/${selectedCourse.id}`, { title, description });
      } else {
        // Create course
        await api.post("/courses", { title, description });
      }
      fetchDashboardData();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving course:", error);
      alert("Không thể lưu khóa học. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa khóa học "${courseTitle}"? Thao tác này cũng xóa toàn bộ tài liệu và bài thi liên quan.`)) {
      try {
        await api.delete(`/courses/${courseId}`);
        fetchDashboardData();
      } catch (error) {
        console.error("Failed to delete course:", error);
        alert("Xóa khóa học thất bại.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24">
        <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Đang tải dữ liệu khóa học...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-fade-in">
      {/* Welcome banner */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            <span className="md:hidden block animate-float-slow">Xin chào học viên!</span>
            <span className="hidden md:block">Bảng điều khiển học tập</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed animate-fade-in md:animate-none">
            <span className="md:hidden block animate-float-slow">Bạn đã sẵn sàng học tập chưa?</span>
            <span className="hidden md:block">Quản lý khóa học, kiểm tra tài liệu và thi trực tuyến tiện lợi.</span>
          </p>
        </div>

        {user?.role === "ADMIN" && (
          <button onClick={() => handleOpenModal(null)} className="btn-primary cursor-pointer">
            <Plus className="w-5 h-5" /> Thêm khóa học mới
          </button>
        )}
      </div>

      {/* Metrics Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {/* Metric 1 */}
        <div className="glass-card p-6 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">{stats.coursesCount}</div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Khóa học đang mở
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        {user?.role === "ADMIN" ? (
          <div className="glass-card p-6 flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white">{stats.usersCount}</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                Học viên đăng ký
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card p-6 flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white">{stats.resultsCount}</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                Bài kiểm tra đã nộp
              </div>
            </div>
          </div>
        )}

        {/* Metric 3 */}
        {user?.role === "ADMIN" ? (
          <div className="glass-card p-6 flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white">{stats.resultsCount}</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                Lượt làm bài thi
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card p-6 flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white">
                {stats.avgScore > 0 ? `${stats.avgScore}/10` : "Chưa có"}
              </div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                Điểm thi trung bình
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Courses Section */}
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <span>Danh sách khóa học</span>
        <span className="text-xs font-semibold bg-dark-750 text-slate-400 px-2.5 py-1 rounded-full border border-dark-700">
          {courses.length}
        </span>
      </h2>

      {courses.length === 0 ? (
        <div className="text-center p-16 glass-card">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Chưa có khóa học nào hoạt động.</p>
          {user?.role === "ADMIN" && (
            <button onClick={() => handleOpenModal(null)} className="btn-primary mt-4 mx-auto cursor-pointer">
              Tạo khóa học ngay
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="glass-card hover:bg-dark-800/85 hover:border-brand-500/30 group transition-all duration-300 flex flex-col justify-between"
            >
              {/* Card Details */}
              <div className="p-6">
                <div className="flex justify-between items-start gap-4 mb-3">
                  <h3 className="font-bold text-lg text-white group-hover:text-brand-400 transition-colors line-clamp-1">
                    {course.title}
                  </h3>
                  {user?.role === "ADMIN" && (
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleOpenModal(course);
                        }}
                        className="p-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-slate-300 transition-colors cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteCourse(course.id, course.title);
                        }}
                        className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/40 text-red-400 transition-colors cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed mb-6">
                  {course.description || "Chưa có mô tả chi tiết cho khóa học này."}
                </p>
              </div>

              {/* Card Footer Counts */}
              <div className="px-6 py-4.5 bg-dark-900/60 border-t border-dark-700/50 rounded-b-2xl flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4.5 h-4.5 text-slate-500" />
                    {course._count?.documents || 0} tài liệu
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4.5 h-4.5 text-slate-500" />
                    {course._count?.exams || 0} bài thi
                  </span>
                </div>
                <Link
                  to={`/courses/${course.id}`}
                  className="text-xs font-bold text-brand-400 hover:text-brand-350 flex items-center gap-1 cursor-pointer"
                >
                  Chi tiết <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Course Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-card p-6 animate-slide-up">
            <h3 className="text-xl font-bold text-white mb-6">
              {selectedCourse ? "Chỉnh sửa khóa học" : "Tạo khóa học mới"}
            </h3>

            <form onSubmit={handleSaveCourse} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Tên khóa học
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lập trình Web nâng cao..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="glass-input"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Mô tả khóa học
                </label>
                <textarea
                  placeholder="Nhập mô tả tóm tắt nội dung..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="glass-input"
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary text-xs cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving || !title.trim()}
                  className="btn-primary text-xs cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
                    </>
                  ) : (
                    "Lưu thay đổi"
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

export default Dashboard;
