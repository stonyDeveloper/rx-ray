"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  Camera,
  Check,
  Copy,
  Flag,
  Keyboard,
  RotateCcw,
  ScanLine,
  Upload,
} from "lucide-react";
import clsx from "clsx";
import CameraCapture from "@/components/CameraCapture";
import type { ExtractionResult, MatchResult, Verdict } from "@/lib/match";

type Mode = "photo" | "manual";
type ReportState = "idle" | "sending" | "sent" | "unavailable";

type ScanResponse = {
  extraction?: ExtractionResult;
  match?: MatchResult;
  source?: Mode;
  reported?: boolean;
  error?: string;
  raw?: string;
};

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

const NEXT_STEPS: Record<
  Verdict,
  { title: string; copy: string; reportable: boolean; manual: boolean }
> = {
  registered: {
    title: "Registration is active.",
    copy: "That confirms the registration — not the batch, and not that the medicine is genuine. If anything looks off — print quality, seals, where you bought it — ask a pharmacist.",
    reportable: false,
    manual: false,
  },
  partial: {
    title: "Don't rely on this pack.",
    copy: "Something didn't line up. Check the number again, show the pack to a pharmacist, and report it if you're still unsure.",
    reportable: true,
    manual: false,
  },
  not_found: {
    title: "Don't take this medicine.",
    copy: "Double-check the number for a typo. If it's correct, do not use the pack — report it and keep the packaging.",
    reportable: true,
    manual: false,
  },
  unreadable: {
    title: "Try again, or type the number.",
    copy: "Retake the photo flat and well lit, with the NAFDAC number filling the frame — or enter the number by hand.",
    reportable: false,
    manual: true,
  },
};

const CONFIDENCE_DOT: Record<string, string> = {
  clear: "bg-clinical-bright",
  uncertain: "bg-warn-bright",
  not_visible: "bg-bone-dim/50",
};

export default function ScanTool({ dataAsOf }: { dataAsOf: string | null }) {
  const [mode, setMode] = useState<Mode>("photo");
  const [preview, setPreview] = useState<string | null>(null);
  const [manualValue, setManualValue] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSubmitted, setManualSubmitted] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [source, setSource] = useState<Mode | null>(null);
  const [reported, setReported] = useState(false);
  const [reportState, setReportState] = useState<ReportState>("idle");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const previewRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  const clearResult = useCallback(() => {
    setExtraction(null);
    setMatch(null);
    setSource(null);
    setReported(false);
    setReportState("idle");
    setCopied(false);
    setError(null);
  }, []);

  const setPreviewUrl = useCallback((file: File) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(file);
    previewRef.current = url;
    setPreview(url);
  }, []);

  const clearPreview = useCallback(() => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setPreview(null);
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setMode("photo");
      setManualSubmitted(null);
      setManualError(null);
      setPreviewUrl(file);
      clearResult();
      setLoading(true);

      try {
        const form = new FormData();
        form.append("image", file);
        const res = await fetch("/api/scan", { method: "POST", body: form });
        const data: ScanResponse = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Extraction failed.");
          if (data.raw) console.log("Raw model output:", data.raw);
        } else if (data.extraction && data.match) {
          setExtraction(data.extraction);
          setMatch(data.match);
          setSource(data.source ?? "photo");
          setReported(Boolean(data.reported));
          setReportState(data.reported ? "sent" : "idle");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Request failed.");
      } finally {
        setLoading(false);
      }
    },
    [clearResult, setPreviewUrl]
  );

  const handleManualSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      const raw = manualValue.trim();
      if (!raw) return;

      setManualError(null);
      clearResult();
      setManualSubmitted(null);
      setLoading(true);

      try {
        const res = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registrationNumber: raw }),
        });
        const data: ScanResponse = await res.json();

        if (!res.ok) {
          if (res.status === 400) {
            setManualError(data.error ?? "Enter a valid registration number.");
          } else {
            setError(data.error ?? "The check failed.");
          }
        } else if (data.extraction && data.match) {
          setExtraction(data.extraction);
          setMatch(data.match);
          setSource(data.source ?? "manual");
          setReported(Boolean(data.reported));
          setReportState(data.reported ? "sent" : "idle");
          setManualSubmitted(
            data.extraction.nafdac_reg_no.value ?? raw.toUpperCase()
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Request failed.");
      } finally {
        setLoading(false);
      }
    },
    [clearResult, manualValue]
  );

  function reset() {
    clearPreview();
    clearResult();
    setManualError(null);
    setManualSubmitted(null);
    if (mode === "manual") setManualValue("");
  }

  function switchToManual(prefill = "") {
    if (loading) return;
    setMode("manual");
    clearResult();
    setManualError(null);
    setManualSubmitted(null);
    setManualValue(prefill);
    clearPreview();
  }

  function switchToPhoto() {
    if (loading) return;
    setMode("photo");
    clearResult();
    setManualError(null);
    setManualSubmitted(null);
  }

  function editManualNumber() {
    clearResult();
    setManualSubmitted(null);
    setManualError(null);
  }

  async function submitReport() {
    if (!extraction || !match) return;
    setReportState("sending");
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraction, match }),
      });
      const data: { delivered?: boolean } = await res
        .json()
        .catch(() => ({ delivered: false }));
      setReportState(res.ok && data.delivered ? "sent" : "unavailable");
    } catch {
      setReportState("unavailable");
    }
  }

  function reportText() {
    if (!extraction || !match) return "";
    return [
      "Rx-Ray report",
      `Verdict: ${VERDICTS[match.verdict].label}`,
      `Reason: ${match.reason}`,
      `Product: ${extraction.product_name.value ?? "—"}`,
      `NAFDAC reg. no.: ${extraction.nafdac_reg_no.value ?? "—"}`,
      `Batch: ${extraction.batch_no.value ?? "—"}`,
      `Expiry: ${extraction.expiry_date.value ?? "—"}`,
      `Manufacturer: ${extraction.manufacturer.value ?? "—"}`,
      `Greenbook snapshot: ${dataAsOf ?? "unknown"}`,
      `Input: ${source === "manual" ? "typed registration number" : "photo"}`,
    ].join("\n");
  }

  async function copyDetails() {
    try {
      await navigator.clipboard.writeText(reportText());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard access can fail in embedded browsers; the text stays on screen.
    }
  }

  const verdict = match ? VERDICTS[match.verdict] : null;
  const legible = extraction
    ? FIELD_ROWS.filter(({ key }) => {
        const field = extraction[key];
        return field.value !== null && field.confidence !== "not_visible";
      }).length
    : 0;
  const reportDone = reported || reportState === "sent";

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
            One sharp photo of the NAFDAC number — or the number typed by hand —
            is enough. We read five fields, but only the registration number can
            confirm a product.
          </p>
        </div>

        <div className="mt-8 grid items-stretch gap-6 lg:grid-cols-[1fr_1.04fr] lg:gap-8">
          {/* ---------------- capture ---------------- */}
          <section
            aria-label="Capture a pack"
            className="relative flex min-h-[460px] flex-col border border-rule bg-paper-2 lg:min-h-[600px]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2.5">
              <span className="eyebrow text-muted">Specimen</span>
              <div
                role="tablist"
                aria-label="Input method"
                className="flex items-center rounded-full border border-rule p-0.5"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "photo"}
                  disabled={loading}
                  onClick={switchToPhoto}
                  className={clsx(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-50",
                    mode === "photo"
                      ? "bg-ink text-paper"
                      : "text-muted hover:text-ink"
                  )}
                >
                  <Camera className="h-3 w-3" strokeWidth={2} />
                  Photo
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "manual"}
                  disabled={loading}
                  onClick={() => switchToManual()}
                  className={clsx(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-50",
                    mode === "manual"
                      ? "bg-ink text-paper"
                      : "text-muted hover:text-ink"
                  )}
                >
                  <Keyboard className="h-3 w-3" strokeWidth={2} />
                  Number
                </button>
              </div>
            </div>

            <div className="relative flex-1">
              {mode === "manual" ? (
                manualSubmitted && match ? (
                  <div className="flex h-full flex-col items-center justify-center gap-10 p-6">
                    <div className="text-center">
                      <p className="eyebrow text-muted">Entered manually</p>
                      <p className="mt-6 break-all mono text-[clamp(1.8rem,5vw,2.6rem)] tracking-[0.03em] text-ink">
                        {manualSubmitted}
                      </p>
                      <p className="mt-3 text-[11px] text-muted">
                        Checked against the {dataAsOf ?? "current"} snapshot
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        onClick={editManualNumber}
                        className="inline-flex items-center gap-2 rounded-full border border-rule-strong px-4 py-2 text-[12px] font-medium transition-colors hover:border-ink"
                      >
                        Edit number
                      </button>
                      <button
                        type="button"
                        onClick={switchToPhoto}
                        className="inline-flex items-center gap-2 rounded-full border border-rule-strong px-4 py-2 text-[12px] font-medium transition-colors hover:border-ink"
                      >
                        <Camera className="h-3.5 w-3.5" strokeWidth={1.8} />
                        Use a photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col p-6">
                    <div className="mx-auto w-full max-w-sm">
                      <p className="eyebrow text-clinical">Manual check</p>
                      <h2 className="mt-3 font-display text-2xl">
                        Type the number.
                      </h2>
                      <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">
                        Use exactly what is printed after &ldquo;NAFDAC Reg.
                        No&rdquo; or &ldquo;NRN&rdquo;. Keep the dash.
                      </p>

                      <form onSubmit={handleManualSubmit} className="mt-7">
                        <label
                          htmlFor="reg-no"
                          className="eyebrow text-muted"
                        >
                          Registration number
                        </label>
                        <input
                          id="reg-no"
                          name="reg-no"
                          value={manualValue}
                          onChange={(event) => {
                            setManualValue(event.target.value);
                            if (manualError) setManualError(null);
                          }}
                          placeholder="04-1928"
                          autoComplete="off"
                          autoCapitalize="characters"
                          spellCheck={false}
                          aria-invalid={Boolean(manualError)}
                          aria-describedby={
                            manualError ? "reg-no-error" : "reg-no-hint"
                          }
                          className="mt-2 w-full border-b border-rule-strong bg-transparent pb-2 mono text-[1.7rem] uppercase tracking-[0.04em] outline-none transition-colors placeholder:text-muted/35 focus:border-ink"
                        />

                        {manualError ? (
                          <p
                            id="reg-no-error"
                            role="alert"
                            className="mt-2 text-[11px] leading-relaxed text-alert"
                          >
                            {manualError}
                          </p>
                        ) : (
                          <p
                            id="reg-no-hint"
                            className="mt-2 mono text-[10px] text-muted"
                          >
                            04-1928 · A4-100160 · A11-101377
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={!manualValue.trim() || loading}
                          className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-[12.5px] font-medium text-paper transition-colors hover:bg-clinical disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {loading ? "Checking…" : "Check this number"}
                        </button>
                      </form>

                      <p className="mt-5 text-[11px] leading-relaxed text-muted">
                        Only the number is checked. No photo is read, so batch
                        and expiry stay unknown.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={switchToPhoto}
                      className="mx-auto mt-auto inline-flex items-center gap-2 pt-6 text-[11.5px] text-muted transition-colors hover:text-ink"
                    >
                      <Camera className="h-3.5 w-3.5" strokeWidth={1.8} />
                      Use a photo instead
                    </button>
                  </div>
                )
              ) : preview ? (
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
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) handleFile(file);
                          event.currentTarget.value = "";
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
                        <span className="text-[12px] font-medium">
                          Product name
                        </span>
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
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) handleFile(file);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => switchToManual()}
                    className="mx-auto -mt-2 inline-flex items-center gap-2 text-[11.5px] text-muted transition-colors hover:text-ink"
                  >
                    <Keyboard className="h-3.5 w-3.5" strokeWidth={1.8} />
                    Worn print? Type the number instead
                  </button>
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
                    Upload a photo or type the registration number. The fields
                    and the verdict appear here — nothing is inferred.
                  </p>
                </div>
              )}

              {loading && (
                <div className="px-6 py-10">
                  <p className="eyebrow text-clinical-bright">
                    {mode === "manual" ? "Checking the number" : "Reading the pack"}
                  </p>
                  <div className="mt-7 space-y-4">
                    {(mode === "manual"
                      ? ["Normalising the number", "Looking up the register", "Reading the entry"]
                      : [
                          "Locating printed fields",
                          "Reading the registration number",
                          "Checking the Greenbook",
                        ]
                    ).map((line, i) => (
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
                    {mode === "manual"
                      ? "This is a local lookup — no photo is read."
                      : "This can take a few seconds."}
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
                        The check failed
                      </p>
                      <p className="mt-1.5 text-[12px] leading-relaxed text-bone-dim">
                        {error}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {mode === "photo" && (
                      <button
                        type="button"
                        onClick={reset}
                        className="inline-flex items-center gap-2 rounded-full border border-rule-film px-4 py-2 text-[12px] text-bone transition-colors hover:border-bone/40"
                      >
                        <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.8} />
                        Try another photo
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => switchToManual()}
                      className="inline-flex items-center gap-2 rounded-full border border-rule-film px-4 py-2 text-[12px] text-bone transition-colors hover:border-bone/40"
                    >
                      <Keyboard className="h-3.5 w-3.5" strokeWidth={1.8} />
                      Enter the number
                    </button>
                  </div>
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

                  {/* what to do next */}
                  <div className="border-b border-rule-film px-6 py-5">
                    <p className="eyebrow text-bone-dim">What to do next</p>
                    <p className="mt-2 font-display text-[1.25rem] leading-tight text-bone">
                      {NEXT_STEPS[match.verdict].title}
                    </p>
                    <p className="mt-2 max-w-md text-[12px] leading-relaxed text-bone-dim">
                      {NEXT_STEPS[match.verdict].copy}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {NEXT_STEPS[match.verdict].manual && (
                        <button
                          type="button"
                          onClick={() => switchToManual()}
                          className="inline-flex items-center gap-2 rounded-full bg-bone px-4 py-2 text-[12px] font-medium text-film transition-colors hover:bg-clinical-bright"
                        >
                          <Keyboard className="h-3.5 w-3.5" strokeWidth={1.8} />
                          Enter the number
                        </button>
                      )}

                      {NEXT_STEPS[match.verdict].reportable && (
                        <button
                          type="button"
                          onClick={submitReport}
                          disabled={reportDone || reportState === "sending"}
                          className={clsx(
                            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-medium transition-colors",
                            reportDone
                              ? "border border-clinical-bright/40 text-clinical-bright"
                              : "bg-bone text-film hover:opacity-90"
                          )}
                        >
                          {reportDone ? (
                            <>
                              <Check className="h-3.5 w-3.5" strokeWidth={2} />
                              Reported
                            </>
                          ) : (
                            <>
                              <Flag className="h-3.5 w-3.5" strokeWidth={1.8} />
                              {reportState === "sending"
                                ? "Sending…"
                                : "Report this pack"}
                            </>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={reset}
                        className="inline-flex items-center gap-2 rounded-full border border-rule-film px-4 py-2 text-[12px] text-bone transition-colors hover:border-bone/40"
                      >
                        <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.8} />
                        Check another
                      </button>
                    </div>

                    {reportState === "unavailable" && (
                      <div className="mt-4 border border-warn-bright/30 bg-warn-bright/[0.05] px-3.5 py-3">
                        <p className="text-[11.5px] leading-relaxed text-bone-dim">
                          The reporting channel isn&apos;t connected in this
                          build, so nothing was sent. Copy the details and send
                          them to NAFDAC yourself.
                        </p>
                        <button
                          type="button"
                          onClick={copyDetails}
                          className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-bone underline decoration-rule-film underline-offset-4 hover:decoration-bone"
                        >
                          <Copy className="h-3 w-3" strokeWidth={1.8} />
                          {copied ? "Copied" : "Copy report details"}
                        </button>
                      </div>
                    )}

                    {reportDone && reported && (
                      <p className="mt-3 mono text-[9.5px] uppercase tracking-[0.12em] text-bone-dim/80">
                        Sent automatically when the number wasn&apos;t found
                      </p>
                    )}
                  </div>

                  {source === "manual" ? (
                    <div className="px-6 py-5">
                      <div className="flex items-center justify-between">
                        <p className="eyebrow text-bone-dim">Input</p>
                        <span className="mono text-[9.5px] uppercase tracking-[0.14em] text-bone-dim">
                          entered manually
                        </span>
                      </div>
                      <div className="mt-3 flex items-baseline justify-between border-y border-rule-film py-3">
                        <span className="eyebrow text-bone-dim">
                          NAFDAC reg. no.
                        </span>
                        <span className="mono text-[12px] text-bone">
                          {extraction.nafdac_reg_no.value}
                        </span>
                      </div>
                      <p className="mt-3 text-[11px] leading-relaxed text-bone-dim/80">
                        Only the registration number was checked — no photo was
                        read, so batch and expiry are unknown.
                      </p>
                    </div>
                  ) : (
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
                              <dt className="eyebrow shrink-0 text-bone-dim">
                                {label}
                              </dt>
                              <dd className="min-w-0 text-right">
                                <div
                                  className={clsx(
                                    "mono text-[11.5px] leading-snug",
                                    field.value &&
                                      field.confidence !== "not_visible"
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
                  )}
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
