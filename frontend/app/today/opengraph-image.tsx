import { ImageResponse } from "next/og";
import dogs from "../../data/dogs.json";
import { animalOfTheDay } from "@/lib/animalOfTheDay";

export const runtime = "nodejs";
export const alt = "Today's kennel introduction";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TodayOpenGraphImage() {
  const dog = animalOfTheDay(dogs);
  const name = dog?.name ?? "a waiting animal";
  const breed = dog?.breed ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "#ecfdf5",
          color: "#0f172a",
        }}
      >
        <div style={{ display: "flex", fontSize: 22, fontWeight: 600, color: "#047857" }}>
          TODAY&apos;S INTRODUCTION
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 16,
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          {`Meet ${name}`}
        </div>
        <div style={{ display: "flex", marginTop: 20, fontSize: 28, color: "#475569" }}>
          {breed
            ? `${breed} · Send this page. That is how a home shows up.`
            : "Send this page. That is how a home shows up."}
        </div>
      </div>
    ),
    { ...size },
  );
}
