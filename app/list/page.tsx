import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "List motywacyjny — Jakub Chodakowski",
};

export default function ListPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap');

        @page {
          size: A4;
          margin: 0;
        }

        html, body {
          margin: 0;
          padding: 0;
          background: #ede5d3;
          font-family: 'Inter', -apple-system, sans-serif;
          color: #1a1410;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .page {
          width: 210mm;
          min-height: 297mm;
          padding: 18mm 20mm;
          margin: 0 auto;
          background: #ede5d3;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }

        .serif {
          font-family: 'Playfair Display', Georgia, serif;
        }

        .label {
          font-size: 9px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #8b7d65;
          font-weight: 500;
        }

        .accent {
          color: #b04a2c;
        }

        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #b04a2c;
          display: inline-block;
          margin-right: 7px;
          vertical-align: middle;
        }

        .divider {
          height: 1px;
          background: #1a1410;
          opacity: 0.12;
          margin: 14px 0;
        }

        .avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #1a1410;
          color: #f0ebe1;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .pill {
          background: #1a1410;
          border-radius: 999px;
          padding: 18px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
      `}</style>

      <div className="page">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div className="avatar">JC</div>
            <div>
              <p className="serif" style={{ margin: 0, fontSize: "20px", fontWeight: 600, letterSpacing: "-0.01em" }}>
                Jakub Chodakowski
              </p>
              <p className="label" style={{ margin: "3px 0 0 0" }}>
                Kandydatura · AI Lab
              </p>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p className="label" style={{ margin: 0 }}>List motywacyjny</p>
            <p style={{ margin: "3px 0 0 0", fontSize: "11px", color: "#5a4f3d" }}>
              Miami, 12 maja 2026
            </p>
            <p style={{ margin: "8px 0 0 0", fontSize: "10px", color: "#5a4f3d", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
              <span className="dot" />
              Do uprzejmego rozpatrzenia
            </p>
          </div>
        </div>

        <div className="divider" />

        {/* Section label */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "28px" }}>
          <span style={{ width: "24px", height: "1px", background: "#1a1410", opacity: 0.4 }} />
          <span className="label">Nauczyciel AI Lab</span>
        </div>

        {/* Headline */}
        <h1
          className="serif"
          style={{
            fontSize: "56px",
            fontWeight: 600,
            lineHeight: "1.05",
            letterSpacing: "-0.025em",
            margin: "16px 0 36px 0",
            maxWidth: "85%",
          }}
        >
          Zamiast CV{" "}
          <span style={{ color: "#5a4f3d" }}>—</span>{" "}
          <em className="accent" style={{ fontWeight: 500 }}>strona</em> z moją kandydaturą.
        </h1>

        {/* Two-column content */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "32px", marginBottom: "32px" }}>
          <div>
            <p className="label" style={{ margin: 0 }}>Wiadomość</p>
            <p className="serif" style={{ margin: "4px 0 0 0", fontSize: "16px", color: "#5a4f3d" }}>01</p>
          </div>
          <div style={{ fontSize: "13px", lineHeight: "1.7", color: "#2a2218" }}>
            <p className="serif" style={{ margin: "0 0 14px 0", fontStyle: "italic", fontSize: "15px" }}>
              Szanowni Państwo,
            </p>
            <p style={{ margin: 0 }}>
              zamiast standardowego CV przygotowałem dla Państwa{" "}
              <strong>dedykowaną stronę</strong> z moją kandydaturą na rolę nauczyciela AI Lab:
            </p>
          </div>
        </div>

        {/* Pill with URL — whole pill is a link */}
        <a
          href="https://www.jakubchodakowski.com/aivola"
          target="_blank"
          rel="noopener noreferrer"
          className="pill"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div>
            <p style={{ margin: 0, fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#a89e87", fontWeight: 500 }}>
              Moja kandydatura · Online
            </p>
            <p className="serif" style={{ margin: "4px 0 0 0", fontSize: "22px", color: "#f0ebe1", fontWeight: 500, letterSpacing: "-0.01em" }}>
              www.jakubchodakowski.com<span className="accent">/aivola</span>
            </p>
          </div>
          <span style={{ color: "#f0ebe1", fontSize: "12px", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
            Otwórz stronę ↗
          </span>
        </a>

        {/* Bullets */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "32px", marginTop: "36px" }}>
          <div>
            <p className="label" style={{ margin: 0 }}>Znajdą tam Państwo</p>
            <p className="serif" style={{ margin: "4px 0 0 0", fontSize: "16px", color: "#5a4f3d" }}>02</p>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "13px", lineHeight: "1.6", color: "#2a2218" }}>
            {[
              "Doświadczenie w szkoleniu nauczycieli z AI",
              "Certyfikat AI for Managers (Maria Parysz)",
              "Koncepcję prowadzenia zajęć AI Lab z dziećmi 9+",
              "Wystąpienia publiczne i dotychczasowe projekty AI dla nauczycieli",
            ].map((item, i) => (
              <li key={i} style={{ display: "flex", gap: "14px", padding: "9px 0", borderBottom: i < 3 ? "1px solid rgba(26,20,16,0.08)" : "none" }}>
                <span className="accent" style={{ flexShrink: 0 }}>—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Closing message */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "32px", marginTop: "28px" }}>
          <div />
          <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.6", color: "#2a2218" }}>
            Z przyjemnością porozmawiam o szczegółach podczas pierwszej rozmowy.
          </p>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1, minHeight: "20px" }} />

        <div className="divider" />

        {/* Signature footer */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "16px" }}>
          <div>
            <p style={{ margin: 0, fontSize: "11px", color: "#5a4f3d" }}>Z poważaniem,</p>
            <p className="serif" style={{ margin: "10px 0 0 0", fontSize: "26px", fontStyle: "italic", fontWeight: 500 }}>
              Jakub Chodakowski
            </p>
            <p className="label" style={{ margin: "4px 0 0 0" }}>Kandydat · AI Lab</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: "10px", color: "#5a4f3d" }}>
              <span className="label" style={{ marginRight: "6px" }}>Web</span>
              jakubchodakowski.com/aivola
            </p>
            <p className="label" style={{ margin: "8px 0 0 0" }}>List · 1/1</p>
          </div>
        </div>
      </div>
    </>
  );
}
