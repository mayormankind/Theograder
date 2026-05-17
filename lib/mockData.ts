import type {
  Exam,
  Script,
  RubricQuestion,
  GradingResult,
  ActivityItem,
} from "@/types";

export const mockExams: Exam[] = [
  {
    id: "e1",
    title: "Database Systems — Final Examination",
    course: "CSC 401",
    date: "2025-05-15",
    totalScripts: 87,
    graded: 72,
    status: "active",
  },
  {
    id: "e2",
    title: "Software Engineering Principles",
    course: "CSC 312",
    date: "2025-05-10",
    totalScripts: 64,
    graded: 64,
    status: "completed",
  },
  {
    id: "e3",
    title: "Algorithms & Complexity — Mid-Semester",
    course: "CSC 305",
    date: "2025-04-28",
    totalScripts: 91,
    graded: 45,
    status: "active",
  },
  {
    id: "e4",
    title: "Computer Networks — Theory Paper",
    course: "CSC 415",
    date: "2025-06-02",
    totalScripts: 0,
    graded: 0,
    status: "draft",
  },
];

export const mockScripts: Script[] = [
  {
    id: "s1",
    studentId: "STU-2021-0044",
    studentName: "Adaeze Okonkwo",
    examTitle: "Database Systems — Final Examination",
    uploadedAt: "2025-05-16 09:14",
    status: "done",
    score: 68,
    totalMarks: 80,
    confidence: 91,
  },
  {
    id: "s2",
    studentId: "STU-2021-0071",
    studentName: "Emeka Nwosu",
    examTitle: "Database Systems — Final Examination",
    uploadedAt: "2025-05-16 09:22",
    status: "done",
    score: 54,
    totalMarks: 80,
    confidence: 87,
  },
  {
    id: "s3",
    studentId: "STU-2021-0089",
    studentName: "Fatima Al-Hassan",
    examTitle: "Database Systems — Final Examination",
    uploadedAt: "2025-05-16 10:05",
    status: "pending_review",
    score: 41,
    totalMarks: 80,
    confidence: 64,
  },
  {
    id: "s4",
    studentId: "STU-2021-0103",
    studentName: "Kofi Mensah",
    examTitle: "Database Systems — Final Examination",
    uploadedAt: "2025-05-16 10:33",
    status: "processing",
    totalMarks: 80,
  },
  {
    id: "s5",
    studentId: "STU-2021-0117",
    studentName: "Priya Nair",
    examTitle: "Database Systems — Final Examination",
    uploadedAt: "2025-05-16 11:01",
    status: "uploaded",
    totalMarks: 80,
  },
  {
    id: "s6",
    studentId: "STU-2021-0058",
    studentName: "Chukwuemeka Obi",
    examTitle: "Software Engineering Principles",
    uploadedAt: "2025-05-11 08:45",
    status: "done",
    score: 72,
    totalMarks: 80,
    confidence: 94,
  },
  {
    id: "s7",
    studentId: "STU-2021-0029",
    studentName: "Aisha Bello",
    examTitle: "Algorithms & Complexity — Mid-Semester",
    uploadedAt: "2025-04-29 14:22",
    status: "pending_review",
    score: 38,
    totalMarks: 60,
    confidence: 58,
  },
];

export const mockRubric: RubricQuestion[] = [
  {
    id: "q1",
    questionNumber: "Q1",
    questionText:
      "Explain the ACID properties of database transactions and provide an example of each.",
    totalMarks: 20,
    parts: [
      {
        id: "q1a",
        label: "a",
        expectedAnswer:
          "Atomicity ensures that all operations in a transaction are completed successfully or none are applied. Example: A bank transfer debiting one account and crediting another must both succeed or both fail.",
        keyPoints: [
          "all-or-nothing",
          "commit",
          "rollback",
          "bank transfer example",
        ],
        marks: 5,
      },
      {
        id: "q1b",
        label: "b",
        expectedAnswer:
          "Consistency ensures the database moves from one valid state to another, maintaining all predefined rules and constraints.",
        keyPoints: [
          "integrity constraints",
          "valid state",
          "rules",
          "referential integrity",
        ],
        marks: 5,
      },
      {
        id: "q1c",
        label: "c",
        expectedAnswer:
          "Isolation ensures concurrent transactions execute as if they were serial, preventing dirty reads, non-repeatable reads, and phantom reads.",
        keyPoints: [
          "concurrency",
          "dirty read",
          "non-repeatable read",
          "serializable",
          "isolation levels",
        ],
        marks: 5,
      },
      {
        id: "q1d",
        label: "d",
        expectedAnswer:
          "Durability guarantees that once a transaction is committed, it remains so even in the event of system failure, using logs and checkpoints.",
        keyPoints: [
          "committed",
          "system failure",
          "write-ahead log",
          "checkpoints",
          "persistence",
        ],
        marks: 5,
      },
    ],
  },
  {
    id: "q2",
    questionNumber: "Q2",
    questionText:
      "Compare and contrast the relational model with the NoSQL document model.",
    totalMarks: 20,
    parts: [
      {
        id: "q2a",
        label: "a",
        expectedAnswer:
          "The relational model organizes data into tables with fixed schemas. Relationships are expressed through foreign keys and joins.",
        keyPoints: ["tables", "fixed schema", "foreign keys", "joins", "SQL"],
        marks: 8,
      },
      {
        id: "q2b",
        label: "b",
        expectedAnswer:
          "Document databases store data as flexible, self-describing JSON/BSON documents. They offer schema flexibility, horizontal scaling, and are suited to hierarchical data.",
        keyPoints: [
          "JSON",
          "BSON",
          "schema-less",
          "horizontal scaling",
          "nested documents",
          "MongoDB",
        ],
        marks: 8,
      },
      {
        id: "q2c",
        label: "c",
        expectedAnswer:
          "Key trade-offs include: relational systems provide stronger consistency and complex query support; document stores offer greater flexibility and scalability for large unstructured datasets.",
        keyPoints: [
          "consistency",
          "scalability",
          "trade-offs",
          "use cases",
          "CAP theorem",
        ],
        marks: 4,
      },
    ],
  },
];

export const mockGradingResults: GradingResult[] = [
  {
    questionId: "q1",
    questionNumber: "Q1",
    partLabel: "a",
    studentAnswer:
      "Atomicity means that a transaction is treated as a single unit. Either all operations succeed or none of them are applied to the database. For example, if a bank transfer fails midway, the debit is rolled back.",
    expectedAnswer:
      "Atomicity ensures that all operations in a transaction are completed successfully or none are applied. Example: A bank transfer debiting one account and crediting another must both succeed or both fail.",
    score: 4,
    maxScore: 5,
    similarityScore: 88,
    confidence: 92,
    matchedConcepts: ["all-or-nothing", "rollback", "bank transfer example"],
    partialConcepts: [],
    missingConcepts: ["commit"],
  },
  {
    questionId: "q1",
    questionNumber: "Q1",
    partLabel: "b",
    studentAnswer:
      "Consistency ensures the database stays valid after a transaction. It must obey all constraints and integrity rules defined in the schema.",
    expectedAnswer:
      "Consistency ensures the database moves from one valid state to another, maintaining all predefined rules and constraints.",
    score: 4,
    maxScore: 5,
    similarityScore: 82,
    confidence: 85,
    matchedConcepts: ["integrity constraints", "valid state", "rules"],
    partialConcepts: [],
    missingConcepts: ["referential integrity"],
  },
  {
    questionId: "q1",
    questionNumber: "Q1",
    partLabel: "c",
    studentAnswer:
      "Isolation means transactions run independently from each other. Multiple transactions happening at once should not interfere.",
    expectedAnswer:
      "Isolation ensures concurrent transactions execute as if they were serial, preventing dirty reads, non-repeatable reads, and phantom reads.",
    score: 3,
    maxScore: 5,
    similarityScore: 67,
    confidence: 71,
    matchedConcepts: ["concurrency"],
    partialConcepts: [],
    missingConcepts: [
      "dirty read",
      "non-repeatable read",
      "serializable",
      "isolation levels",
    ],
  },
  {
    questionId: "q1",
    questionNumber: "Q1",
    partLabel: "d",
    studentAnswer:
      "Durability guarantees that once committed, a transaction is permanently saved. Even if the system crashes, the data is not lost because of logs.",
    expectedAnswer:
      "Durability guarantees that once a transaction is committed, it remains so even in the event of system failure, using logs and checkpoints.",
    score: 5,
    maxScore: 5,
    similarityScore: 94,
    confidence: 96,
    matchedConcepts: [
      "committed",
      "system failure",
      "write-ahead log",
      "persistence",
    ],
    partialConcepts: [],
    missingConcepts: [],
  },
  {
    questionId: "q2",
    questionNumber: "Q2",
    partLabel: "a",
    studentAnswer:
      "Relational databases use tables with rows and columns. They use SQL for querying and foreign keys to link tables together.",
    expectedAnswer:
      "The relational model organizes data into tables with fixed schemas. Relationships are expressed through foreign keys and joins.",
    score: 6,
    maxScore: 8,
    similarityScore: 76,
    confidence: 80,
    matchedConcepts: ["tables", "foreign keys", "SQL"],
    partialConcepts: [],
    missingConcepts: ["fixed schema", "joins"],
  },
  {
    questionId: "q2",
    questionNumber: "Q2",
    partLabel: "b",
    studentAnswer:
      "NoSQL document stores like MongoDB use JSON documents. They are flexible and can scale horizontally across many servers.",
    expectedAnswer:
      "Document databases store data as flexible, self-describing JSON/BSON documents. They offer schema flexibility, horizontal scaling, and are suited to hierarchical data.",
    score: 6,
    maxScore: 8,
    similarityScore: 78,
    confidence: 83,
    matchedConcepts: ["JSON", "horizontal scaling", "MongoDB"],
    partialConcepts: [],
    missingConcepts: ["BSON", "schema-less", "nested documents"],
  },
  {
    questionId: "q2",
    questionNumber: "Q2",
    partLabel: "c",
    studentAnswer:
      "Relational databases are more consistent but harder to scale. NoSQL is more flexible and scalable for big data.",
    expectedAnswer:
      "Key trade-offs include: relational systems provide stronger consistency and complex query support; document stores offer greater flexibility and scalability for large unstructured datasets.",
    score: 3,
    maxScore: 4,
    similarityScore: 71,
    confidence: 74,
    matchedConcepts: ["consistency", "scalability", "trade-offs"],
    partialConcepts: [],
    missingConcepts: ["CAP theorem"],
  },
];

export const mockActivity: ActivityItem[] = [
  {
    id: "a1",
    type: "processed",
    description:
      "Script for Adaeze Okonkwo (STU-2021-0044) processed successfully.",
    timestamp: "2025-05-16 11:42",
    user: "TheoGrader",
  },
  {
    id: "a2",
    type: "upload",
    description:
      "3 new scripts uploaded for Database Systems — Final Examination.",
    timestamp: "2025-05-16 11:01",
    user: "Dr. Amaka Eze",
  },
  {
    id: "a3",
    type: "reviewed",
    description:
      "Score override applied for Fatima Al-Hassan — Q1c revised to 4/5.",
    timestamp: "2025-05-16 10:55",
    user: "Dr. Amaka Eze",
  },
  {
    id: "a4",
    type: "processed",
    description:
      "Batch of 12 scripts completed for Software Engineering Principles.",
    timestamp: "2025-05-15 16:30",
    user: "TheoGrader",
  },
  {
    id: "a5",
    type: "exam_created",
    description:
      "New exam created: Computer Networks — Theory Paper (CSC 415).",
    timestamp: "2025-05-15 14:10",
    user: "Dr. Amaka Eze",
  },
  {
    id: "a6",
    type: "reviewed",
    description:
      "Final results exported for Software Engineering Principles (64 scripts).",
    timestamp: "2025-05-14 09:20",
    user: "Dr. Amaka Eze",
  },
];

export const weeklyProcessingData = [
  { day: "Mon", processed: 14, uploaded: 18 },
  { day: "Tue", processed: 22, uploaded: 26 },
  { day: "Wed", processed: 19, uploaded: 19 },
  { day: "Thu", processed: 31, uploaded: 35 },
  { day: "Fri", processed: 28, uploaded: 28 },
  { day: "Sat", processed: 8, uploaded: 10 },
  { day: "Sun", processed: 5, uploaded: 5 },
];

export const scoreDistributionData = [
  { range: "0–40", count: 8 },
  { range: "41–50", count: 14 },
  { range: "51–60", count: 23 },
  { range: "61–70", count: 21 },
  { range: "71–80", count: 11 },
];
