// A short, honest privacy statement, worth having before more people
// hand over an email address, even for a small closed beta with no
// monetization. Deliberately plain-language, not a legal boilerplate
// wall of text.
export default function Privacy({ textMain, textMuted, panelBg, borderCol, accentGold, isPhone }) {
  return (
    <div style={{ maxWidth: 640 }}>
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: isPhone ? 22 : 26, fontWeight: 700, margin: "0 0 6px" }}>
        Privacy, what we collect and why
      </h2>
      <p style={{ color: textMuted, fontSize: 13, marginBottom: 24 }}>
        Last updated for the closed beta. ChessPath is not monetized and your data is never sold or used for advertising.
      </p>

      <Section title="What we collect" textMain={textMain} textMuted={textMuted} accentGold={accentGold}>
        Your email (for magic-link sign-in only, no password stored), your diagnostic quiz results,
        which lessons and puzzles you've completed, and any feedback you submit through the feedback
        button. We don't collect anything beyond what's needed to make the app work and to see how
        the beta is going.
      </Section>

      <Section title="What we don't do" textMain={textMain} textMuted={textMuted} accentGold={accentGold}>
        No ads, no selling data to third parties, no tracking you across other sites. Supabase (our
        database provider) and Vercel (our hosting provider) process data on our behalf as
        infrastructure, they don't use it for their own purposes.
      </Section>

      <Section title="Who can see it" textMain={textMain} textMuted={textMuted} accentGold={accentGold}>
        Your progress and results are private to your account, row-level security in the database
        means even another signed-in tester can't query your data. As the person running this beta,
        we can see aggregate stats and individual feedback you submit, since that's the point of
        testing.
      </Section>

      <Section title="Your data, your choice" textMain={textMain} textMuted={textMuted} accentGold={accentGold}>
        Since this is an early beta, there's no self-serve "delete my account" button yet, if you'd
        like your data removed, just ask and it'll be deleted directly from the database.
      </Section>
    </div>
  );
}

function Section({ title, children, textMain, textMuted, accentGold }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: textMain, marginBottom: 6 }}>{title}</div>
      <p style={{ color: textMuted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>{children}</p>
    </div>
  );
}
