import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Users, Plus, Pencil, Trash2, Lock, Unlock, Search, Loader2, ShieldAlert } from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  status: "ACTIVE" | "LOCKED";
  createdAt: string;
}

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal states
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get("/users");
      setStudents(response.data);
    } catch (err) {
      console.error("Failed to load students:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "ADMIN") {
      fetchStudents();
    }
  }, [currentUser]);

  const handleOpenModal = (student: Student | null = null) => {
    setError(null);
    if (student) {
      setSelectedStudent(student);
      setName(student.name);
      setEmail(student.email);
      setPassword(""); // Leave blank if no password update intended
    } else {
      setSelectedStudent(null);
      setName("");
      setEmail("");
      setPassword("");
    }
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setSelectedStudent(null);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setSaving(true);
    setError(null);
    try {
      if (selectedStudent) {
        // Edit student
        const body: any = { name, email };
        if (password) body.password = password;
        await api.put(`/users/${selectedStudent.id}`, body);
      } else {
        // Create student
        if (!password) {
          setError("Mật khẩu là bắt buộc khi thêm học viên mới.");
          setSaving(false);
          return;
        }
        await api.post("/users", { name, email, password });
      }
      fetchStudents();
      handleCloseModal();
    } catch (err: any) {
      console.error("Failed to save student:", err);
      setError(err.response?.data?.message || "Đã xảy ra lỗi khi lưu thông tin học viên.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLock = async (studentId: string, currentStatus: string) => {
    const action = currentStatus === "ACTIVE" ? "khóa" : "mở khóa";
    if (window.confirm(`Bạn có chắc chắn muốn ${action} tài khoản học viên này?`)) {
      try {
        await api.patch(`/users/${studentId}/toggle-lock`);
        fetchStudents();
      } catch (err) {
        console.error("Failed to toggle lock status:", err);
        alert("Thao tác thay đổi trạng thái thất bại.");
      }
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa vĩnh viễn học viên "${studentName}"? Tất cả kết quả bài thi của học viên cũng sẽ bị xóa.`)) {
      try {
        await api.delete(`/users/${studentId}`);
        fetchStudents();
      } catch (err) {
        console.error("Failed to delete student:", err);
        alert("Xóa học viên thất bại.");
      }
    }
  };

  // Filter students based on search query
  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="max-w-md mx-auto mt-16 p-8 text-center glass-card">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Quyền truy cập bị từ chối</h2>
        <p className="text-slate-400 text-sm">Chỉ có Quản trị viên mới được truy cập trang này.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8 text-brand-500" /> Quản lý học viên
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Thêm học viên mới, khóa tài khoản, hoặc cập nhật thông tin học tập của các học viên.
          </p>
        </div>

        <button onClick={() => handleOpenModal(null)} className="btn-primary cursor-pointer text-sm">
          <Plus className="w-4 h-4" /> Thêm học viên
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6 w-full max-w-md">
        <input
          type="text"
          placeholder="Tìm tên hoặc email học viên..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="glass-input pl-11 text-sm"
        />
        <Search className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-24">
          <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4" />
          <p className="text-slate-400 font-medium">Đang tải danh sách học viên...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center p-16 glass-card">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Không tìm thấy học viên nào phù hợp.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dark-900 border-b border-dark-700/60 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4.5">Tên học viên</th>
                  <th className="px-6 py-4.5">Email</th>
                  <th className="px-6 py-4.5">Trạng thái</th>
                  <th className="px-6 py-4.5">Ngày tham gia</th>
                  <th className="px-6 py-4.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/50 text-sm text-slate-350">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-dark-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">{student.name}</td>
                    <td className="px-6 py-4">{student.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wider ${
                          student.status === "ACTIVE"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/15 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {student.status === "ACTIVE" ? "Hoạt động" : "Bị khóa"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(student.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      {/* Lock/Unlock */}
                      <button
                        onClick={() => handleToggleLock(student.id, student.status)}
                        className={`p-2 rounded-xl transition-all cursor-pointer border ${
                          student.status === "ACTIVE"
                            ? "bg-amber-950/20 text-amber-400 border-amber-500/20 hover:bg-amber-900/20"
                            : "bg-emerald-950/20 text-emerald-400 border-emerald-500/20 hover:bg-emerald-900/20"
                        }`}
                        title={student.status === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                      >
                        {student.status === "ACTIVE" ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Unlock className="w-4 h-4" />
                        )}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleOpenModal(student)}
                        className="p-2 rounded-xl bg-dark-700 hover:bg-dark-600 border border-dark-600/30 text-slate-300 transition-colors cursor-pointer"
                        title="Sửa thông tin"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteStudent(student.id, student.name)}
                        className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/40 border border-red-900/25 text-red-400 transition-colors cursor-pointer"
                        title="Xóa tài khoản"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Form Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6 animate-slide-up">
            <h3 className="text-xl font-bold text-white mb-6">
              {selectedStudent ? "Sửa thông tin học viên" : "Thêm học viên mới"}
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/30 border border-red-500/30 text-red-400 text-xs flex gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveStudent} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Địa chỉ Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="email@lms.com..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {selectedStudent ? "Mật khẩu mới (Bỏ trống nếu giữ nguyên)" : "Mật khẩu ban đầu"}
                </label>
                <input
                  type="password"
                  required={!selectedStudent}
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary text-xs cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim() || !email.trim()}
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

export default UserManagement;
