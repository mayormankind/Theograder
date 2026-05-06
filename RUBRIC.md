# Rubric Format Guide

A rubric is a structured marking scheme that includes questions, expected answers, and key concepts for automated grading. The AI uses semantic similarity to match student answers against the rubric points.

## Structure

```json
{
  "title": "Database Systems - Final Examination",
  "description": "Final exam marking scheme for CSC 401",
  "courseCode": "CSC 401",
  "examType": "Final Examination",
  "questions": [
    {
      "questionNumber": "Q1",
      "questionText": "Explain the concept of database transactions and ACID properties.",
      "maxScore": 20,
      "parts": [
        {
          "label": "a",
          "expectedAnswer": "A transaction is a sequence of operations performed as a single logical unit of work. It ensures that either all operations succeed or none do.",
          "keyPoints": [
            "atomicity",
            "consistency",
            "isolation",
            "durability",
            "logical unit of work",
            "all-or-nothing execution"
          ],
          "marks": 8
        },
        {
          "label": "b",
          "expectedAnswer": "ACID properties ensure reliable processing: Atomicity guarantees all-or-nothing execution, Consistency maintains database validity, Isolation allows concurrent transactions, and Durability makes changes permanent.",
          "keyPoints": [
            "all-or-nothing execution",
            "state preservation",
            "concurrent execution",
            "permanent changes",
            "reliable processing"
          ],
          "marks": 12
        }
      ]
    }
  ],
  "totalMarks": 100
}
```

## Key Components

### Rubric Metadata
- **title**: Name of the exam/rubric
- **description**: Brief description
- **courseCode**: Course identifier (optional)
- **examType**: Type of exam (optional)
- **totalMarks**: Total marks for the exam

### Question
- **questionNumber**: Identifier (e.g., "Q1", "Q2", "1(a)")
- **questionText**: Full question text
- **maxScore**: Maximum marks for this question
- **parts**: Array of sub-parts (if applicable)

### Part
- **label**: Part identifier (e.g., "a", "b", "i")
- **expectedAnswer**: Model answer text
- **keyPoints**: Array of key concepts/phrases the AI should look for
- **marks**: Marks allocated to this part

## Important Notes

1. **Key Points are Critical**: The AI uses semantic similarity to match student answers against the `keyPoints` array. Include all important concepts, terminology, and phrases that should appear in a good answer.

2. **Expected Answer**: Provide a complete, well-written model answer. This serves as a reference and helps the AI understand the context.

3. **Marks Allocation**: Ensure marks sum up correctly across parts and questions.

4. **Parts vs Single Question**: Use `parts` array for questions with sub-parts (a, b, c, etc.). For single-part questions, you can still use a single part with label "a" or omit parts entirely.

## Example: Complete Rubric

```json
{
  "title": "Database Systems - Final Examination",
  "description": "Final exam marking scheme for CSC 401 - Database Systems",
  "courseCode": "CSC 401",
  "examType": "Final Examination",
  "questions": [
    {
      "questionNumber": "Q1",
      "questionText": "Explain the concept of database transactions and ACID properties.",
      "maxScore": 20,
      "parts": [
        {
          "label": "a",
          "expectedAnswer": "A transaction is a sequence of operations performed as a single logical unit of work. It ensures that either all operations succeed or none do.",
          "keyPoints": [
            "atomicity",
            "consistency",
            "isolation",
            "durability",
            "logical unit of work",
            "all-or-nothing execution"
          ],
          "marks": 8
        },
        {
          "label": "b",
          "expectedAnswer": "ACID properties ensure reliable processing: Atomicity guarantees all-or-nothing execution, Consistency maintains database validity, Isolation allows concurrent transactions, and Durability makes changes permanent.",
          "keyPoints": [
            "all-or-nothing execution",
            "state preservation",
            "concurrent execution",
            "permanent changes",
            "reliable processing"
          ],
          "marks": 12
        }
      ]
    },
    {
      "questionNumber": "Q2",
      "questionText": "Design a database schema for a university enrollment system.",
      "maxScore": 30,
      "parts": [
        {
          "label": "a",
          "expectedAnswer": "Entities should include: Students (student_id, name, email), Courses (course_id, title, credits), Instructors (instructor_id, name, department), Departments (dept_id, name), and Enrollments (enrollment_id, student_id, course_id, grade).",
          "keyPoints": [
            "primary keys",
            "foreign keys",
            "relationships",
            "normalization",
            "entity-relationship",
            "referential integrity"
          ],
          "marks": 15
        },
        {
          "label": "b",
          "expectedAnswer": "ER diagram should show: Student-Enrollment (one-to-many), Course-Enrollment (one-to-many), Instructor-Department (many-to-one), and Department-Course (one-to-many) relationships.",
          "keyPoints": [
            "one-to-many",
            "many-to-many",
            "cardinality",
            "attributes",
            "relationships"
          ],
          "marks": 15
        }
      ]
    },
    {
      "questionNumber": "Q3",
      "questionText": "Write an SQL query to find all students who have enrolled in at least 3 courses.",
      "maxScore": 15,
      "parts": [
        {
          "label": "a",
          "expectedAnswer": "SELECT s.student_id, s.name FROM Students s JOIN Enrollments e ON s.student_id = e.student_id GROUP BY s.student_id, s.name HAVING COUNT(e.course_id) >= 3;",
          "keyPoints": [
            "JOIN",
            "GROUP BY",
            "HAVING clause",
            "COUNT aggregate",
            "subquery",
            "aggregation"
          ],
          "marks": 15
        }
      ]
    }
  ],
  "totalMarks": 65
}
```

## How to Use

1. **Upload Document**: Upload your existing marking scheme (PDF, Word, or image) and the AI will automatically extract the rubric structure.

2. **Paste Text**: Copy and paste your marking scheme text and the AI will parse it into the structured format.

3. **Manual Entry**: Build the rubric step-by-step using the form builder.

The AI will use the `keyPoints` to perform semantic similarity matching against student answers, providing confidence scores and detailed breakdowns.
