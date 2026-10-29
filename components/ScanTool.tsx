"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Upload, ScanLine, RotateCcw, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import CameraCapture from "@/components/CameraCapture";
import type { ExtractionResult, MatchResult, Verdict } from "@/lib/match";

const FIELD_ROWS: Array<{ key: keyof ExtractionResult; label: string }> = [
  { key: "nafdac_reg_no", label: "NAFDAC reg. no." },
  { key: "product_name", label: "Product name" },
  { key: "batch_no", label: "Batch no." },
  { key: "expiry_date", label: "Expiry" },
  { key: "manufacturer", label: "Manufacturer" },
];

const VERDICTS: Record<
  Verdict,
  { label: string; tone: string; border: string; mark: string }
> = {
  registered: {
    label: "Registered & active",
    tone: "text-clinical-bright",
    border: "border-clinical-bright/35",
    mark: "border-clinical-bright/45 text-clinical-bright",
  },
  partial: {
    label: "Partial match",
    tone: "text-warn-bright",
    border: "border-warn-bright/35",
    mark: "border-warn-bright/45 text-warn-bright",
  },
  not_found: {
    label: "Not in the register",
    tone: "text-alert-bright",
    border: "border-alert-bright/35",
    mark: "border-alert-bright/45 text-alert-bright",
  },
  unreadable: {
    label: "Needs a better photo",
    tone: "text-bone",
    border: "border-bone/25",
    mark: "border-bone/25 text-bone-dim",
  },
};

const CONFIDENCE_DOT: Record<string, string> = {
  clear: "bg-clinical-bright",
  uncertain: "bg-warn-bright",
  not_visible: "bg-bone-dim/50",
};

export default function ScanTool({ dataAsOf }: { dataAsOf: string | null }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const previewRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  const setPreviewUrl = useCallback((file: File) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(file);
    previewRef.current = url;
    setPreview(url);
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setPreviewUrl(file);
      setExtraction(null);
      setMatch(null);
      setError(null);
      setLoading(true);

      try {
        const form = new FormData();
        form.append("image", file);
        const res = await fetch("/api/scan", { method: "POST", body: form });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Extraction failed.");
          if (data.raw) console.log("Raw model output:", data.raw);
        } else {
          setExtraction(data.extraction);
          setMatch(data.match);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Request failed.");
      } finally {
        setLoading(false);
      }
    },
    [setPreviewUrl]
  );

  function reset() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setPreview(null);
    setExtraction(null);
    setMatch(null);
    setError(null);
  }

  const verdict = match ? VERDICTS[match.verdict] : null;
  const legible = extraction
    ? FIELD_ROWS.filter(({ key }) => {
        const field = extraction[key];
        return field.value !== null && field.confidence !== "not_visible";
      }).length
    : 0;

  return (
    <main className="flex-1 pb-24 pt-10 md:pt-14">
      <div className="mx-auto w-full max-w-[1360px] px-6 md:px-10">
        <div className="border-b border-rule pb-8">
          <div className="flex flex-col gap-4 border-b border-rule pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow text-clinical">Tool / scan</p>
              <h1 className="display mt-4 text-[clamp(2.7rem,6vw,4.5rem)]">
                Scan a pack.
              </h1>
            </div>
            <div className="sm:text-right">
              <p className="eyebrow text-muted">Greenbook snapshot</p>
              <p className="mono mt-2 text-[11px] text-ink">
                {dataAsOf ?? "unavailable"}
              </p>
            </div>
          </div>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink-soft">
            One sharp photo of the NAFDAC number beats five blurry ones. We read
            five fields, but only the registration number can confirm a product.
          </p>
        </div>

        <div className="mt-8 grid items-stretch gap-6 lg:grid-cols-[1fr_1.04fr] lg:gap-8">
          {/* ---------------- capture ---------------- */}
          <section
            aria-label="Capture a pack"
            className="relative flex min-h-[460px] flex-col border border-rule bg-paper-2 lg:min-h-[600px]"
          >
            <div className="flex items-center justify-between border-b border-rule px-5 py-3">
              <span className="eyebrow text-muted">Specimen</span>
              <span className="mono text-[10px] uppercase tracking-[0.14em] text-muted">
                {loading ? "Reading" : preview ? "Ready" : "No input"}
              </span>
            </div>

            <div className="relative flex-1">
              {preview ? (
                <>
                  <Image
                    src={preview}
                    alt="The pack you selected"
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 640px, 100vw"
                    className="object-contain p-4"
                  />
                  {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-film/60 backdrop-blur-[1px]">
                      <div className="h-10 w-10">
                        <div className="animate-scan h-px w-full bg-clinical-bright shadow-[0_0_14px_2px_rgba(78,211,163,0.6)]" />
                      </div>
                      <p className="mt-4 mono text-[10px] uppercase tracking-[0.2em] text-bone">
                        Reading pack
                      </p>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex flex-wrap justify-center gap-2 border-t border-rule bg-paper-2/90 p-3 backdrop-blur">
                    <button
                      type="button"
                      onClick={() => setCameraOpen(true)}
                      className="inline-flex items-center gap-2 rounded-full border border-rule-strong px-4 py-2 text-[12px] font-medium transition-colors hover:border-ink"
                    >
                      <Camera className="h-3.5 w-3.5" strokeWidth={1.8} />
                      Retake
                    </button>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-rule-strong px-4 py-2 text-[12px] font-medium transition-colors hover:border-ink">
                      <Upload className="h-3.5 w-3.5" strokeWidth={1.8} />
                      Replace
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFile(file);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col justify-between gap-6 p-6">
                  <span className="corner corner-tl text-ink/25" />
                  <span className="corner corner-tr text-ink/25" />
                  <span className="corner corner-bl text-ink/25" />
                  <span className="corner corner-br text-ink/25" />

                  <div className="mx-auto mt-6 max-w-sm text-center">
                    <ScanLine
                      className="mx-auto h-7 w-7 text-clinical"
                      strokeWidth={1.5}
                    />
                    <h2 className="mt-4 font-display text-2xl">
                      Put the number in frame.
                    </h2>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">
                      Straight on, well lit, filling the frame. It is the only
                      field that can confirm a product.
                    </p>
                  </div>

                  <ul className="mx-auto w-full max-w-sm">
                    <li className="flex items-start gap-3 border-t border-rule py-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-clinical" />
                      <div>
                        <span className="text-[12px] font-medium">
                          NAFDAC Reg. No.
                        </span>
                        <span className="mono ml-2 text-[9px] uppercase tracking-[0.12em] text-clinical">
                          required
                        </span>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                          Usually printed as &ldquo;NAFDAC Reg. No&rdquo; or
                          &ldquo;NRN&rdquo;.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 border-t border-rule py-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warn" />
                      <div>
                        <span className="text-[12px] font-medium">Product name</span>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                          Backup when the number is illegible — never proof on
                          its own.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 border-y border-rule py-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted/60" />
                      <div>
                        <span className="text-[12px] font-medium">
                          Batch, expiry, manufacturer
                        </span>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                          Read and shown, but not checked against anything yet.
                        </p>
                      </div>
                    </li>
                  </ul>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setCameraOpen(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-[12.5px] font-medium text-paper transition-colors hover:bg-clinical"
                    >
                      <Camera className="h-4 w-4" strokeWidth={1.8} />
                      Use camera
                    </button>
                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-rule-strong px-5 py-3 text-[12.5px] font-medium transition-colors hover:border-ink">
                      <Upload className="h-4 w-4" strokeWidth={1.8} />
                      Upload photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFile(file);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ---------------- readout ---------------- */}
          <section
            aria-label="Scan readout"
            aria-live="polite"
            className="film-noise flex min-h-[460px] flex-col border border-rule-film bg-film text-bone lg:min-h-[600px]"
          >
            <div className="flex items-center justify-between border-b border-rule-film px-5 py-3">
              <span className="eyebrow text-bone-dim">Readout</span>
              <span className="mono text-[10px] uppercase tracking-[0.14em] text-bone-dim">
                {loading
                  ? "Working"
                  : match
                    ? verdict?.label
                    : error
                      ? "Error"
                      : "Idle"}
              </span>
            </div>

            <div className="flex-1">
              {!match && !loading && !error && (
                <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
                  <p className="eyebrow text-bone-dim">Awaiting specimen</p>
                  <p className="mt-4 font-display text-[1.9rem] text-bone-dim">
                    No read yet.
                  </p>
                  <p className="mt-2 max-w-xs text-[12px] leading-relaxed text-bone-dim/80">
                    The five extracted fields and the verdict will appear here.
                    Nothing is inferred.
                  </p>
                </div>
              )}

              {loading && (
                <div className="px-6 py-10">
                  <p className="eyebrow text-clinical-bright">Reading the pack</p>
                  <div className="mt-7 space-y-4">
                    {[
                      "Locating printed fields",
                      "Reading the registration number",
                      "Checking the Greenbook",
                    ].map((line, i) => (
                      <div key={line} className="flex items-center gap-3">
                        <span
                          className="animate-blink h-1 w-1 rounded-full bg-clinical-bright"
                          style={{ animationDelay: `${i * 0.35}s` }}
                        />
                        <span className="mono text-[11px] text-bone-dim">{line}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-10 h-px w-full overflow-hidden bg-rule-film">
                    <div className="animate-scan h-px w-1/3 bg-clinical-bright" />
                  </div>
                  <p className="mt-4 text-[11px] text-bone-dim/70">
                    This can take a few seconds.
                  </p>
                </div>
              )}

              {error && (
                <div className="px-6 py-10">
                  <div className="flex items-start gap-3 border border-alert-bright/35 bg-alert-bright/[0.06] px-4 py-4">
                    <AlertTriangle
                      className="mt-0.5 h-4 w-4 shrink-0 text-alert-bright"
                      strokeWidth={1.8}
                    />
                    <div>
                      <p className="font-display text-lg text-alert-bright">
                        The read failed
                      </p>
                      <p className="mt-1.5 text-[12px] leading-relaxed text-bone-dim">
                        {error}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={reset}
                    className="mt-6 inline-flex items-center gap-2 rounded-full border border-rule-film px-4 py-2 text-[12px] text-bone transition-colors hover:border-bone/40"
                  >
                    <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.8} />
                    Try another photo
                  </button>
                </div>
              )}

              {match && extraction && verdict && (
                <div>
                  <div className={`border-b px-6 py-6 ${verdict.border}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="eyebrow text-bone-dim">Verdict</p>
                        <h2
                          className={`mt-2 font-display text-[2rem] leading-none ${verdict.tone}`}
                        >
                          {verdict.label}
                        </h2>
                      </div>
                      <div
                        className={clsx(
                          "shrink-0 -rotate-3 border px-2.5 py-1.5 text-center",
                          verdict.mark
                        )}
                      >
                        <div className="eyebrow">Greenbook</div>
                        <div className="mono mt-0.5 text-[10px]">
                          {extraction.nafdac_reg_no.value ?? "NO READ"}
                        </div>
                      </div>
                    </div>

                    <p className="mt-4 max-w-md text-[12.5px] leading-relaxed text-bone-dim">
                      {match.reason}
                    </p>

                    {match.matchedProduct && (
                      <div className="mt-5 border border-rule-film px-3.5 py-3">
                        <div className="eyebrow text-bone-dim">Register entry</div>
                        <p className="mt-1.5 text-[12.5px] text-bone">
                          {match.matchedProduct.productName}
                        </p>
                        <p className="mono mt-1 text-[10.5px] text-bone-dim">
                          {match.matchedProduct.regNo} ·{" "}
                          {match.matchedProduct.status} ·{" "}
                          {match.matchedProduct.categoryName}
                        </p>
                        <p className="mt-1 text-[11px] text-bone-dim/80">
                          {match.matchedProduct.applicantName}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="px-6 py-5">
                    <div className="flex items-center justify-between">
                      <p className="eyebrow text-bone-dim">Fields read</p>
                      <span className="mono text-[9.5px] uppercase tracking-[0.14em] text-bone-dim">
                        {legible} of {FIELD_ROWS.length} legible
                      </span>
                    </div>

                    <dl className="mt-3">
                      {FIELD_ROWS.map(({ key, label }) => {
                        const field = extraction[key];
                        return (
                          <div
                            key={key}
                            className="flex items-baseline justify-between gap-4 border-b border-rule-film py-3 last:border-b-0"
                          >
                            <dt className="eyebrow shrink-0 text-bone-dim">{label}</dt>
                            <dd className="min-w-0 text-right">
                              <div
                                className={clsx(
                                  "mono text-[11.5px] leading-snug",
                                  field.value && field.confidence !== "not_visible"
                                    ? "text-bone"
                                    : "text-bone-dim/60 italic"
                                )}
                              >
                                {field.value ?? "—"}
                              </div>
                              <div className="mt-1 flex items-center justify-end gap-1.5">
                                <span
                                  className={`h-1 w-1 rounded-full ${
                                    CONFIDENCE_DOT[field.confidence]
                                  }`}
                                />
                                <span className="mono text-[8.5px] uppercase tracking-[0.12em] text-bone-dim">
                                  {field.confidence.replace("_", " ")}
                                </span>
                              </div>
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </div>

                  <div className="px-6 pb-6">
                    <button
                      type="button"
                      onClick={reset}
                      className="inline-flex items-center gap-2 rounded-full border border-rule-film px-4 py-2 text-[12px] text-bone transition-colors hover:border-bone/40"
                    >
                      <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.8} />
                      Scan another pack
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-rule-film px-5 py-3">
              <span className="mono text-[9px] uppercase tracking-[0.16em] text-bone-dim">
                NAFDAC / Greenbook
              </span>
              <span className="mono text-[9px] uppercase tracking-[0.16em] text-bone-dim">
                {dataAsOf ?? "—"}
              </span>
            </div>
          </section>
        </div>

        <p className="mt-6 max-w-2xl text-[11px] leading-relaxed text-muted">
          A result describes registration status only. It is not a statement
          that a medicine is safe, effective or genuine, and it is not medical
          advice.
        </p>
      </div>

      {cameraOpen && (
        <CameraCapture
          onCapture={(file) => {
            setCameraOpen(false);
            handleFile(file);
          }}
          onClose={() => setCameraOpen(false)}
        />
      )}
    </main>
  );
}
