import { PrismaClient, Role, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data (optional, but good for reset)
  await prisma.user.deleteMany({});
  await prisma.course.deleteMany({});

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash("AdminPassword123", 10);
  const studentPasswordHash = await bcrypt.hash("StudentPassword123", 10);

  // Create default admin
  const admin = await prisma.user.create({
    data: {
      name: "System Admin",
      email: "admin@lms.com",
      password: adminPasswordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
  console.log(`Admin user created: ${admin.email}`);

  // Create default student
  const student = await prisma.user.create({
    data: {
      name: "Default Student",
      email: "student@lms.com",
      password: studentPasswordHash,
      role: Role.STUDENT,
      status: UserStatus.ACTIVE,
    },
  });
  console.log(`Student user created: ${student.email}`);

  // Create sample course
  const course = await prisma.course.create({
    data: {
      title: "Lập trình Web nâng cao",
      description: "Khóa học lập trình Web toàn diện từ cơ bản đến nâng cao với NodeJS và ReactJS.",
    },
  });
  console.log(`Sample course created: ${course.title}`);

  // Create sample documents
  const document = await prisma.document.create({
    data: {
      title: "Giáo trình Web Core",
      description: "Tài liệu lý thuyết căn bản về HTTP, DOM, CSSOM.",
      fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      fileSize: 13264, // 13KB
      courseId: course.id,
    },
  });
  console.log(`Sample document created: ${document.title}`);

  // Create sample exam
  const exam = await prisma.exam.create({
    data: {
      title: "Kiểm tra kiến thức Web căn bản",
      description: "Bài kiểm tra nhanh 3 câu hỏi đánh giá kiến thức HTML/JS/CSS.",
      duration: 15, // 15 mins
      courseId: course.id,
      questions: {
        create: [
          {
            type: "multiple_choice",
            content: "Thẻ HTML nào được sử dụng để hiển thị hình ảnh?",
            score: 4.0,
            options: {
              create: [
                { content: "<img>", isCorrect: true },
                { content: "<picture>", isCorrect: false },
                { content: "<image>", isCorrect: false },
                { content: "<src>", isCorrect: false },
              ],
            },
          },
          {
            type: "true_false",
            content: "JavaScript là ngôn ngữ biên dịch (compiled language). Đúng hay Sai?",
            score: 3.0,
            options: {
              create: [
                { content: "Đúng (True)", isCorrect: false },
                { content: "Sai (False)", isCorrect: true },
              ],
            },
          },
          {
            type: "fill_blank",
            content: "Giao thức bảo mật kết hợp giữa HTTP và SSL/TLS được viết tắt là gì?",
            score: 3.0,
            options: {
              create: [
                { content: "HTTPS", isCorrect: true },
                { content: "https", isCorrect: true },
              ],
            },
          },
        ],
      },
    },
  });
  console.log(`Sample exam created: ${exam.title}`);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
