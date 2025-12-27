"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Swords,
  PartyPopper,
  Trophy,
  RefreshCw,
  Monitor,
  User,
  Eye,
  EyeOff,
} from "lucide-react";

type PlayerState = {
  name: string;
  secretNumber: number;
  range: [number, number];
};

export default function LuckyDuelComPage() {
  const [phase, setPhase] = useState<"setup" | "playing" | "winner">("setup");
  const [maxConfig, setMaxConfig] = useState(100);
  const [player, setPlayer] = useState<PlayerState>({
    name: "Kamu",
    secretNumber: 0,
    range: [1, 100],
  });
  const [computer, setComputer] = useState<PlayerState>({
    name: "Komputer",
    secretNumber: 0,
    range: [1, 100],
  });

  const [turn, setTurn] = useState<0 | 1>(0); // 0 = Player's turn, 1 = Computer's turn
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [winner, setWinner] = useState<string | null>(null);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [showMySecret, setShowMySecret] = useState(false);

  // Use a ref for player range to ensure AI always has the freshest bounds
  const playerRangeRef = useRef<[number, number]>([1, 100]);

  useEffect(() => {
    playerRangeRef.current = player.range;
  }, [player.range]);

  // AI Logic Execution
  useEffect(() => {
    if (phase === "playing" && turn === 1 && !winner) {
      setIsThinking(true);
      const timer = setTimeout(() => {
        const [min, max] = playerRangeRef.current;
        const guess = Math.floor((min + max) / 2);
        handleGuess(guess);
        setIsThinking(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [turn, phase, winner]);

  const handleStartGame = () => {
    const secret = player.secretNumber;
    if (!secret || secret < 1 || secret > maxConfig) {
      alert(`Masukkan angka rahasia antara 1 - ${maxConfig}!`);
      return;
    }
    const comSecret = Math.floor(Math.random() * maxConfig) + 1;

    setPlayer((prev) => ({ ...prev, range: [1, maxConfig] }));
    playerRangeRef.current = [1, maxConfig];
    setComputer((prev) => ({
      ...prev,
      secretNumber: comSecret,
      range: [1, maxConfig],
    }));
    setPhase("playing");
    setTurn(0);
  };

  const handleGuess = (guessNum: number) => {
    if (isNaN(guessNum) || winner) return;

    if (turn === 0) {
      // Player guesses Computer's secret
      if (guessNum === computer.secretNumber) {
        setWinner(player.name);
        setPhase("winner");
      } else {
        const isTooSmall = guessNum < computer.secretNumber;
        setComputer((prev) => ({
          ...prev,
          range: isTooSmall
            ? [Math.max(prev.range[0], guessNum + 1), prev.range[1]]
            : [prev.range[0], Math.min(prev.range[1], guessNum - 1)],
        }));
        setLastFeedback(
          `${player.name}: ${guessNum} terlalu ${
            isTooSmall ? "kecil" : "besar"
          }!`
        );
        setTurn(1);
      }
      setCurrentGuess("");
    } else {
      // Computer guesses Player's secret
      if (guessNum === player.secretNumber) {
        setWinner(computer.name);
        setPhase("winner");
      } else {
        const isTooSmall = guessNum < player.secretNumber;
        const newRange: [number, number] = isTooSmall
          ? [Math.max(player.range[0], guessNum + 1), player.range[1]]
          : [player.range[0], Math.min(player.range[1], guessNum - 1)];

        setPlayer((prev) => ({ ...prev, range: newRange }));
        playerRangeRef.current = newRange;
        setLastFeedback(
          `${computer.name}: ${guessNum} terlalu ${
            isTooSmall ? "kecil" : "besar"
          }!`
        );
        setTurn(0);
      }
    }
  };

  const resetGame = () => {
    setPhase("setup");
    setPlayer({ name: "Kamu", secretNumber: 0, range: [1, maxConfig] });
    setComputer({ name: "Komputer", secretNumber: 0, range: [1, maxConfig] });
    setTurn(0);
    setWinner(null);
    setLastFeedback(null);
    setCurrentGuess("");
    setIsThinking(false);
  };

  return (
    <div className="container max-w-lg mx-auto p-4 flex-1 flex flex-col justify-center min-h-[80vh]">
      {phase === "setup" && (
        <Card className="w-full border-white/5 bg-zinc-900/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Lucky Duel VS AI
            </CardTitle>
            <CardDescription className="text-center">
              Siapkan angka rahasiamu untuk dikalahkan AI.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Rentang Maksimal (1 - {maxConfig})</Label>
              <Input
                type="number"
                value={maxConfig}
                onChange={(e) => setMaxConfig(parseInt(e.target.value) || 100)}
                className="bg-zinc-950/50 border-white/10"
              />
            </div>
            <div className="space-y-4">
              <Label className="text-blue-400">Angka Rahasiamu</Label>
              <Input
                type="password"
                placeholder="Angka rahasia..."
                value={player.secretNumber || ""}
                onChange={(e) =>
                  setPlayer({
                    ...player,
                    secretNumber: parseInt(e.target.value) || 0,
                  })
                }
                className="bg-zinc-950/50 border-white/10 text-center text-xl"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleStartGame}
              className="w-full h-12 font-bold flex gap-2"
            >
              MULAI DUEL <Swords className="w-5 h-5" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {phase === "playing" && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="text-center space-y-3">
            <Badge
              variant="outline"
              className={`text-lg px-4 py-1 transition-colors ${
                turn === 0
                  ? "text-blue-400 border-blue-400/50"
                  : "text-rose-400 border-rose-400/50"
              }`}
            >
              {turn === 0 ? "Giliranmu" : "Giliran Komputer"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card
              className={`border-white/5 transition-all duration-300 ${
                turn === 0
                  ? "ring-2 ring-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                  : "opacity-50"
              }`}
            >
              <CardHeader className="p-3 text-center">
                <p className="text-xs text-blue-400 font-bold uppercase">
                  Targetmu
                </p>
                <div className="text-xl font-mono font-bold">
                  {computer.range[0]} - {computer.range[1]}
                </div>
              </CardHeader>
            </Card>
            <Card
              className={`border-white/5 transition-all duration-300 ${
                turn === 1
                  ? "ring-2 ring-rose-500 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.2)]"
                  : "opacity-50"
              }`}
            >
              <CardHeader className="p-3 text-center">
                <p className="text-xs text-rose-400 font-bold uppercase">
                  Target AI
                </p>
                <div className="text-xl font-mono font-bold">
                  {player.range[0]} - {player.range[1]}
                </div>
              </CardHeader>
            </Card>
          </div>

          <Card className="border-white/5 bg-zinc-900/60 backdrop-blur-md relative overflow-hidden">
            <CardContent className="pt-6 space-y-4">
              <Input
                type="number"
                disabled={turn === 1 || isThinking}
                placeholder={`Tebak (${computer.range[0]}-${computer.range[1]})`}
                value={currentGuess}
                onChange={(e) => setCurrentGuess(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleGuess(parseInt(currentGuess))
                }
                className="text-2xl text-center h-16 bg-zinc-950/50 border-white/10"
              />
              <Button
                onClick={() => handleGuess(parseInt(currentGuess))}
                disabled={turn === 1 || isThinking}
                className="w-full h-12 text-lg font-bold"
              >
                TEBAK!
              </Button>
            </CardContent>
            {isThinking && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50">
                <div className="flex gap-2 items-center bg-zinc-900 border border-white/10 px-6 py-3 rounded-full shadow-2xl">
                  <Monitor className="w-5 h-5 text-rose-400 animate-pulse" />
                  <span className="font-bold text-rose-400 uppercase tracking-tighter">
                    AI sedang menganalisa...
                  </span>
                </div>
              </div>
            )}
          </Card>

          <div className="flex justify-center items-center gap-3 bg-zinc-900/40 py-2 rounded-full border border-white/5">
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
              Angka Rahasiamu:
            </span>
            <Badge
              variant="secondary"
              className="font-mono text-lg flex gap-2 items-center px-4"
            >
              {showMySecret ? player.secretNumber : "****"}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-transparent"
                onClick={() => setShowMySecret(!showMySecret)}
              >
                {showMySecret ? (
                  <EyeOff className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
              </Button>
            </Badge>
          </div>

          {lastFeedback && (
            <div className="p-4 rounded-lg bg-zinc-800/40 text-center text-sm font-medium animate-in slide-in-from-bottom-2 duration-300 border border-white/5">
              {lastFeedback}
            </div>
          )}
        </div>
      )}

      <Dialog open={phase === "winner"} onOpenChange={() => {}}>
        <DialogContent className="bg-zinc-950 border-white/10 text-center sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black text-center flex items-center justify-center gap-2">
              <PartyPopper className="text-primary" /> DUEL SELESAI!
            </DialogTitle>
            <DialogDescription className="text-lg text-center font-medium mt-4">
              <span
                className={`text-3xl font-black ${
                  winner === "Kamu" ? "text-blue-400" : "text-rose-400"
                }`}
              >
                {winner?.toUpperCase()}
              </span>
              <br />
              berhasil menebak angka rahasia!
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center gap-4">
            <Trophy
              className={`w-20 h-20 animate-bounce ${
                winner === "Kamu" ? "text-yellow-500" : "text-zinc-600"
              }`}
            />
          </div>
          <Button
            className="w-full h-14 text-xl font-black uppercase tracking-tighter"
            onClick={resetGame}
          >
            Main Lagi <RefreshCw className="w-6 h-6 ml-2" />
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
