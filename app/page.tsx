"use client";

import Image from "next/image";
import Link from "next/link";
import { Gamepad2, Lock, ArrowRight, Monitor, Globe } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const games = [
    {
      id: "lucky-duel",
      title: "Lucky Number Duel",
      description:
        "Duel tebak angka keberuntungan! Siapa yang paling lihai menebak angka rahasia lawan?",
      image: "/games/lucky-duel.webp",
      modes: [
        { label: "VS Computer", href: "/games/lucky-duel-com", icon: Monitor },
        { label: "Multiplayer", href: "/games/lucky-duel", icon: Gamepad2 },
        { label: "Online Duel", href: "/games/lucky-duel-online", icon: Globe },
      ],
    },
    {
      id: "tictactoe",
      title: "Tic Tac Toe",
      description:
        "Game klasik X dan O. Uji strategimu melawan teman atau komputer!",
      image: "/games/tictactoe.webp",
      modes: [
        { label: "VS Computer", href: "/games/tictactoe-com", icon: Monitor },
        { label: "Multiplayer", href: "/games/tictactoe", icon: Gamepad2 },
        { label: "Online Play", href: "/games/tictactoe-online", icon: Globe },
      ],
    },
  ];

  return (
    <div className="container max-w-screen-2xl p-4 md:p-8">
      <section className="py-8 md:py-12 space-y-4">
        <h2 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50">
          Mainkan Game
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Koleksi game sederhana untuk mengisi kegabutan. Pilih game dan mode
          bermain favoritmu di bawah ini.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
        <PlaceholderCard />
      </div>
    </div>
  );
}

function GameCard({ game }: { game: any }) {
  return (
    <Card className="h-full overflow-hidden border-white/5 bg-zinc-900/40 backdrop-blur-xl hover:border-white/10 transition-all duration-300">
      <div className="h-56 relative overflow-hidden bg-zinc-950">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-10" />
        <Image
          src={game.image}
          alt={game.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{game.title}</CardTitle>
        <CardDescription className="pt-2 line-clamp-2">
          {game.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Pilih Mode:
        </p>
        <div className="grid grid-cols-1 gap-2">
          {game.modes.map((mode: any) => (
            <Link key={mode.label} href={mode.href}>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 bg-zinc-800/30 border-white/5 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group"
              >
                <mode.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span className="font-medium">{mode.label}</span>
                <ArrowRight className="w-4 h-4 ml-auto opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PlaceholderCard() {
  return (
    <Card className="h-full border-dashed border-white/5 bg-zinc-950/20 group opacity-50">
      <div className="h-40 flex items-center justify-center text-muted-foreground/20">
        <Lock className="w-12 h-12 text-zinc-900 group-hover:scale-110 transition-transform" />
      </div>
      <CardHeader>
        <CardTitle className="text-xl text-muted-foreground/30 italic font-medium">
          Segera Hadir...
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
