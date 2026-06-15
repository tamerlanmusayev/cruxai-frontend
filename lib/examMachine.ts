import { assign, createMachine } from 'xstate';
import { Exam, ExamResult } from './api';

export interface ExamContext {
  id: string;
  fresh: boolean; // load a brand-new exam (vs the cached one)
  exam: Exam | null;
  answers: number[];
  left: number; // seconds remaining
  result: ExamResult | null;
  timedOut: boolean;
  error: string | null;
}

export type ExamEvents =
  | { type: 'ANSWER'; qi: number; oi: number }
  | { type: 'SUBMIT' }
  | { type: 'NEW' };

/**
 * Exam flow as an explicit state machine (mirrors the backend-api machine
 * convention on the client): loading → answering → submitting → result, with
 * a `failed` state. The countdown lives in `answering` via a self-scheduled
 * `after` tick; hitting zero auto-submits with unanswered marked wrong.
 * The async services (loadExam/submit) are injected by the component.
 */
export const examMachine = createMachine(
  {
    id: 'exam',
    predictableActionArguments: true,
    schema: {
      context: {} as ExamContext,
      events: {} as ExamEvents,
    },
    context: {
      id: '',
      fresh: false,
      exam: null,
      answers: [],
      left: 0,
      result: null,
      timedOut: false,
      error: null,
    },
    initial: 'loading',
    states: {
      loading: {
        entry: assign({ error: null, result: null, timedOut: false }),
        invoke: {
          src: 'loadExam',
          onDone: {
            target: 'answering',
            actions: assign({
              exam: (_, e: any) => e.data,
              answers: (_, e: any) => new Array(e.data.questions.length).fill(-1),
              left: (_, e: any) => e.data.durationSec,
              fresh: (_) => false,
            }),
          },
          onError: {
            target: 'failed',
            actions: assign({ error: (_, e: any) => String(e.data?.message ?? e.data) }),
          },
        },
      },
      answering: {
        after: {
          1000: [
            {
              target: 'submitting',
              cond: (ctx) => ctx.left <= 1,
              actions: assign({ timedOut: (_) => true, left: (_) => 0 }),
            },
            {
              target: 'answering',
              internal: false, // re-enter to reschedule the tick
              actions: assign({ left: (ctx) => ctx.left - 1 }),
            },
          ],
        },
        on: {
          ANSWER: {
            actions: assign({
              answers: (ctx, e) => ctx.answers.map((a, i) => (i === e.qi ? e.oi : a)),
            }),
          },
          SUBMIT: 'submitting',
        },
      },
      submitting: {
        invoke: {
          src: 'submit',
          onDone: {
            target: 'result',
            actions: assign({ result: (_, e: any) => e.data }),
          },
          // On failure, return to answering so the user can retry submitting.
          onError: {
            target: 'answering',
            actions: assign({ error: (_, e: any) => String(e.data?.message ?? e.data) }),
          },
        },
      },
      result: {
        on: { NEW: { target: 'loading', actions: assign({ fresh: (_) => true }) } },
      },
      failed: {
        on: { NEW: 'loading' },
      },
    },
  },
);
