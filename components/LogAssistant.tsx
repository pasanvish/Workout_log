import React, { useState } from 'react';
import { answerLogQuestion, LOG_QUESTIONS } from '../logAssistant';
import type { ProfilePRs, WorkoutLog } from '../types';

interface LogAssistantProps {
  logs: WorkoutLog[];
  records: ProfilePRs;
  goal: number;
}

export default function LogAssistant({ logs, records, goal }: LogAssistantProps) {
  const [question, setQuestion] = useState('');
  const [submitted, setSubmitted] = useState('');

  return (
    <section className="tracking-panel">
      <div className="flex items-start gap-3">
        <span className="session-date !size-10" aria-hidden="true">
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 5h16v11H9l-5 4V5ZM8 12l2-2 2 2 4-4" />
          </svg>
        </span>
        <div>
          <h3 className="text-lg font-semibold">Ask your log</h3>
          <p className="text-sm text-text-secondary">Ask about your workouts and records. Answers use the training data on this device.</p>
        </div>
      </div>
      <form className="mt-4 flex gap-2" onSubmit={event => { event.preventDefault(); setSubmitted(question.trim()); }}>
        <input className="track-input min-w-0 flex-1" aria-label="Ask your workout log" placeholder="Ask about your training"
          value={question} maxLength={160} onChange={event => setQuestion(event.target.value)} />
        <button type="submit" className="panel-action panel-action-primary disabled:opacity-40" disabled={!question.trim()}>Ask</button>
      </form>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {LOG_QUESTIONS.map(example => (
          <button type="button" key={example} className="category-chip" onClick={() => { setQuestion(example); setSubmitted(example); }}>
            {example}
          </button>
        ))}
      </div>
      {submitted && <p role="status" className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-background-dark p-3 text-sm leading-relaxed">
        {answerLogQuestion(submitted, logs, records, goal)}
      </p>}
    </section>
  );
}
