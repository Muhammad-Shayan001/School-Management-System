import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateQuizResult } from './quizUtils.js';

test('calculates correct points and accuracy for a submitted quiz', () => {
  const quiz = {
    id: 'quiz-1',
    title: 'Sample quiz',
    courseId: 'course-1',
    totalQuestions: 2,
    timeLimitMinutes: 10,
    status: 'PUBLISHED',
    questions: [
      {
        id: 'q1',
        prompt: '2 + 2',
        points: 2,
        options: [
          { id: 'q1-a', text: '3', isCorrect: false },
          { id: 'q1-b', text: '4', isCorrect: true }
        ]
      },
      {
        id: 'q2',
        prompt: 'Capital of Pakistan',
        points: 3,
        options: [
          { id: 'q2-a', text: 'Islamabad', isCorrect: true },
          { id: 'q2-b', text: 'Lahore', isCorrect: false }
        ]
      }
    ]
  };

  const result = calculateQuizResult(quiz as any, {
    'q1': 'q1-b',
    'q2': 'q2-a'
  });

  assert.equal(result.score, 5);
  assert.equal(result.totalPoints, 5);
  assert.equal(result.correctAnswers, 2);
  assert.equal(result.accuracy, 100);
});

test('marks unanswered questions as incorrect and preserves point totals', () => {
  const quiz = {
    id: 'quiz-2',
    title: 'Another quiz',
    courseId: 'course-1',
    totalQuestions: 2,
    timeLimitMinutes: 8,
    status: 'PUBLISHED',
    questions: [
      {
        id: 'q1',
        prompt: '2 + 2',
        points: 2,
        options: [
          { id: 'q1-a', text: '3', isCorrect: false },
          { id: 'q1-b', text: '4', isCorrect: true }
        ]
      },
      {
        id: 'q2',
        prompt: 'Capital of Pakistan',
        points: 3,
        options: [
          { id: 'q2-a', text: 'Islamabad', isCorrect: true },
          { id: 'q2-b', text: 'Lahore', isCorrect: false }
        ]
      }
    ]
  };

  const result = calculateQuizResult(quiz as any, {});

  assert.equal(result.score, 0);
  assert.equal(result.totalPoints, 5);
  assert.equal(result.correctAnswers, 0);
  assert.equal(result.accuracy, 0);
});
