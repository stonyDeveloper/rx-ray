import Container from "./Container";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-rule bg-paper-2 py-12 md:py-16">
      <Container>
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[12px] leading-relaxed text-ink-soft">
              A NAFDAC registration checker for medicine packs. Built as a
              capstone by Team Nexascale.
            </p>
          </div>

          <div>
            <p className="eyebrow text-muted">Sources</p>
            <ul className="mt-4 space-y-2 text-[12px]">
              <li>
                <a
                  href="https://greenbook.nafdac.gov.ng/"
                  target="_blank"
                  rel="noreferrer"
                  className="link-line text-ink-soft hover:text-ink"
                >
                  NAFDAC Greenbook
                </a>
              </li>
              <li>
                <a
                  href="https://www.nafdac.gov.ng/"
                  target="_blank"
                  rel="noreferrer"
                  className="link-line text-ink-soft hover:text-ink"
                >
                  NAFDAC Recalls &amp; Alerts
                </a>
                <span className="ml-2 eyebrow text-warn">Next</span>
              </li>
            </ul>
          </div>

          <div>
            <p className="eyebrow text-muted">Notes</p>
            <p className="mt-4 text-[12px] leading-relaxed text-ink-soft">
              Photos are sent to Google&apos;s Gemini API to read the label.
              Results describe registration status only — never whether a
              medicine is safe or effective. Not a substitute for professional
              or regulatory advice.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-rule pt-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="mono text-[10px] uppercase tracking-[0.14em] text-muted">
            © 2026 Team Nexascale
          </span>
          <span className="mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Greenbook data © NAFDAC
          </span>
        </div>
      </Container>
    </footer>
  );
}
