import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f3eee4",
          color: "#1c1712",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 4 }}>BORDERMATH</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, lineHeight: 1 }}>Never overstay.</div>
          <div style={{ marginTop: 16, fontSize: 32, color: "#5f564b" }}>Visa-day math for nomads. 90 days in any 180.</div>
        </div>
      </div>
    ),
    size,
  );
}
