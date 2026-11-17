import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rx-Ray — NAFDAC medicine checker",
    short_name: "Rx-Ray",
    description:
      "Check a medicine pack against NAFDAC's Greenbook. See what's verified, what isn't, and what to do next.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f0e7",
    theme_color: "#0b0c0a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
