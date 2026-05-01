import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@theograder.com' },
    update: {},
    create: {
      email: 'admin@theograder.com',
      name: 'System Administrator',
      password: adminPassword,
      role: 'ADMIN',
      avatar: 'https://ui-avatars.com/api/?name=Admin&background=6366f1&color=fff',
    },
  });

  // Create lecturer user
  const lecturerPassword = await bcrypt.hash('lecturer123', 12);
  const lecturerUser = await prisma.user.upsert({
    where: { email: 'lecturer@theograder.com' },
    update: {},
    create: {
      email: 'lecturer@theograder.com',
      name: 'Dr. Sarah Johnson',
      password: lecturerPassword,
      role: 'LECTURER',
      avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=10b981&color=fff',
    },
  });

  console.log('✅ Users created:', { admin: adminUser.email, lecturer: lecturerUser.email });

  // Create sample exam
  const sampleExam = await prisma.exam.create({
    data: {
      title: 'Introduction to Computer Science - Midterm Exam',
      description: 'Midterm examination covering fundamental concepts in computer science',
      courseCode: 'CS101',
      courseName: 'Introduction to Computer Science',
      totalMarks: 100,
      duration: 120, // 2 hours
      examDate: new Date('2024-06-15T09:00:00Z'),
      status: 'ACTIVE',
      createdById: lecturerUser.id,
    },
  });

  console.log('✅ Sample exam created:', sampleExam.title);

  // Create sample rubric
  const sampleRubric = await prisma.rubric.create({
    data: {
      title: 'CS101 Midterm Rubric',
      description: 'Comprehensive rubric for midterm evaluation',
      totalMarks: 100,
      isTemplate: false,
      createdById: lecturerUser.id,
      examId: sampleExam.id,
      questions: {
        create: [
          {
            questionId: 'Q1',
            question: 'Explain the concept of algorithm complexity and provide examples.',
            maxScore: 25,
            points: {
              create: [
                {
                  point: 'Correct definition of algorithm complexity',
                  weight: 1.0,
                  maxScore: 8,
                },
                {
                  point: 'Explanation of time complexity with examples',
                  weight: 1.0,
                  maxScore: 8,
                },
                {
                  point: 'Explanation of space complexity with examples',
                  weight: 1.0,
                  maxScore: 9,
                },
              ],
            },
          },
          {
            questionId: 'Q2',
            question: 'Compare and contrast arrays and linked lists as data structures.',
            maxScore: 25,
            points: {
              create: [
                {
                  point: 'Correct definition of arrays',
                  weight: 1.0,
                  maxScore: 6,
                },
                {
                  point: 'Correct definition of linked lists',
                  weight: 1.0,
                  maxScore: 6,
                },
                {
                  point: 'Comparison of memory allocation',
                  weight: 1.0,
                  maxScore: 7,
                },
                {
                  point: 'Comparison of access time and operations',
                  weight: 1.0,
                  maxScore: 6,
                },
              ],
            },
          },
          {
            questionId: 'Q3',
            question: 'Write a recursive function to calculate factorial and explain its working.',
            maxScore: 25,
            points: {
              create: [
                {
                  point: 'Correct recursive function implementation',
                  weight: 1.0,
                  maxScore: 10,
                },
                {
                  point: 'Explanation of base case',
                  weight: 1.0,
                  maxScore: 5,
                },
                {
                  point: 'Explanation of recursive case',
                  weight: 1.0,
                  maxScore: 5,
                },
                {
                  point: 'Example of function execution',
                  weight: 1.0,
                  maxScore: 5,
                },
              ],
            },
          },
          {
            questionId: 'Q4',
            question: 'Discuss the importance of data structures in software development.',
            maxScore: 25,
            points: {
              create: [
                {
                  point: 'General importance of data structures',
                  weight: 1.0,
                  maxScore: 8,
                },
                {
                  point: 'Impact on algorithm efficiency',
                  weight: 1.0,
                  maxScore: 8,
                },
                {
                  point: 'Real-world applications',
                  weight: 1.0,
                  maxScore: 9,
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('✅ Sample rubric created:', sampleRubric.title);

  // Create system settings
  const settings = [
    {
      key: 'ai_service_url',
      value: 'http://localhost:8000',
      description: 'AI service endpoint URL',
    },
    {
      key: 'max_file_size',
      value: 10485760, // 10MB in bytes
      description: 'Maximum file upload size in bytes',
    },
    {
      key: 'allowed_file_types',
      value: ['pdf', 'jpg', 'jpeg', 'png'],
      description: 'Allowed file types for script uploads',
    },
    {
      key: 'confidence_threshold',
      value: 0.7,
      description: 'Minimum confidence threshold for automatic grading',
    },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log('✅ System settings created');

  // Create sample activity logs
  await prisma.activityLog.createMany({
    data: [
      {
        userId: lecturerUser.id,
        action: 'CREATE_EXAM',
        resource: 'Exam',
        resourceId: sampleExam.id,
        metadata: {
          examTitle: sampleExam.title,
        },
      },
      {
        userId: lecturerUser.id,
        action: 'CREATE_RUBRIC',
        resource: 'Rubric',
        resourceId: sampleRubric.id,
        metadata: {
          rubricTitle: sampleRubric.title,
        },
      },
    ],
  });

  console.log('✅ Activity logs created');

  console.log('🎉 Database seeding completed successfully!');
  console.log('');
  console.log('📧 Login credentials:');
  console.log('   Admin: admin@theograder.com / admin123');
  console.log('   Lecturer: lecturer@theograder.com / lecturer123');
  console.log('');
  console.log('📊 Sample data created:');
  console.log(`   - 2 users`);
  console.log(`   - 1 exam (${sampleExam.title})`);
  console.log(`   - 1 rubric with 4 questions`);
  console.log(`   - System settings and activity logs`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
