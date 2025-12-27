import Image from "next/image";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Gamepad2, Lock, ArrowRight } from "lucide-react";

export default function Home() {
  const games = [
    {
      id: "lucky-duel",
      title: "Lucky Number Duel (Lokal)",
      description: "Tebak angka keberuntungan lawanmu (Satu layar).",
      tag: "1 Device",
      href: "/games/lucky-duel",
      color: "from-purple-500 to-blue-500",
    },
    {
      id: "lucky-duel-online",
      title: "Lucky Number Duel (Online)",
      description: "Duel tebak angka jarak jauh bareng pacar/teman!",
      tag: "Online",
      href: "/games/lucky-duel-online",
      color: "from-orange-500 to-red-500",
    },
    {
      id: "tictactoe",
      title: "Tic Tac Toe (Lokal)",
      description: "Game klasik X dan O di satu layar.",
      tag: "1 Device",
      href: "/games/tictactoe",
      color: "from-cyan-500 to-teal-500",
    },
    {
      id: "tictactoe-online",
      title: "Tic Tac Toe (Online)",
      description: "Main Tic Tac Toe jarak jauh dengan teman!",
      tag: "Online",
      href: "/games/tictactoe-online",
      color: "from-pink-500 to-rose-500",
    },
  ];

  return (
    <div className="container max-w-screen-2xl p-4 md:p-8">
      <section className="py-8 md:py-12 space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Mainkan Game</h2>
        <p className="text-muted-foreground text-lg">
          Koleksi game sederhana untuk mengisi kegabutan bersama teman.
        </p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {games.map((game) => (
          <Link
            href={game.href}
            key={game.id}
            className="transition-transform hover:scale-[1.02]"
          >
            <Card className="h-full overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm">
              <div
                className={`h-32 bg-gradient-to-br ${game.color} opacity-80 flex items-center justify-center`}
              >
                <Gamepad2 className="w-12 h-12 text-white/90" />
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{game.title}</CardTitle>
                  <Badge variant="secondary">{game.tag}</Badge>
                </div>
                <CardDescription className="pt-2 line-clamp-2">
                  {game.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-primary font-medium">
                  Main Sekarang <ArrowRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {/* Placeholder for future games */}
        <Card className="h-full border-dashed border-border/40 bg-zinc-900/10">
          <div className="h-32 flex items-center justify-center text-muted-foreground/20">
            <Lock className="w-12 h-12 text-zinc-800" />
          </div>
          <CardHeader>
            <CardTitle className="text-xl text-muted-foreground/50 italic">
              Segera Hadir...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
