import { updateQuizSchema } from "./features/quiz/validations/updateQuiz";

const payload = {
  quizId: 1,
  title: 'test',
  description: '',
  questions: [
    {
      id: 9,
      type: 'single_choice',
      text: 'testing',
      durationSeconds: 30,
      marks: 10,
      config: { options: [{id: 'a', text: '1'}, {id: 'b', text: '2'}] },
      correctAnswer: 'a',
      orderIndex: 0
    },
    {
      id: 10,
      type: 'multi_choice',
      text: 'testing multi choice',
      durationSeconds: 30,
      marks: 10,
      config: { options: [{id: 'a', text: '1'}, {id: 'b', text: '2'}] },
      correctAnswer: ['a'],
      orderIndex: 1
    },
    {
      id: 11,
      type: 'true_false',
      text: 'testing true false',
      durationSeconds: 20,
      marks: 5,
      config: {},
      correctAnswer: true,
      orderIndex: 2
    },
    {
      id: 12,
      type: 'text',
      text: 'testing text answer',
      durationSeconds: 60,
      marks: 10,
      config: { caseSensitive: false },
      correctAnswer: '1',
      orderIndex: 3
    },
    {
      id: 13,
      type: 'sequence',
      text: 'testing sequence',
      durationSeconds: 60,
      marks: 15,
      config: { items: [{id: '1', text: '1'}, {id: '2', text: '2'}] },
      correctAnswer: ['1', '2'],
      orderIndex: 4
    }
  ]
};

const res = updateQuizSchema.safeParse(payload);
if (!res.success) {
  console.dir(res.error.issues, { depth: null });
} else {
  console.log("Success!");
}
