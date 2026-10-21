import { ChevronDown } from "lucide-react";

// Wersja strony głównej pod sprzedaż + AI (5.10, lokalnie, bez deployu).
// Styl 1:1 ze strony głównej, treść przepisana: Jakub = sprzedaż i AI.
const t = {
  nav: { story: "Story", bruno: "Bruno AI", contact: "Contact" },
  hero: {
    greeting: "Hi, I'm",
    name: "Jakub Chodakowski",
    headline: "I help sales teams close more deals with AI",
    sub: "Most deals are lost in the conversation, not in the product. I bring AI into your sales process so your reps practice more, prepare faster and follow up every time.",
    cta: "Let's talk",
    scroll: "Read my story",
  },
  before: {
    label: "Sales first",
    period: "2018 to November 2022",
    title: "I learned to sell",
    paragraphs: [
      "I started in startups. I did a bit of everything, but sales was always at the center. Cold calls, demos, follow-ups, closing.",
      "I ran my own company. I sold to B2B clients, negotiated contracts and built sales funnels from zero.",
      "I learned one thing the hard way. Deals are won or lost on the call. And most reps never get to practice that call before it counts.",
    ],
    skills: ["B2B Sales", "Cold Calling", "Negotiation", "Sales Funnels", "Own Business"],
  },
  turning: {
    date: "November 30, 2022",
    title: "ChatGPT launches",
    text: "That day I saw what it meant for sales. A machine that can talk. That can play a customer. That can coach a rep after every call. I knew I had to build it.",
  },
  after: {
    label: "Sales + AI",
    period: "December 2022 to now",
    title: "New rules for sales",
    paragraphs: [
      "From day one I started building with AI. Not reading about it. Building. Testing. Shipping.",
      "I built AI agents that answer leads 24/7, automations that run outreach and follow-ups, and tools that keep the CRM up to date without anyone typing.",
      "Today I put both sides together. I know how a sales call feels, because I have made thousands of them. And I know how to build the AI that makes the next one better.",
    ],
    skills: ["AI Sales Roleplay", "AI Agents", "Outreach Automation", "CRM Automation", "Voice AI", "ChatGPT / Claude Code", "Next.js / React", "TypeScript"],
    milestones: [
      { date: "May 2024", text: "AI Manager course with Maria Parysz, who led AI projects at Rolls-Royce and Sephora." },
      { date: "August 2024", text: "Talk at CRASH Mondays: how to use AI and data in modern sales. Real cases from Żabka and Netflix." },
      { date: "March 2026", text: "Launched an AI agent on Instagram that handles DM conversations with leads on its own." },
      { date: "September 2026", text: "Built Bruno AI, a voice sparring partner that trains sales reps on live calls with an AI customer." },
    ],
  },
  bruno: {
    label: "What I'm building",
    title: "Bruno AI",
    sub: "Your reps practice on an AI customer before they call a real one.",
    points: [
      { title: "Live voice calls", text: "Bruno plays your customer on a real call. He pushes back, asks for numbers and tries to end the call early." },
      { title: "3 levels", text: "Easy, normal and tough. Reps start friendly and work up to the customer who says no to everything." },
      { title: "Score after every call", text: "A coach grades the call on one clear rubric and shows what to fix next time." },
      { title: "Daily practice", text: "Mistakes from each call turn into short drills. Bruno brings them back until the skill sticks." },
    ],
    cta: "Get access",
  },
  now: {
    title: "What I do now",
    text: "I help sales teams use AI where it moves revenue. Not theory. Not slides. Tools your reps use on real deals from week one.",
    points: [
      "Sales process audit. I find where deals leak and where AI helps most",
      "AI tools for your team: lead research, outreach, follow-ups, CRM updates",
      "Daily call practice with Bruno AI, so reps train before they talk to customers",
      "Training for managers and reps to use AI on every deal",
    ],
  },
  skills: {
    title: "Tools",
    categories: [
      { name: "Sales", items: ["B2B Sales", "Cold Calling", "Negotiation", "Objection Handling", "Sales Funnels"] },
      { name: "AI for Sales", items: ["AI Sales Roleplay", "AI Agents", "Outreach Automation", "CRM Automation", "Call Analysis"] },
      { name: "Building", items: ["ChatGPT / Claude Code", "Voice AI", "Next.js / React", "TypeScript", "Supabase"] },
    ],
  },
  contact: {
    title: "Contact",
    text: "Want your sales team to close more with AI? Write to me. Let's talk about your team and your numbers.",
    email: "hello@jakubchodakowski.com",
    linkedin: "LinkedIn",
  },
  footer: "Jakub Chodakowski",
};

const karta =
  "p-5 rounded-2xl border border-white/80 bg-white/60 backdrop-blur-xl hover:bg-white/90 hover:border-cyan-600/60 transition-all duration-500 shadow-sm hover:shadow-md hover:shadow-cyan-700/12";
const przyciskGlowny =
  "px-7 py-3.5 rounded-full bg-gradient-to-r from-cyan-700 to-teal-700 text-white text-sm font-medium transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-cyan-700/30 hover:shadow-cyan-700/35";

function Era({ label, period, accent }: { label: string; period: string; accent?: boolean }) {
  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <div className={`h-px flex-1 bg-gradient-to-r from-transparent ${accent ? "to-cyan-600/50" : "to-slate-300"}`} />
        <span className={`text-sm font-mono uppercase tracking-widest font-medium ${accent ? "text-cyan-700" : "text-slate-500"}`}>{label}</span>
        <div className={`h-px flex-1 bg-gradient-to-l from-transparent ${accent ? "to-cyan-600/50" : "to-slate-300"}`} />
      </div>
      <p className={`text-center text-sm font-mono mb-6 ${accent ? "text-cyan-700/80" : "text-slate-500"}`}>{period}</p>
    </>
  );
}

export default function SalesAi() {
  return (
    <div className="min-h-screen text-slate-900" style={{ background: "#ffffff" }}>
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden bg-white">
        <div className="absolute -top-40 -left-32 w-[680px] h-[680px] rounded-full blur-[130px] opacity-70"
          style={{ background: "radial-gradient(closest-side, #a5f3fc, transparent)" }} />
        <div className="absolute top-1/3 -right-40 w-[620px] h-[620px] rounded-full blur-[130px] opacity-60"
          style={{ background: "radial-gradient(closest-side, #99f6e4, transparent)" }} />
        <div className="absolute bottom-0 left-1/4 w-[700px] h-[560px] rounded-full blur-[140px] opacity-50"
          style={{ background: "radial-gradient(closest-side, #bae6fd, transparent)" }} />
      </div>
      <style>{`
        @keyframes pulse-line { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .animate-bounce, .ruch { animation: none !important; } }
      `}</style>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/70 bg-white/70 backdrop-blur-2xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-14">
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600 to-teal-600 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-cyan-700/20">JC</span>
          <div className="hidden md:flex items-center gap-1 p-1 rounded-full border border-white/80 bg-white/65 backdrop-blur-xl">
            {(["story", "bruno", "contact"] as const).map((key) => (
              <a key={key} href={`#${key}`}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 px-4 py-1.5 rounded-full hover:bg-white/90 transition-all duration-300">
                {t.nav[key]}
              </a>
            ))}
          </div>
          <span className="w-8" aria-hidden="true" />
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-14 relative overflow-hidden">
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="mb-8">
            <img src="/profilowe_jakub.png" alt="Jakub Chodakowski"
              className="w-32 h-32 rounded-full mx-auto ring-2 ring-slate-200 ring-offset-4 ring-offset-white object-cover hover:ring-cyan-600/60 transition-all duration-500 shadow-xl shadow-cyan-700/12" />
          </div>
          <p className="text-sm text-slate-500 mb-3 tracking-wide uppercase">{t.hero.greeting}</p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-5 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-500 bg-clip-text text-transparent">
            {t.hero.name}
          </h1>
          <p className="text-xl md:text-2xl font-medium mb-6 bg-gradient-to-r from-cyan-700 to-teal-700 bg-clip-text text-transparent">
            {t.hero.headline}
          </p>
          <p className="text-slate-600 max-w-lg mx-auto mb-12 leading-relaxed text-base">{t.hero.sub}</p>
          <div className="flex items-center justify-center mb-10">
            <a href="#contact" className={przyciskGlowny}>{t.hero.cta}</a>
          </div>
          <a href="#story" className="inline-flex flex-col items-center gap-3 text-slate-500 hover:text-slate-900 transition-colors">
            <span className="text-sm font-medium">{t.hero.scroll}</span>
            <ChevronDown size={20} className="animate-bounce" />
          </a>
        </div>
      </section>

      {/* ===== STORY ===== */}
      <section id="story" className="relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent hidden md:block" />

        {/* --- SALES FIRST --- */}
        <div className="pt-12 pb-20 px-6 relative">
          <div className="max-w-3xl mx-auto">
            <Era label={t.before.label} period={t.before.period} />
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-10 text-center text-slate-900">{t.before.title}</h2>
            <div className="space-y-6 max-w-2xl mx-auto">
              {t.before.paragraphs.map((p, i) => (
                <p key={i} className="text-slate-600 leading-relaxed text-lg">{p}</p>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-10">
              {t.before.skills.map((s) => (
                <span key={s} className="px-3 py-1.5 rounded-lg text-xs border border-white/80 bg-white/65 backdrop-blur-md text-slate-600">{s}</span>
              ))}
            </div>
          </div>
        </div>

        {/* --- TURNING POINT --- */}
        <div className="py-16 px-6 relative">
          <div className="max-w-xl mx-auto text-center">
            <div className="flex justify-center mb-8">
              <div className="ruch w-12 h-12 rounded-full border border-cyan-600/50 bg-white/65 backdrop-blur-md flex items-center justify-center animate-[pulse-line_2s_ease-in-out_infinite] shadow-lg shadow-cyan-700/20">
                <ChevronDown size={24} className="text-cyan-700" />
              </div>
            </div>
            <p className="text-xs font-mono text-cyan-700 uppercase tracking-widest mb-3">{t.turning.date}</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-6 bg-gradient-to-r from-cyan-700 to-teal-700 bg-clip-text text-transparent">
              {t.turning.title}
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed">{t.turning.text}</p>
          </div>
        </div>

        {/* --- SALES + AI --- */}
        <div className="py-20 px-6 bg-white/55 backdrop-blur-xl border-y border-white/70 relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-200/60 rounded-full blur-[120px] pointer-events-none" />
          <div className="max-w-3xl mx-auto relative">
            <Era label={t.after.label} period={t.after.period} accent />
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-10 text-center text-slate-900">{t.after.title}</h2>
            <div className="space-y-6 max-w-2xl mx-auto">
              {t.after.paragraphs.map((p, i) => (
                <p key={i} className="text-slate-600 leading-relaxed text-lg">{p}</p>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-10">
              {t.after.skills.map((s) => (
                <span key={s} className="px-3 py-1.5 rounded-lg text-xs border border-cyan-600/50 text-cyan-700 bg-white/60 backdrop-blur-md">{s}</span>
              ))}
            </div>
            <div className="mt-12 space-y-3 max-w-2xl mx-auto">
              {t.after.milestones.map((m) => (
                <div key={m.date} className="p-5 rounded-2xl border border-white/80 bg-white/60 backdrop-blur-xl shadow-sm flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6">
                  <p className="text-xs font-mono text-cyan-700 sm:w-32 shrink-0">{m.date}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{m.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- WHAT I DO NOW --- */}
        <div className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 text-center text-slate-900">{t.now.title}</h2>
            <p className="text-slate-600 text-lg text-center max-w-2xl mx-auto mb-12 leading-relaxed">{t.now.text}</p>
            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {t.now.points.map((point, i) => (
                <div key={i} className={karta}>
                  <div className="flex items-start gap-3">
                    <span className="text-cyan-700 font-bold text-sm mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                    <p className="text-slate-700 text-sm leading-relaxed">{point}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== BRUNO AI ===== */}
      <section id="bruno" className="py-20 px-6 bg-white/55 backdrop-blur-xl border-y border-white/70 relative overflow-hidden">
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-teal-200/55 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-3xl mx-auto relative text-center">
          <p className="text-xs font-mono text-cyan-700 uppercase tracking-widest mb-3">{t.bruno.label}</p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4 bg-gradient-to-r from-cyan-700 to-teal-700 bg-clip-text text-transparent">
            {t.bruno.title}
          </h2>
          <p className="text-slate-600 text-lg max-w-xl mx-auto mb-12 leading-relaxed">{t.bruno.sub}</p>
          <div className="grid sm:grid-cols-2 gap-4 text-left mb-12">
            {t.bruno.points.map((p) => (
              <div key={p.title} className={karta}>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">{p.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
          <a href="/aisaleskontakt" className={przyciskGlowny}>{t.bruno.cta}</a>
        </div>
      </section>

      {/* ===== TOOLS ===== */}
      <section id="skills" className="py-20 px-6 relative overflow-hidden">
        <div className="max-w-3xl mx-auto relative">
          <h2 className="text-3xl font-bold mb-12 tracking-tight text-center text-slate-900">{t.skills.title}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {t.skills.categories.map((cat) => (
              <div key={cat.name} className={`${karta} p-6`}>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-5 bg-gradient-to-r from-cyan-700 to-teal-700 bg-clip-text text-transparent">{cat.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {cat.items.map((skill) => (
                    <span key={skill} className="px-3 py-1.5 rounded-lg text-xs border border-white/80 bg-white/65 text-slate-600 hover:border-cyan-600/70 hover:text-cyan-800 hover:bg-white/90 transition-all duration-300 cursor-default">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section id="contact" className="py-24 px-6 bg-white/55 backdrop-blur-xl border-t border-white/70 relative overflow-hidden">
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-200/60 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-3xl font-bold mb-4 tracking-tight text-slate-900">{t.contact.title}</h2>
          <p className="text-slate-600 mb-10 max-w-md mx-auto">{t.contact.text}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href={`mailto:${t.contact.email}`} className={przyciskGlowny}>{t.contact.email}</a>
            <a href="https://www.linkedin.com/in/jakub-chodakowski" target="_blank" rel="noopener noreferrer"
              className="px-7 py-3.5 rounded-full border border-white/80 bg-white/65 backdrop-blur-md text-slate-700 hover:text-slate-900 hover:border-cyan-600/60 hover:bg-white/90 text-sm font-medium transition-all duration-300 active:scale-[0.97]">
              {t.contact.linkedin}
            </a>
          </div>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-slate-200/70">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-slate-500">
          <span>{t.footer} &copy; {new Date().getFullYear()}</span>
          <span className="font-mono">jakubchodakowski.com</span>
        </div>
      </footer>
    </div>
  );
}
