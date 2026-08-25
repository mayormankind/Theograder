// TEMP diagnostic — read-only. Safe to delete.
const fs = require("fs");
const path = require("path");

// Manually load .env (dotenv not installed)
const envPath = path.join(__dirname, ".env");
const envRaw = fs.readFileSync(envPath, "utf8");
for (const line of envRaw.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (m) {
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

async function main() {
  const names = ["script01.pdf", "script02.pdf", "script03.pdf", "script04.pdf", "script05.pdf"];
  const scripts = await prisma.script.findMany({
    where: { originalName: { in: names } },
    include: {
      exam: {
        include: {
          rubrics: { include: { questions: { include: { points: true } } } },
        },
      },
      results: {
        orderBy: { gradedAt: "desc" },
        include: { questions: true },
      },
    },
    orderBy: { originalName: "asc" },
  });

  for (const s of scripts) {
    const txt = s.extractedText || "";
    console.log("==================================================");
    console.log(`FILE: ${s.originalName}  (scriptId=${s.id})`);
    console.log(`  status=${s.status}  studentId=${JSON.stringify(s.studentId)}  extractionMethod=${s.extractionMethod}  confidenceFlag=${s.confidenceFlag}`);
    console.log(`  extractedText: length=${txt.length}`);
    console.log(`  extractedText[0..300]= ${JSON.stringify(txt.slice(0, 300))}`);
    const ex = s.exam;
    console.log(`  EXAM: id=${ex.id} title=${JSON.stringify(ex.title)} totalMarks=${ex.totalMarks} selectionStrategy=${ex.selectionStrategy}`);
    console.log(`        examInstructions=${JSON.stringify(ex.examInstructions)} parsedInstruction=${JSON.stringify(ex.parsedInstruction)}`);
    console.log(`        rubrics count=${ex.rubrics.length}`);
    ex.rubrics.forEach((r, i) => {
      console.log(`        rubric[${i}] id=${r.id} title=${JSON.stringify(r.title)} totalMarks=${r.totalMarks} questions=${r.questions.length}`);
      r.questions.forEach((q) => {
        console.log(`            Q questionId=${JSON.stringify(q.questionId)} maxScore=${q.maxScore} points=${q.points.length}`);
      });
    });
    console.log(`  RESULTS count=${s.results.length}`);
    s.results.forEach((res, i) => {
      console.log(`    result[${i}] id=${res.id} totalScore=${res.totalScore} maxScore=${res.maxScore} confidence=${res.confidence} status=${res.status} gradedAt=${res.gradedAt.toISOString()} questionResults=${res.questions.length}`);
      res.questions.forEach((qr) => {
        const ans = qr.answer || "";
        console.log(`        QR questionId=${JSON.stringify(qr.questionId)} score=${qr.score} maxScore=${qr.maxScore} confidence=${qr.confidence} answerLen=${ans.length} counted=${qr.countedInTotal}`);
      });
    });
  }

  // Also show total count of scripts / exams named Computer Networking
  const exams = await prisma.exam.findMany({
    where: { title: { contains: "Networking", mode: "insensitive" } },
    include: { _count: { select: { scripts: true, rubrics: true } }, rubrics: { include: { _count: { select: { questions: true } } } } },
  });
  console.log("\n===== EXAMS matching 'Networking' =====");
  exams.forEach((e) => {
    console.log(`  exam id=${e.id} title=${JSON.stringify(e.title)} totalMarks=${e.totalMarks} scripts=${e._count.scripts} rubrics=${e._count.rubrics}`);
    e.rubrics.forEach((r) => console.log(`     rubric ${r.id} questions=${r._count.questions}`));
  });
}

main()
  .catch((e) => {
    console.error("DIAG ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
