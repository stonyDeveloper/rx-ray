"use client";

import { useEffect, useRef, useState } from "react";
import { X, Camera as CameraIcon } from "lucide-react";

export default function CameraCapture({
  onCapture,
  onClose,
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setReady(true);
      } catch (err) {
        setError(
          err instanceof Error && err.name === "NotAllowedError"
            ? "Camera access was denied. Allow it in your browser, or use Upload instead."
            : "Couldn't reach a camera on this device. Use Upload instead."
        );
      }
    }

    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function handleClose() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    onClose();
  }

  function capture() {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `pack-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        streamRef.current?.getTracks().forEach((track) => track.stop());
        onCapture(file);
      },
      "image/jpeg",
      0.92
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Take a photo of the pack"
      className="fixed inset-0 z-[80] flex flex-col bg-film/97 text-bone backdrop-blur-sm"
    >
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="eyebrow text-bone-dim">Camera</p>
          <p className="mt-1 text-[13px]">Put the NAFDAC number in frame</p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-rule-film text-bone-dim transition-colors hover:border-bone/40 hover:text-bone"
          aria-label="Close camera"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pb-2">
        {error ? (
          <div className="max-w-sm border border-alert-bright/40 bg-alert-bright/[0.06] px-4 py-3 text-center text-[12.5px] text-alert-bright">
            {error}
          </div>
        ) : (
          <div className="relative w-full max-w-2xl">
            <video
              ref={videoRef}
              playsInline
              muted
              className="max-h-[68vh] w-full border border-rule-film object-contain"
            />
            <span className="corner corner-tl text-clinical-bright/70" />
            <span className="corner corner-tr text-clinical-bright/70" />
            <span className="corner corner-bl text-clinical-bright/70" />
            <span className="corner corner-br text-clinical-bright/70" />
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-clinical-bright/25" />
            <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center mono text-[9.5px] uppercase tracking-[0.2em] text-bone/60">
              Fill the frame · avoid glare
            </p>
          </div>
        )}
      </div>

      {!error && (
        <div className="flex flex-col items-center gap-3 py-7">
          <button
            type="button"
            onClick={capture}
            disabled={!ready}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-bone text-film transition-opacity hover:opacity-90 disabled:opacity-40"
            aria-label="Capture photo"
          >
            <CameraIcon className="h-6 w-6" strokeWidth={2} />
          </button>
          <span className="mono text-[9px] uppercase tracking-[0.18em] text-bone-dim">
            {ready ? "Tap to capture" : "Starting camera…"}
          </span>
        </div>
      )}
    </div>
  );
}
