import Link from 'next/link';

export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <article className="glass mx-auto max-w-2xl p-6 sm:p-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">Last updated: 15 June 2026</p>

      <div className="legal mt-6">
        <p>
          CruxAI is a free, open-source learning tool. This policy explains what we
          collect and why. We keep it minimal on purpose.
        </p>

        <h2>Account & identity</h2>
        <p>
          You can use CruxAI without giving us your name or email. On first use we
          create an anonymous session token that is stored in your browser
          (localStorage) so your library stays with you. You can clear it any time by
          clearing your browser storage.
        </p>

        <h2>Content you upload</h2>
        <p>
          Files you upload or links you import are stored only to produce your summary,
          quiz, flashcards and related study material. Their text is sent to
          Anthropic&apos;s Claude API for processing. We do not sell your content and do
          not share it with anyone beyond the processors needed to run the service.
        </p>

        <h2>What we measure</h2>
        <p>
          We keep aggregate, anonymous counts (e.g. number of summaries, quizzes,
          online users) to show platform activity. These are not tied to your identity.
        </p>

        <h2>Third-party processors</h2>
        <ul>
          <li>Anthropic (Claude API) — generates summaries, quizzes and feedback.</li>
          <li>Our hosting and database providers — store your documents and results.</li>
          <li>Optional anti-abuse (e.g. reCAPTCHA) on uploads.</li>
        </ul>

        <h2>Cookies & local storage</h2>
        <p>
          We use browser localStorage for your session token, language and theme
          preference. We do not use advertising trackers.
        </p>

        <h2>Your choices</h2>
        <p>
          You can stop using the service and clear your browser storage at any time. To
          request deletion of documents tied to your session, contact us via the GitHub
          repository.
        </p>

        <h2>Changes</h2>
        <p>
          We may update this policy; the “last updated” date will change accordingly.
        </p>

        <h2>Contact</h2>
        <p>
          Questions? Reach us through the project on{' '}
          <a href="https://github.com/tamerlanmusayev" target="_blank" rel="noreferrer">
            GitHub
          </a>
          .
        </p>
      </div>

      <Link href="/" className="mt-8 inline-block text-sm text-brand hover:underline">
        ← Back to CruxAI
      </Link>
    </article>
  );
}
