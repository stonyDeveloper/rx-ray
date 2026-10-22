import type { Metadata } from "next";
import { Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";
import MotionProvider from "@/components/MotionProvider";
import SmoothScroll from "@/components/SmoothScroll";
import ScrollProgress from "@/components/ScrollProgress";
import "./globals.css";

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rx-Ray — See through every pack",
  description:
    "Photograph a medicine pack. Rx-Ray reads the label and checks it against NAFDAC's Greenbook — then tells you exactly what it could verify, and what it couldn't.",
  openGraph: {
    title: "Rx-Ray — See through every pack",
    description:
      "A NAFDAC Greenbook checker for medicine packs in Nigeria. Registered, unreadable, or not in the register — never a bare 'fake' badge.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${instrument.variable} ${inter.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <MotionProvider>
          <SmoothScroll />
          <ScrollProgress />
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}
