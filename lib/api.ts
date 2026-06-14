// Thin typed wrappers over the Swagger-generated client (lib/api-client).
// Regenerate the client with `npm run gen:api` after backend API changes.
// Auth (Bearer token) and error normalization are handled by the axios
// interceptors in lib/api-client/index.ts.
import {
  AttemptsService,
  ConceptsService,
  DocumentsService,
  ExamsService,
  FlashcardsService,
  ProgressService,
  QuizService,
  StatsService,
  SynthesisService,
} from './api-client';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type DocStatus = 'PROCESSING' | 'READY' | 'FAILED';

export interface DocumentDetail {
  id: string;
  title: string;
  status: DocStatus;
  language: string | null;
  error: string | null;
  skipped: { name: string; reason: string }[] | null;
  summary: {
    contentMd: string;
    keyPoints: string[];
    citations: { n: number; section: string | null; quote: string }[] | null;
  } | null;
}

export interface QuizQuestion {
  question: string;
  options: string[];
}

export interface Quiz {
  id: string;
  adaptive: boolean;
  focusedOn: string[];
  questions: QuizQuestion[];
}

export interface ProgressItem {
  concept: string;
  documentId: string;
  mastery: number;
  seen: number;
  correct: number;
}

export interface QuestionFeedback {
  index: number;
  correct: boolean;
  correctIndex: number;
  chosenIndex: number;
  explanation: string;
}

export interface AttemptResult {
  id: string;
  score: number;
  total: number;
  feedback: QuestionFeedback[];
}

export interface DayCount {
  day: string;
  count: number;
}

export interface Stats {
  online: number;
  documents: number;
  summaries: number;
  quizzes: number;
  attempts: number;
  summariesToday: number;
  languages: string[];
  daily: DayCount[];
  monthly: DayCount[];
  countries: { code: string; name: string; pct: number }[];
}

export interface LibraryItem {
  id: string;
  title: string;
  status: DocStatus;
  language: string | null;
  createdAt: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface GraphNode {
  id: string;
  name: string;
  summary: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}
export interface GraphEdge {
  from: string;
  to: string;
  relation: string;
}
export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Exam {
  id: string;
  durationSec: number;
  questions: QuizQuestion[];
}
export interface ExamResult {
  score: number;
  total: number;
  predicted: number;
  weakReport: { question: string; explanation: string }[];
  answers: { correctIndex: number; chosenIndex: number; explanation: string }[];
}

export interface Synthesis {
  consensus: string;
  differences: { point: string; sources: string[] }[];
}

// ---------- documents ----------

/**
 * Multipart upload stays a hand-written fetch — the generated client doesn't
 * model FormData bodies or the reCAPTCHA header. Auth is passed explicitly here.
 */
export async function uploadFiles(
  files: File[],
  token: string,
  lang?: string,
  recaptchaToken?: string,
): Promise<{ id: string }> {
  const form = new FormData();
  for (const f of files) form.append('files', f);
  if (lang) form.append('lang', lang);
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (recaptchaToken) headers['x-recaptcha-token'] = recaptchaToken;
  const res = await fetch(`${API_URL}/documents`, {
    method: 'POST',
    headers,
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `Upload failed (${res.status})`);
  }
  return res.json();
}

export async function getDocument(id: string): Promise<DocumentDetail> {
  return DocumentsService.documentsControllerFindOne({ id });
}

export async function getLibrary(): Promise<LibraryItem[]> {
  return DocumentsService.documentsControllerList();
}

// ---------- quiz + attempts ----------

export async function generateQuiz(docId: string): Promise<Quiz> {
  return QuizService.quizControllerGenerate({ id: docId });
}

export async function submitAttempt(
  quizId: string,
  answers: number[],
): Promise<AttemptResult> {
  return AttemptsService.attemptsControllerSubmit({ quizId, body: { answers } });
}

// ---------- flashcards ----------

export async function generateFlashcards(docId: string): Promise<Flashcard[]> {
  return FlashcardsService.flashcardsControllerGenerate({ id: docId });
}

export async function getDueFlashcards(): Promise<Flashcard[]> {
  return FlashcardsService.flashcardsControllerDue();
}

export async function reviewFlashcard(
  id: string,
  grade: number,
): Promise<{ intervalDays: number }> {
  return FlashcardsService.flashcardsControllerReview({ id, body: { grade } });
}

// ---------- knowledge graph ----------

export async function getGraph(docId: string): Promise<Graph> {
  return ConceptsService.conceptsControllerGenerate({ id: docId });
}

// ---------- exam ----------

export async function createExam(docId: string): Promise<Exam> {
  return ExamsService.examsControllerCreate({ id: docId });
}

export async function submitExam(
  examId: string,
  answers: number[],
): Promise<ExamResult> {
  return ExamsService.examsControllerSubmit({ id: examId, body: { answers } });
}

// ---------- synthesis ----------

export async function runSynthesis(
  documentIds: string[],
  query: string,
): Promise<Synthesis> {
  return SynthesisService.synthesisControllerRun({ body: { documentIds, query } });
}

// ---------- progress + stats ----------

export async function getProgress(): Promise<ProgressItem[]> {
  return ProgressService.progressControllerGet();
}

export async function getStats(): Promise<Stats> {
  return StatsService.statsControllerGet();
}
