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

export type DocStatus = 'QUEUED' | 'PROCESSING' | 'READY' | 'FAILED';

export interface DocumentDetail {
  id: string;
  title: string;
  status: DocStatus;
  language: string | null;
  isExample?: boolean;
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

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  name: string | null;
  createdAt: string;
}
export interface ReviewsSummary {
  average: number;
  count: number;
  items: Review[];
}

export interface BookHit {
  id: number;
  title: string;
  author: string;
  cover: string | null;
  textUrl: string | null;
}

export interface BookRecommendation {
  title: string;
  author: string;
  why: string;
  cover: string | null;
  textUrl: string | null;
}

// ---------- documents ----------

interface PresignedUpload {
  name: string;
  key: string;
  url: string;
}

async function postJson<T>(
  path: string,
  body: unknown,
  token: string,
  recaptchaToken?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  if (recaptchaToken) headers['x-recaptcha-token'] = recaptchaToken;
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message ?? `Request failed (${res.status})`);
  }
  return res.json();
}

/**
 * Three-step upload: (1) ask the API for presigned PUT URLs, (2) upload each
 * file straight to object storage, (3) create the document from the keys.
 * Processing then runs in a background queue (client polls GET /documents/:id).
 * Stays a hand-written fetch — it needs the storage PUT and the reCAPTCHA header.
 */
export async function uploadFiles(
  files: File[],
  token: string,
  lang?: string,
  recaptchaToken?: string,
): Promise<{ id: string }> {
  // 1. presign
  const { uploads } = await postJson<{ uploads: PresignedUpload[] }>(
    '/documents/uploads',
    { files: files.map((f) => ({ name: f.name, type: f.type, size: f.size })) },
    token,
    recaptchaToken,
  );

  // 2. upload bytes directly to storage (order matches the request)
  await Promise.all(
    uploads.map(async (u, i) => {
      const res = await fetch(u.url, {
        method: 'PUT',
        headers: { 'Content-Type': files[i].type || 'application/octet-stream' },
        body: files[i],
      });
      if (!res.ok) throw new Error(`Upload of "${u.name}" failed (${res.status})`);
    }),
  );

  // 3. create the document; processing is queued server-side
  return postJson<{ id: string }>(
    '/documents',
    { sources: uploads.map((u) => ({ key: u.key, name: u.name })), lang },
    token,
    recaptchaToken,
  );
}

export async function getDocument(id: string): Promise<DocumentDetail> {
  return DocumentsService.documentsControllerFindOne({ id });
}

/** Create a document from an AI overview of a book (copyrighted, no free text). */
export async function overviewBook(
  title: string,
  token: string,
  lang?: string,
  recaptchaToken?: string,
): Promise<{ id: string }> {
  return postJson<{ id: string }>('/documents/overview', { title, lang }, token, recaptchaToken);
}

/** Create a document from remote sources (a link or a picked book). */
export async function createFromSources(
  sources: { url?: string; key?: string; name: string }[],
  token: string,
  lang?: string,
  recaptchaToken?: string,
): Promise<{ id: string }> {
  return postJson<{ id: string }>('/documents', { sources, lang }, token, recaptchaToken);
}

// ---------- book search (public domain) ----------

export async function searchBooks(q: string): Promise<BookHit[]> {
  const res = await fetch(`${API_URL}/books/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error(`Book search failed (${res.status})`);
  return res.json();
}

export async function getBooksCount(): Promise<number> {
  const res = await fetch(`${API_URL}/books/count`);
  if (!res.ok) return 0;
  return (await res.json()).count as number;
}

/** AI-curated reading list for a goal/topic. */
export async function recommendBooks(
  topic: string,
  lang?: string,
): Promise<BookRecommendation[]> {
  const res = await fetch(`${API_URL}/books/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, lang }),
  });
  if (!res.ok) throw new Error(`Recommendation failed (${res.status})`);
  return res.json();
}

// ---------- reviews ----------

export async function getReviews(): Promise<ReviewsSummary> {
  const res = await fetch(`${API_URL}/reviews`);
  if (!res.ok) throw new Error(`Could not load reviews (${res.status})`);
  return res.json();
}

export async function createReview(
  body: { rating: number; comment?: string; name?: string },
  token: string,
): Promise<Review> {
  return postJson<Review>('/reviews', body, token);
}

export interface ExampleItem {
  id: string;
  title: string;
  language: string | null;
}

/** Curated public sample documents for the home page (no auth). */
export async function getExamples(): Promise<ExampleItem[]> {
  try {
    const res = await fetch(`${API_URL}/documents/examples`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export const LIBRARY_PAGE = 10;

export async function getLibrary(skip = 0, take = LIBRARY_PAGE): Promise<LibraryItem[]> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('cruxai_token') : null;
  const res = await fetch(`${API_URL}/documents?skip=${skip}&take=${take}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error(`Could not load your library (${res.status})`);
  return res.json();
}

/** Owner-only delete. Cascade removes summary/quiz/flashcards/concepts, so
 * the doc also disappears from Review, Progress and Synthesis. */
export async function deleteDocument(id: string): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('cruxai_token') : null;
  const res = await fetch(`${API_URL}/documents/${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error(`Could not delete (${res.status})`);
}

export interface UsageStatus {
  used: number;
  limit: number;
  remaining: number;
  /** Estimated token cost of one full single-document flow. */
  fullFlow: number;
}

/** Today's remaining AI-token budget for the current user. */
export async function getUsage(): Promise<UsageStatus> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('cruxai_token') : null;
  const res = await fetch(`${API_URL}/usage`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error(`Could not load usage (${res.status})`);
  return res.json();
}

/** Owner-only inline edit of the generated summary (no AI cost). */
export async function updateSummary(
  docId: string,
  data: { contentMd?: string; keyPoints?: string[] },
): Promise<DocumentDetail> {
  return DocumentsService.documentsControllerUpdateSummary({ id: docId, body: data });
}

// ---------- quiz + attempts ----------

export async function generateQuiz(docId: string): Promise<Quiz> {
  return QuizService.quizControllerGenerate({ id: docId });
}

/** Regenerate the quiz focused on weak concepts (rate-limited server-side). */
export async function refreshQuiz(docId: string): Promise<Quiz> {
  return QuizService.quizControllerRefresh({ id: docId });
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

/** Generate a brand-new exam (rate-limited server-side). */
export async function createNewExam(docId: string): Promise<Exam> {
  return ExamsService.examsControllerCreateNew({ id: docId });
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
