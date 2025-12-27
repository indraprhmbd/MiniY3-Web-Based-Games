import Image from "next/image";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Gamepad2, Lock, ArrowRight, Monitor, Globe } from "lucide-react";

export default function Home() {
  const games = [
    {
      id: "lucky-duel",
      title: "Lucky Number Duel",
      description: "Tebak angka keberuntungan lawanmu (Satu layar).",
      tag: "Lokal",
      href: "/games/lucky-duel",
      color: "from-purple-500 to-blue-500",
    },
    {
      id: "lucky-duel-online",
      title: "Lucky Number Duel",
      description: "Duel tebak angka jarak jauh bareng pacar/teman!",
      tag: "Online",
      href: "/games/lucky-duel-online",
      color: "from-orange-500 to-red-500",
    },
    {
      id: "tictactoe",
      title: "Tic Tac Toe",
      description: "Game klasik X dan O di satu layar.",
      tag: "Lokal",
      href: "/games/tictactoe",
      color: "from-cyan-500 to-teal-500",
    },
    {
      id: "tictactoe-online",
      title: "Tic Tac Toe",
      description: "Main Tic Tac Toe jarak jauh dengan teman!",
      tag: "Online",
      href: "/games/tictactoe-online",
      color: "from-pink-500 to-rose-500",
    },
  ];

  const localGames = games.filter((g) => g.tag === "Lokal");
  const onlineGames = games.filter((g) => g.tag === "Online");

  return (
    <div className="container max-w-screen-2xl p-4 md:p-8">
      <section className="py-8 md:py-12 space-y-4">
        <h2 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50">
          Mainkan Game
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Koleksi game sederhana untuk mengisi kegabutan bersama teman. Pilih
          mode bermain favoritmu di bawah ini.
        </p>
      </section>

      <Tabs defaultValue="online" className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="bg-zinc-900/50 border border-white/5 p-1 h-12">
            <TabsTrigger
              value="online"
              className="px-6 data-[state=active]:bg-zinc-800 data-[state=active]:text-primary flex gap-2"
            >
              <Globe className="w-4 h-4" /> Online
            </TabsTrigger>
            <TabsTrigger
              value="lokal"
              className="px-6 data-[state=active]:bg-zinc-800 data-[state=active]:text-primary flex gap-2"
            >
              <Monitor className="w-4 h-4" /> Lokal
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="lokal" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {localGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
            <PlaceholderCard />
          </div>
        </TabsContent>

        <TabsContent value="online" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {onlineGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
            <PlaceholderCard />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GameCard({ game }: { game: any }) {
  return (
    <Link
      href={game.href}
      className="group transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
    >
      <Card className="h-full overflow-hidden border-white/5 bg-zinc-900/40 backdrop-blur-xl hover:border-white/10 transition-colors">
        <div
          className={`h-40 bg-gradient-to-br ${game.color} opacity-80 flex items-center justify-center relative overflow-hidden`}
        >
          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
          <Gamepad2 className="w-16 h-16 text-white/90 drop-shadow-2xl transition-transform duration-500 group-hover:scale-110" />
        </div>
        <CardHeader>
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
              {game.title}
            </CardTitle>
            <Badge
              variant="outline"
              className="bg-zinc-800/50 border-white/5 text-[10px] uppercase tracking-wider h-5"
            >
              {game.tag}
            </Badge>
          </div>
          <CardDescription className="pt-2 line-clamp-2 min-h-[3rem]">
            {game.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-primary/80 font-bold group-hover:text-primary transition-colors">
            Main Sekarang{" "}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
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
