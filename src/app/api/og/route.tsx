import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") || "Presenter";
  const subtitle = searchParams.get("subtitle") || "";
  const type = searchParams.get("type") || "";
  const author = searchParams.get("author") || "Presenter";
  const customer = searchParams.get("customer") || "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 80px",
          background: "linear-gradient(135deg, #0A0718 0%, #1a1035 40%, #0f0d2a 100%)",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* Gradient bar at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #22d3ee, #6366f1, #a855f7, #ec4899)",
          }}
        />

        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: "-200px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-50px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)",
          }}
        />

        {/* Top row: badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {type && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "14px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: type === "scroll" ? "#a855f7" : "#22d3ee",
                background:
                  type === "scroll"
                    ? "rgba(168,85,247,0.12)"
                    : "rgba(34,211,238,0.12)",
                border: `1px solid ${type === "scroll" ? "rgba(168,85,247,0.25)" : "rgba(34,211,238,0.25)"}`,
                padding: "6px 16px",
                borderRadius: "20px",
              }}
            >
              {type === "scroll" ? "Scroll" : "Slides"}
            </div>
          )}
          {customer && (
            <div
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "rgba(255,255,255,0.5)",
                background: "rgba(255,255,255,0.06)",
                padding: "6px 16px",
                borderRadius: "20px",
              }}
            >
              {customer}
            </div>
          )}
        </div>

        {/* Center: title + subtitle */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: title.length > 40 ? "48px" : "56px",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              maxWidth: "900px",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: "24px",
                fontWeight: 400,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.4,
                maxWidth: "800px",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {/* Bottom: author + brand mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: "16px",
              fontWeight: 500,
              color: "rgba(255,255,255,0.4)",
            }}
          >
            {author}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                fontSize: "18px",
                fontWeight: 700,
                background: "linear-gradient(90deg, #22d3ee, #6366f1, #a855f7)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              scale
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "rgba(255,255,255,0.3)",
              }}
            >
              presentations
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
