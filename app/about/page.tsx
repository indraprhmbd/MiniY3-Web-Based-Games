"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Github,
  Linkedin,
  Mail,
  ExternalLink,
  Code2,
  Cpu,
  Globe,
  Layers,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  const skills = [
    {
      name: "Next.js 16",
      icon: <Globe className="w-4 h-4" />,
      category: "Frontend",
    },
    {
      name: "TypeScript",
      icon: <Code2 className="w-4 h-4" />,
      category: "Language",
    },
    {
      name: "Tailwind CSS",
      icon: <Layers className="w-4 h-4" />,
      category: "Styling",
    },
    {
      name: "Supabase",
      icon: <Cpu className="w-4 h-4" />,
      category: "Backend",
    },
    {
      name: "React",
      icon: <Sparkles className="w-4 h-4" />,
      category: "Frontend",
    },
    {
      name: "PostgreSQL",
      icon: <Layers className="w-4 h-4" />,
      category: "Database",
    },
  ];

  const socialLinks = [
    {
      name: "GitHub",
      icon: <Github className="w-5 h-5" />,
      href: "https://github.com/indraprhmbd",
      color: "hover:text-white",
    },
    {
      name: "LinkedIn",
      icon: <Linkedin className="w-5 h-5" />,
      href: "#",
      color: "hover:text-blue-400",
    },
    {
      name: "Email",
      icon: <Mail className="w-5 h-5" />,
      href: "mailto:contact@example.com",
      color: "hover:text-red-400",
    },
  ];

  return (
    <div className="container max-w-4xl mx-auto p-4 md:p-12 space-y-16 py-16 md:py-24">
      {/* Hero Section */}
      <section className="space-y-6 text-center md:text-left relative">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <Badge
          variant="outline"
          className="px-4 py-1 border-primary/20 text-primary bg-primary/5"
        >
          Software Developer
        </Badge>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          Indra <span className="text-primary">Prihambada</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
          Membangun pengalaman digital yang modern, cepat, dan interaktif. Fokus
          pada pengembangan web menggunakan ekosistem Next.js dan Supabase.
        </p>
        <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
          <Button size="lg" className="rounded-full px-8 gap-2 group">
            Hubungi Saya{" "}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          <div className="flex items-center gap-4 px-4">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-muted-foreground transition-colors ${link.color}`}
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold italic">Tech Stack</h2>
          <div className="h-px bg-white/10 flex-1" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {skills.map((skill) => (
            <div
              key={skill.name}
              className="group p-4 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm hover:bg-zinc-800/60 hover:border-primary/20 transition-all text-center space-y-3"
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-zinc-800 flex items-center justify-center group-hover:scale-110 group-hover:text-primary transition-all">
                {skill.icon}
              </div>
              <p className="text-sm font-medium">{skill.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Project - MiniY3 */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold italic">Featured Work</h2>
          <div className="h-px bg-white/10 flex-1" />
        </div>
        <Card className="overflow-hidden border-white/5 bg-zinc-900/20 backdrop-blur-xl relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="md:flex-row md:items-center gap-6 p-8">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Sparkles className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <Badge className="bg-primary/20 text-primary border-none hover:bg-primary/30">
                Active Project
              </Badge>
              <CardTitle className="text-3xl font-bold">
                MiniY3 Game Platform
              </CardTitle>
              <CardDescription className="text-base text-zinc-400">
                Platform gaming web terpusat yang menawarkan pengalaman
                real-time menggunakan Supabase. Menampung berbagai mini-game
                interaktif.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <Link href="/">
              <Button variant="outline" className="gap-2 group">
                Lihat Platform <ExternalLink className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Philosophy/About */}
      <section className="p-8 rounded-3xl bg-zinc-900/60 border border-white/5 space-y-4">
        <h3 className="text-xl font-bold text-primary">Tentang Saya</h3>
        <p className="text-zinc-400 leading-relaxed italic">
          "Saya percaya bahwa kode bukan sekadar baris instruksi, tapi tentang
          menciptakan solusi yang mempermudah hidup dan menghibur orang lain.
          Setiap proyek adalah kesempatan untuk belajar hal baru dan mendorong
          batas teknologi web."
        </p>
      </section>

      <footer className="text-center text-muted-foreground text-sm pt-8">
        <p>© 2025 Indra Prihambada. Dibuat dengan Passion & Next.js.</p>
      </footer>
    </div>
  );
}
