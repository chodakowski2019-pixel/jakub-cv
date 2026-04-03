"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";

const CONTENT = {
  pl: {
    nav: { story: "Historia", skills: "Umiejętności", projects: "Projekty", contact: "Kontakt" },
    hero: {
      greeting: "Cześć, jestem",
      name: "Jakub Chodakowski",
      headline: "Wdrożę AI w Twojej firmie",
      sub: "Twoi pracownicy tracą godziny na powtarzalne zadania. Ja pokazuję, jak AI może to robić za nich. Szybciej, taniej i bez błędów.",
      cta: "Porozmawiajmy",
      scroll: "Poznaj moją historię",
    },
    before: {
      label: "Przed AI",
      period: "2018 – listopad 2022",
      title: "Zanim świat się zmienił",
      paragraphs: [
        "Zaczynałem w startupach. Robiłem wszystko po trochu. Sprzedaż, marketing, obsługa klienta, budowanie procesów. Uczyłem się biznesu od środka.",
        "Prowadziłem własną działalność. Pracowałem z klientami B2B. Negocjowałem kontrakty, budowałem lejki sprzedażowe, zarządzałem projektami.",
        "Wiedziałem, jak firma działa od podszewki. Ale wiele rzeczy zajmowało za dużo czasu. Powtarzalne zadania, ręczna robota, ciągłe gaszenie pożarów.",
      ],
      skills: ["Sprzedaż B2B", "Marketing", "Zarządzanie projektami", "Własna działalność", "Praca w startupach"],
    },
    turning: {
      date: "30 listopada 2022",
      title: "Premiera ChatGPT",
      text: "Tego dnia wszystko się zmieniło. Nie tylko dla mnie. Dla całego świata. Zobaczyłem przyszłość i wiedziałem, że muszę być jej częścią.",
    },
    after: {
      label: "Po AI",
      period: "grudzień 2022 – teraz",
      title: "Nowe zasady gry",
      paragraphs: [
        "Od pierwszego dnia zacząłem budować z AI. Nie czytać o nim. Budować. Testować. Wdrażać.",
        "Stworzyłem chatboty, które odpowiadają klientom 24/7. Automatyzacje, które oszczędzają firmom 20+ godzin tygodniowo. Aplikacje, które zarabiają pieniądze.",
        "Dzisiaj łączę doświadczenie biznesowe z umiejętnościami technicznymi. Rozumiem, co firma potrzebuje, bo sam to robiłem. I wiem, jak AI może to zrobić lepiej.",
      ],
      skills: ["ChatGPT / Claude API", "AI Agenci", "Automatyzacja procesów", "Prompt Engineering", "Bazy wiedzy AI (RAG)", "Next.js / React", "TypeScript", "Python"],
      cert: {
        date: "Maj 2024",
        title: "AI Manager. Kurs wdrażania AI w firmach",
        author: "Maria Parysz",
        authorDesc: "Wdrażała AI w Rolls-Royce, Sephora i innych globalnych firmach. Jedna z najlepszych specjalistek od AI na świecie.",
        image: "https://media.licdn.com/dms/image/v2/D4D22AQFYxpWaimMfTA/feedshare-shrink_2048_1536/feedshare-shrink_2048_1536/0/1718907292052?e=1776902400&v=beta&t=Mp23D4wFml6H-rAaSpho-3-J2rMuak86ez9FWA7G2Yc",
      },
      milestones: [
        { date: "Listopad 2023", text: "Wdrożenie AI w SEO. Zbudowałem stronę, zautomatyzowałem publikację artykułów i po 3 miesiącach zacząłem generować ruch organiczny. Minimum wysiłku, zero doświadczenia w SEO.", image: "https://media.licdn.com/dms/image/v2/D4D22AQG29tpWYC8qrw/feedshare-shrink_2048_1536/feedshare-shrink_2048_1536/0/1719218131585?e=1776902400&v=beta&t=FjBD2R1E7LQGfG9lXYy5Dm2dKYBhSC24jOBHtMF_oPI" },
        { date: "Sierpień 2024", text: "Prelekcja na CRASH Mondays. Temat: jak wykorzystać AI i dane w nowoczesnej sprzedaży. Przykłady firm jak Żabka i Netflix, które zrewolucjonizowały sprzedaż dzięki AI.", image: "https://media.licdn.com/dms/image/v2/D4D22AQGgY4uuKD4_Wg/feedshare-shrink_800/feedshare-shrink_800/0/1721579818961?e=1776902400&v=beta&t=nc7AvLjWta4XPXQEkne5n8VLyJNDXpOh-chq8FihyK8" },
        { date: "Listopad 2025", text: "Prelekcja jako prelegent. Nauczałem nauczycieli, jak wykorzystywać AI w codziennej pracy.", image: "https://prod-fillout-oregon-s3.s3.us-west-2.amazonaws.com/orgid-542209/flowpublicid-i6Cw5dBunXus/67d299c9-f5c0-43d9-9c4a-a82550520903-PY7fXcqHejnPSSmEpcSes2G21gE0LB3EHvtMcsKDWCILwz6wAthEeP1GLLNhvxjHDq2alxyhhFwTCrEYqnrF4TpYtTlUqiN4OgC/Screenshot-2026-04-04-at-1.45.04aAM.png" },
        { date: "Marzec 2026", text: "Wdrożenie agenta AI na Instagramie, który automatycznie obsługuje wiadomości DM" },
      ],
    },
    now: {
      title: "Co robię teraz",
      text: "Pomagam firmom wdrożyć AI. Nie teorię. Nie prezentacje PowerPoint. Konkretne narzędzia, które od pierwszego dnia oszczędzają czas i pieniądze.",
      points: [
        "Audyt procesów w Twojej firmie. Szukam miejsc, gdzie AI da największy efekt",
        "Budowa rozwiązań AI dopasowanych do Twojego biznesu",
        "Szkolenie zespołu, żeby umieli korzystać z AI na co dzień",
        "Wsparcie po wdrożeniu. Nie zostawiam Cię samego",
      ],
    },
    skills: {
      title: "Narzędzia",
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
          items: ["Strategia i wdrażanie AI", "Analiza procesów", "Zarządzanie projektami"],
        },
      ],
    },
    projects: {
      title: "Co już zbudowałem",
      items: [
        {
          name: "Slam5",
          desc: "Aplikacja do zadań z grywalizacją. Planujesz 5 rzeczy na dzień i walczysz o wygraną. Działa jak gra, ale organizuje Ci życie.",
          tech: "Next.js, Supabase, Stripe, AI",
          url: "https://slam5.com",
        },
        {
          name: "AI Tourist Guide",
          desc: "Aplikacja mobilna. Turystyczny przewodnik oparty o AI. Pokazuje co warto zobaczyć, jak dojechać i opowiada historię miejsca.",
          tech: "React Native, AI, Maps API",
          url: "#",
          image: "https://media.licdn.com/dms/image/v2/D4D22AQEoH8m1jugGNw/feedshare-shrink_2048_1536/B4DZyuh7z5GwAk-/0/1772454657569?e=1776902400&v=beta&t=flv7PbCJ8JCM-0mcLGG-lH4HQUPA8ZL7sscs8q64Mcg",
        },
        {
          name: "Kolejny projekt",
          desc: "Opis projektu. Co robi, jaki problem rozwiązuje",
          tech: "Stack technologiczny",
          url: "#",
        },
      ],
    },
    contact: {
      title: "Twoja kolej",
      text: "Masz firmę i czujesz, że AI mogłoby Ci pomóc, ale nie wiesz od czego zacząć? Napisz. Pierwsza rozmowa nic nie kosztuje.",
      email: "chodakowski2019@gmail.com",
      linkedin: "LinkedIn",
    },
    footer: "Jakub Chodakowski",
  },
  en: {
    nav: { story: "Story", skills: "Skills", projects: "Projects", contact: "Contact" },
    hero: {
      greeting: "Hi, I'm",
      name: "Jakub Chodakowski",
      headline: "I'll implement AI in your company",
      sub: "Your team wastes hours on repetitive tasks. I show you how AI can do it for them. Faster, cheaper, and with zero mistakes.",
      cta: "Let's talk",
      scroll: "Read my story",
    },
    before: {
      label: "Before AI",
      period: "2018 – November 2022",
      title: "Before the world changed",
      paragraphs: [
        "I started in startups. I did a bit of everything. Sales, marketing, customer service, building processes. I learned business from the inside.",
        "I ran my own company. Worked with B2B clients. Negotiated contracts, built sales funnels, managed projects.",
        "I knew how a business works inside out. But too many things took too long. Repetitive tasks, manual work, constant firefighting.",
      ],
      skills: ["B2B Sales", "Marketing", "Project Management", "Own Business", "Startup Experience"],
    },
    turning: {
      date: "November 30, 2022",
      title: "ChatGPT launches",
      text: "That day, everything changed. Not just for me. For the entire world. I saw the future and knew I had to be part of it.",
    },
    after: {
      label: "After AI",
      period: "December 2022 – present",
      title: "New rules",
      paragraphs: [
        "From day one I started building with AI. Not reading about it. Building. Testing. Shipping.",
        "I created chatbots that answer customers 24/7. Automations that save companies 20+ hours a week. Apps that make money.",
        "Today I combine business experience with technical skills. I understand what a company needs because I've been there. And I know how AI can do it better.",
      ],
      skills: ["ChatGPT / Claude API", "AI Agents", "Process Automation", "Prompt Engineering", "AI Knowledge Bases (RAG)", "Next.js / React", "TypeScript", "Python"],
      cert: {
        date: "May 2024",
        title: "AI Manager. AI implementation course for businesses",
        author: "Maria Parysz",
        authorDesc: "Implemented AI at Rolls-Royce, Sephora and other global companies. One of the world's top AI specialists.",
        image: "https://media.licdn.com/dms/image/v2/D4D22AQFYxpWaimMfTA/feedshare-shrink_2048_1536/feedshare-shrink_2048_1536/0/1718907292052?e=1776902400&v=beta&t=Mp23D4wFml6H-rAaSpho-3-J2rMuak86ez9FWA7G2Yc",
      },
      milestones: [
        { date: "November 2023", text: "Implemented AI for SEO. Built a website, automated blog post publishing, and started generating organic traffic in 3 months. Minimal effort, zero SEO experience.", image: "https://media.licdn.com/dms/image/v2/D4D22AQG29tpWYC8qrw/feedshare-shrink_2048_1536/feedshare-shrink_2048_1536/0/1719218131585?e=1776902400&v=beta&t=FjBD2R1E7LQGfG9lXYy5Dm2dKYBhSC24jOBHtMF_oPI" },
        { date: "August 2024", text: "Speaker at CRASH Mondays. Topic: how to use AI and data in modern sales. Real examples from companies like Żabka and Netflix that revolutionized sales with AI.", image: "https://media.licdn.com/dms/image/v2/D4D22AQGgY4uuKD4_Wg/feedshare-shrink_800/feedshare-shrink_800/0/1721579818961?e=1776902400&v=beta&t=nc7AvLjWta4XPXQEkne5n8VLyJNDXpOh-chq8FihyK8" },
        { date: "November 2025", text: "Speaker session. Taught teachers how to use AI in their daily work.", image: "https://prod-fillout-oregon-s3.s3.us-west-2.amazonaws.com/orgid-542209/flowpublicid-i6Cw5dBunXus/67d299c9-f5c0-43d9-9c4a-a82550520903-PY7fXcqHejnPSSmEpcSes2G21gE0LB3EHvtMcsKDWCILwz6wAthEeP1GLLNhvxjHDq2alxyhhFwTCrEYqnrF4TpYtTlUqiN4OgC/Screenshot-2026-04-04-at-1.45.04aAM.png" },
        { date: "March 2026", text: "Deployed an AI agent on Instagram that automatically handles DM conversations" },
      ],
    },
    now: {
      title: "What I do now",
      text: "I help companies implement AI. Not theory. Not PowerPoint slides. Real tools that save time and money from day one.",
      points: [
        "Process audit. I find where AI will have the biggest impact",
        "Building custom AI solutions for your business",
        "Training your team to use AI every day",
        "Post-launch support. I don't leave you hanging",
      ],
    },
    skills: {
      title: "Tools",
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
          items: ["AI Strategy & Implementation", "Process Analysis", "Project Management"],
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
          name: "AI Tourist Guide",
          desc: "Mobile app. An AI-powered tourist guide. Shows what to see, how to get there, and tells you the history of each place.",
          tech: "React Native, AI, Maps API",
          url: "#",
          image: "https://media.licdn.com/dms/image/v2/D4D22AQEoH8m1jugGNw/feedshare-shrink_2048_1536/B4DZyuh7z5GwAk-/0/1772454657569?e=1776902400&v=beta&t=flv7PbCJ8JCM-0mcLGG-lH4HQUPA8ZL7sscs8q64Mcg",
        },
        {
          name: "Another Project",
          desc: "Project description. What it does, what problem it solves",
          tech: "Tech stack",
          url: "#",
        },
      ],
    },
    contact: {
      title: "Your turn",
      text: "You have a business and feel like AI could help, but you don't know where to start? Write me. First call is free.",
      email: "chodakowski2019@gmail.com",
      linkedin: "LinkedIn",
    },
    footer: "Jakub Chodakowski",
  },
};

type Lang = "pl" | "en";

export default function Home() {
  const [lang, setLang] = useState<Lang>("pl");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const t = CONTENT[lang];

  return (
    <div className="min-h-screen">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        @keyframes pulse-line {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 cursor-pointer"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors">
            <X size={24} />
          </button>
          <img src={lightbox} alt="" className="max-w-full max-h-[90vh] rounded-xl object-contain" />
        </div>
      )}

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/70 backdrop-blur-2xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-14">
          <span className="text-sm font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">JC</span>
          <div className="hidden md:flex items-center gap-6">
            {(["story", "skills", "projects", "contact"] as const).map((key) => (
              <a
                key={key}
                href={`#${key}`}
                className="text-xs text-neutral-500 hover:text-white transition-colors duration-300"
              >
                {t.nav[key]}
              </a>
            ))}
          </div>
          <button
            onClick={() => setLang(lang === "pl" ? "en" : "pl")}
            className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-neutral-400 hover:text-white hover:border-white/25 transition-all duration-300 flex items-center gap-1.5"
          >
            <span className="text-sm">{lang === "pl" ? "\u{1F1EC}\u{1F1E7}" : "\u{1F1F5}\u{1F1F1}"}</span>
            {lang === "pl" ? "EN" : "PL"}
          </button>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-14 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-[glow_4s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-teal-500/8 rounded-full blur-[100px] animate-[glow_5s_ease-in-out_infinite_1s]" />

        <div className="max-w-3xl mx-auto text-center relative">
          <div className="mb-8">
            <img
              src="https://media.licdn.com/dms/image/v2/D4D03AQFWaMpQd3x-_Q/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1726162788974?e=1776902400&v=beta&t=hqAVAM6AfC-sl9Bre2Rk5VxgFHIUy37-5vsZgFtAc4A"
              alt="Jakub Chodakowski"
              className="w-32 h-32 rounded-full mx-auto ring-2 ring-white/10 ring-offset-4 ring-offset-[#0a0a0a] object-cover hover:ring-emerald-500/30 transition-all duration-500"
            />
          </div>
          <p className="text-sm text-neutral-500 mb-3 tracking-wide uppercase">{t.hero.greeting}</p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-5 bg-gradient-to-b from-white via-white to-neutral-400 bg-clip-text text-transparent">
            {t.hero.name}
          </h1>
          <p className="text-xl md:text-2xl font-medium mb-6 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            {t.hero.headline}
          </p>
          <p className="text-neutral-400 max-w-lg mx-auto mb-12 leading-relaxed text-base">
            {t.hero.sub}
          </p>
          <div className="flex items-center justify-center mb-16">
            <a
              href="#contact"
              className="px-7 py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
            >
              {t.hero.cta}
            </a>
          </div>

          {/* Scroll hint */}
          <a href="#story" className="inline-flex flex-col items-center gap-2 text-neutral-600 hover:text-neutral-400 transition-colors">
            <span className="text-xs">{t.hero.scroll}</span>
            <ChevronDown size={16} className="animate-bounce" />
          </a>
        </div>
      </section>

      {/* ===== STORY TIMELINE ===== */}
      <section id="story" className="relative">

        {/* Central timeline line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/[0.08] to-transparent hidden md:block" />

        {/* --- BEFORE AI --- */}
        <div className="py-24 px-6 relative">
          <div className="max-w-3xl mx-auto">
            {/* Era label */}
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-neutral-800" />
              <span className="text-xs font-mono text-neutral-600 uppercase tracking-widest">{t.before.label}</span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-neutral-800" />
            </div>
            <p className="text-center text-xs text-neutral-600 font-mono mb-12">{t.before.period}</p>

            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-10 text-center">{t.before.title}</h2>

            <div className="space-y-6 max-w-2xl mx-auto">
              {t.before.paragraphs.map((p, i) => (
                <p key={i} className="text-neutral-400 leading-relaxed text-lg">{p}</p>
              ))}
            </div>

            {/* Skills from that era */}
            <div className="flex flex-wrap justify-center gap-2 mt-10">
              {t.before.skills.map((s, i) => (
                <span key={i} className="px-3 py-1.5 rounded-lg text-xs border border-white/[0.06] text-neutral-500">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* --- TURNING POINT --- */}
        <div className="py-20 px-6 relative">
          <div className="max-w-xl mx-auto text-center">
            {/* Big arrow down */}
            <div className="flex justify-center mb-8">
              <div className="w-12 h-12 rounded-full border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-center animate-[pulse-line_2s_ease-in-out_infinite]">
                <ChevronDown size={24} className="text-emerald-400" />
              </div>
            </div>

            <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-3">{t.turning.date}</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-6 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              {t.turning.title}
            </h2>
            <p className="text-neutral-400 text-lg leading-relaxed">{t.turning.text}</p>
          </div>
        </div>

        {/* --- AFTER AI --- */}
        <div className="py-24 px-6 bg-white/[0.015] relative">
          <div className="max-w-3xl mx-auto">
            {/* Era label */}
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-emerald-900/30" />
              <span className="text-xs font-mono text-emerald-500/60 uppercase tracking-widest">{t.after.label}</span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-emerald-900/30" />
            </div>
            <p className="text-center text-xs text-emerald-500/40 font-mono mb-12">{t.after.period}</p>

            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-10 text-center">{t.after.title}</h2>

            <div className="space-y-6 max-w-2xl mx-auto">
              {t.after.paragraphs.map((p, i) => (
                <p key={i} className="text-neutral-400 leading-relaxed text-lg">{p}</p>
              ))}
            </div>

            {/* New skills */}
            <div className="flex flex-wrap justify-center gap-2 mt-10">
              {t.after.skills.map((s, i) => (
                <span key={i} className="px-3 py-1.5 rounded-lg text-xs border border-emerald-500/15 text-emerald-400/70 bg-emerald-500/5">
                  {s}
                </span>
              ))}
            </div>

            {/* Certificate */}
            <div className="mt-16 p-6 rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.03] max-w-2xl mx-auto">
              <div className="flex flex-col md:flex-row gap-6">
                <img
                  src={t.after.cert.image}
                  alt={t.after.cert.title}
                  className="w-full md:w-48 h-36 object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setLightbox(t.after.cert.image)}
                />
                <div className="flex-1">
                  <p className="text-xs font-mono text-emerald-400/60 mb-2">{t.after.cert.date}</p>
                  <h3 className="text-base font-semibold mb-2">{t.after.cert.title}</h3>
                  <p className="text-sm text-neutral-400 mb-1">{t.after.cert.author}</p>
                  <p className="text-xs text-neutral-500 leading-relaxed">{t.after.cert.authorDesc}</p>
                </div>
              </div>
            </div>

            {/* Milestones */}
            {t.after.milestones && t.after.milestones.length > 0 && (
              <div className="mt-8 space-y-3 max-w-2xl mx-auto">
                {t.after.milestones.map((m, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02]">
                    {"image" in m && m.image && (
                      <img
                        src={m.image as string}
                        alt={m.text}
                        className="w-20 h-14 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                        onClick={() => setLightbox(m.image as string)}
                      />
                    )}
                    <div>
                      <span className="text-xs font-mono text-emerald-400/60 block mb-1">{m.date}</span>
                      <p className="text-sm text-neutral-300">{m.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- WHAT I DO NOW --- */}
        <div className="py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 text-center">{t.now.title}</h2>
            <p className="text-neutral-400 text-lg text-center max-w-2xl mx-auto mb-12 leading-relaxed">{t.now.text}</p>

            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {t.now.points.map((point, i) => (
                <div key={i} className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-emerald-500/15 transition-all duration-500">
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-400 font-bold text-sm mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                    <p className="text-neutral-300 text-sm leading-relaxed">{point}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== SKILLS ===== */}
      <section id="skills" className="py-24 px-6 bg-white/[0.015]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 tracking-tight text-center">{t.skills.title}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {t.skills.categories.map((cat, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-emerald-500/15 transition-all duration-500"
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-5 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  {cat.name}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {cat.items.map((skill, j) => (
                    <span
                      key={j}
                      className="px-3 py-1.5 rounded-lg text-xs border border-white/[0.06] text-neutral-400 hover:border-emerald-500/25 hover:text-white hover:bg-emerald-500/5 transition-all duration-300 cursor-default"
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

      {/* ===== PROJECTS ===== */}
      <section id="projects" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 tracking-tight text-center">{t.projects.title}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {t.projects.items.map((project, i) => (
              <a
                key={i}
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-white/[0.06] hover:border-emerald-500/20 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 hover:-translate-y-1 overflow-hidden"
              >
                {"image" in project && project.image && (
                  <img src={project.image as string} alt={project.name} className="w-full h-36 object-cover" />
                )}
                <div className="p-6">
                  <h3 className="font-semibold mb-2 group-hover:text-emerald-400 transition-colors duration-300">
                    {project.name}
                  </h3>
                  <p className="text-sm text-neutral-500 mb-4 leading-relaxed">
                    {project.desc}
                  </p>
                  <span className="text-[11px] text-neutral-600 font-mono tracking-wide">
                    {project.tech}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section id="contact" className="py-24 px-6 bg-white/[0.015]">
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/8 rounded-full blur-[80px]" />
          <div className="relative">
            <h2 className="text-3xl font-bold mb-4 tracking-tight">{t.contact.title}</h2>
            <p className="text-neutral-400 mb-10 max-w-md mx-auto">{t.contact.text}</p>
            <div className="flex items-center justify-center gap-4">
              <a
                href={`mailto:${t.contact.email}`}
                className="px-7 py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
              >
                {t.contact.email}
              </a>
              <a
                href="https://www.linkedin.com/in/jakub-chodakowski"
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3.5 rounded-full border border-white/10 text-neutral-300 hover:text-white hover:border-white/25 text-sm font-medium transition-all duration-300 hover:bg-white/[0.03]"
              >
                {t.contact.linkedin}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-neutral-600">
          <span>{t.footer} &copy; {new Date().getFullYear()}</span>
          <span className="font-mono">jakubchodakowski.com</span>
        </div>
      </footer>
    </div>
  );
}
