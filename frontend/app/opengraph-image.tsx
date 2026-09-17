import { ImageResponse } from "next/og";
import { isPreviewMode } from "@/lib/siteMode";

export const runtime = "edge";
export const alt = "RescueHub";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  const preview = isPreviewMode();
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
          background: "#f8fafc",
          color: "#0f172a",
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 600, color: "#047857" }}>
          {preview ? "PRIVATE PREVIEW" : "RESCUEHUB"}
        </div>
        <div style={{ marginTop: 16, fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>
          Every second counts.
        </div>
        <div style={{ marginTop: 20, fontSize: 28, color: "#475569", maxWidth: 900 }}>
          Find a missing pet, meet an animal who needs a home, or run a legally
          honest shelter desk.
        </div>
      </div>
    ),
    { ...size },
  );
}
