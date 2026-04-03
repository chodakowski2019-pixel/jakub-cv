"use client";

import { useState } from "react";

const CONTENT = {
  pl: {
    nav: { about: "O mnie", experience: "Doświadczenie", skills: "Umiejętności", projects: "Projekty", contact: "Kontakt" },
    hero: {
      greeting: "Cześć, jestem",
      name: "Jakub Chodakowski",
      headline: "Wdrażam AI w Twojej firmie",
      sub: "Twoi pracownicy tracą godziny na powtarzalne zadania. Ja pokazuję, jak AI może to robić za nich — szybciej, taniej i bez błędów.",
      cta: "Porozmawiajmy",
      cv: "Pobierz CV",
    },
    about: {
      title: "O mnie",
      text: "Nie jestem kolejnym \"ekspertem od AI\", który mówi ogólnikami. Buduję konkretne rozwiązania, które działają. Chatboty, które odpowiadają klientom 24/7. Automatyzacje, które oszczędzają 20+ godzin tygodniowo. Narzędzia AI dopasowane do Twojego biznesu — nie gotowce z internetu, tylko systemy szyte na miarę. Mówię prostym językiem, rozumiem biznes i dostarczam wyniki.",
    },
    experience: {
      title: "Doświadczenie",
      items: [
        {
          role: "Founder & Specjalista AI",
          company: "Własna działalność",
          period: "2024 — teraz",
          points: [
            "Wdrożenia AI dla firm — od jednoosobowych po zespoły 50+ osób",
            "Automatyzacja procesów, które wcześniej zajmowały godziny (teraz minuty)",
            "Budowa aplikacji webowych i mobilnych opartych o AI",
          ],
        },
        {
          role: "Przykładowe stanowisko",
          company: "Nazwa firmy",
          period: "2022 — 2024",
          points: [
            "Opis odpowiedzialności i osiągnięć",
            "Kolejny punkt do uzupełnienia",
            "Jeszcze jeden punkt",
          ],
        },
      ],
    },
    skills: {
      title: "Co potrafię",
      categories: [
        {
          name: "AI & Automatyzacja",
          items: ["ChatGPT / Claude API", "AI Agenci", "Automatyzacja procesów", "Prompt Engineering", "Bazy wiedzy AI (RAG)"],
        },
        {
          name: "Budowa aplikacji",
          items: ["Next.js / React", "TypeScript", "Python", "Bazy danych (Supabase)", "Hosting i deploy"],
        },
        {
          name: "Biznes",
          items: ["Strategia wdrożenia AI", "Analiza procesów", "Zarządzanie projektami", "Sprzedaż B2B", "Marketing i growth"],
        },
      ],
    },
    projects: {
      title: "Co zbudowałem",
      items: [
        {
          name: "Slam5",
          desc: "Aplikacja do zadań z grywalizacją. Planujesz 5 rzeczy na dzień i walczysz o wygraną. Działa jak gra, ale organizuje Ci życie.",
          tech: "Next.js, Supabase, Stripe, AI",
          url: "https://slam5.com",
        },
        {
          name: "Przykładowy projekt",
          desc: "Opis projektu — co robi, jaki problem rozwiązuje",
          tech: "Stack technologiczny",
          url: "#",
        },
        {
          name: "Kolejny projekt",
          desc: "Opis projektu — co robi, jaki problem rozwiązuje",
          tech: "Stack technologiczny",
          url: "#",
        },
      ],
    },
    contact: {
      title: "Pogadajmy",
      text: "Masz firmę i czujesz, że AI mogłoby Ci pomóc — ale nie wiesz od czego zacząć? Napisz. Pierwsza rozmowa nic nie kosztuje.",
      email: "chodakowski2019@gmail.com",
      linkedin: "LinkedIn",
    },
    footer: "Jakub Chodakowski",
  },
  en: {
    nav: { about: "About", experience: "Experience", skills: "Skills", projects: "Projects", contact: "Contact" },
    hero: {
      greeting: "Hi, I'm",
      name: "Jakub Chodakowski",
      headline: "I bring AI into your company",
      sub: "Your team wastes hours on repetitive tasks. I show you how AI can do it for them — faster, cheaper, and with zero mistakes.",
      cta: "Let's talk",
      cv: "Download CV",
    },
    about: {
      title: "About me",
      text: "I'm not another \"AI expert\" who speaks in buzzwords. I build real solutions that work. Chatbots that talk to your customers 24/7. Automations that save 20+ hours a week. AI tools built for your business — not cookie-cutter templates, but custom systems. I speak plain language, I understand business, and I deliver results.",
    },
    experience: {
      title: "Experience",
      items: [
        {
          role: "Founder & AI Specialist",
          company: "Self-employed",
          period: "2024 — present",
          points: [
            "AI implementations for companies — from solo founders to 50+ person teams",
            "Automating processes that used to take hours (now takes minutes)",
            "Building web and mobile apps powered by AI",
          ],
        },
        {
          role: "Example Position",
          company: "Company Name",
          period: "2022 — 2024",
          points: [
            "Description of responsibilities and achievements",
            "Another point to fill in",
            "One more point",
          ],
        },
      ],
    },
    skills: {
      title: "What I do",
      categories: [
        {
          name: "AI & Automation",
          items: ["ChatGPT / Claude API", "AI Agents", "Process Automation", "Prompt Engineering", "AI Knowledge Bases (RAG)"],
        },
        {
          name: "Building apps",
          items: ["Next.js / React", "TypeScript", "Python", "Databases (Supabase)", "Hosting & Deploy"],
        },
        {
          name: "Business",
          items: ["AI Implementation Strategy", "Process Analysis", "Project Management", "B2B Sales", "Marketing & Growth"],
        },
      ],
    },
    projects: {
      title: "What I've built",
      items: [
        {
          name: "Slam5",
          desc: "A task app with gamification. You pick 5 things a day and fight to win. Works like a game, but organizes your life.",
          tech: "Next.js, Supabase, Stripe, AI",
          url: "https://slam5.com",
        },
        {
          name: "Example Project",
          desc: "Project description — what it does, what problem it solves",
          tech: "Tech stack",
          url: "#",
        },
        {
          name: "Another Project",
          desc: "Project description — what it does, what problem it solves",
          tech: "Tech stack",
          url: "#",
        },
      ],
    },
    contact: {
      title: "Let's talk",
      text: "You have a business and feel like AI could help — but you don't know where to start? Write me. First call is free.",
      email: "chodakowski2019@gmail.com",
      linkedin: "LinkedIn",
    },
    footer: "Jakub Chodakowski",
  },
};

type Lang = "pl" | "en";

export default function Home() {
  const [lang, setLang] = useState<Lang>("pl");
  const t = CONTENT[lang];

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-14">
          <span className="text-sm font-semibold tracking-tight">JC</span>
          <div className="hidden md:flex items-center gap-6">
            {(["about", "experience", "skills", "projects", "contact"] as const).map((key) => (
              <a
                key={key}
                href={`#${key}`}
                className="text-xs text-neutral-400 hover:text-white transition-colors"
              >
                {t.nav[key]}
              </a>
            ))}
          </div>
          <button
            onClick={() => setLang(lang === "pl" ? "en" : "pl")}
            className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-neutral-400 hover:text-white hover:border-white/20 transition-all flex items-center gap-1.5"
          >
            <span className="text-sm">{lang === "pl" ? "🇬🇧" : "🇵🇱"}</span>
            {lang === "pl" ? "EN" : "PL"}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-14">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-6">
            <img
              src="https://media.licdn.com/dms/image/v2/D4D03AQFWaMpQd3x-_Q/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1726162788974?e=1776902400&v=beta&t=hqAVAM6AfC-sl9Bre2Rk5VxgFHIUy37-5vsZgFtAc4A"
              alt="Jakub Chodakowski"
              className="w-28 h-28 rounded-full mx-auto ring-2 ring-white/10 object-cover"
            />
          </div>
          <p className="text-sm text-neutral-500 mb-2">{t.hero.greeting}</p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">
            {t.hero.name}
          </h1>
          <p className="text-xl md:text-2xl text-indigo-400 font-medium mb-6">
            {t.hero.headline}
          </p>
          <p className="text-neutral-400 max-w-xl mx-auto mb-10 leading-relaxed">
            {t.hero.sub}
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="#contact"
              className="px-6 py-3 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {t.hero.cta}
            </a>
            <a
              href="/cv.pdf"
              className="px-6 py-3 rounded-full border border-white/10 text-neutral-300 hover:text-white hover:border-white/20 text-sm font-medium transition-all"
            >
              {t.hero.cv}
            </a>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">{t.about.title}</h2>
          <p className="text-neutral-400 leading-relaxed text-lg">
            {t.about.text}
          </p>
        </div>
      </section>

      {/* Experience */}
      <section id="experience" className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-12">{t.experience.title}</h2>
          <div className="space-y-12">
            {t.experience.items.map((item, i) => (
              <div key={i} className="relative pl-8 border-l border-white/10">
                <div className="absolute left-0 top-1 w-2 h-2 rounded-full bg-indigo-500 -translate-x-[5px]" />
                <div className="flex flex-col md:flex-row md:items-baseline md:gap-4 mb-3">
                  <h3 className="text-lg font-semibold">{item.role}</h3>
                  <span className="text-sm text-indigo-400">{item.company}</span>
                  <span className="text-xs text-neutral-500 md:ml-auto">{item.period}</span>
                </div>
                <ul className="space-y-2">
                  {item.points.map((point, j) => (
                    <li key={j} className="text-neutral-400 text-sm flex gap-2">
                      <span className="text-indigo-500 mt-1 flex-shrink-0">-</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills */}
      <section id="skills" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-12">{t.skills.title}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {t.skills.categories.map((cat, i) => (
              <div key={i}>
                <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-4">
                  {cat.name}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {cat.items.map((skill, j) => (
                    <span
                      key={j}
                      className="px-3 py-1.5 rounded-full text-xs border border-white/10 text-neutral-300 hover:border-indigo-500/30 hover:text-white transition-all"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-12">{t.projects.title}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {t.projects.items.map((project, i) => (
              <a
                key={i}
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-6 rounded-2xl border border-white/5 hover:border-indigo-500/20 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300"
              >
                <h3 className="font-semibold mb-2 group-hover:text-indigo-400 transition-colors">
                  {project.name}
                </h3>
                <p className="text-sm text-neutral-400 mb-4 leading-relaxed">
                  {project.desc}
                </p>
                <span className="text-xs text-neutral-500 font-mono">
                  {project.tech}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">{t.contact.title}</h2>
          <p className="text-neutral-400 mb-10">{t.contact.text}</p>
          <div className="flex items-center justify-center gap-4">
            <a
              href={`mailto:${t.contact.email}`}
              className="px-6 py-3 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {t.contact.email}
            </a>
            <a
              href="https://www.linkedin.com/in/jakub-chodakowski"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full border border-white/10 text-neutral-300 hover:text-white hover:border-white/20 text-sm font-medium transition-all"
            >
              {t.contact.linkedin}
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-neutral-500">
          <span>{t.footer} &copy; {new Date().getFullYear()}</span>
          <span>jakubchodakowski.com</span>
        </div>
      </footer>
    </div>
  );
}
