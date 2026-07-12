export interface QuizQuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  points: number;
  options: QuizQuestionOption[];
}

export interface QuizWithQuestions {
  id: string;
  title: string;
  courseId: string;
  totalQuestions: number;
  timeLimitMinutes: number;
  status: string;
  score?: string;
  securityLevel?: string;
  questions?: QuizQuestion[];
}

export interface QuizSubmissionResult {
  score: number;
  totalPoints: number;
  correctAnswers: number;
  accuracy: number;
  answers: Record<string, string>;
}

export function calculateQuizResult(
  quiz: QuizWithQuestions,
  answers: Record<string, string>
): QuizSubmissionResult {
  const questions = quiz.questions ?? [];
  const totalPoints = questions.reduce((sum, question) => sum + (Number(question.points) || 0), 0);

  let score = 0;
  let correctAnswers = 0;

  questions.forEach((question) => {
    const selectedOptionId = answers[question.id];
    const correctOption = question.options.find((option) => option.isCorrect);

    if (selectedOptionId && correctOption && selectedOptionId === correctOption.id) {
      score += Number(question.points) || 0;
      correctAnswers += 1;
    }
  });

  return {
    score,
    totalPoints,
    correctAnswers,
    accuracy: totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0,
    answers
  };
}
