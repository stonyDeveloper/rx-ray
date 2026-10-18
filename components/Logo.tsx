import clsx from "clsx";

export default function Logo({
  className = "",
  tone = "ink",
}: {
  className?: string;
  tone?: "ink" | "bone";
}) {
  return (
    <span
      className={clsx(
        "font-display text-[1.65rem] leading-none tracking-[-0.01em]",
        tone === "bone" ? "text-bone" : "text-ink",
        className
      )}
    >
      Rx<span className="text-clinical">–</span>Ray
    </span>
  );
}
