"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Hand,
  Scissors,
  Sticker,
  RotateCcw,
  Trophy,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

const CHOICES = [
  {
    id: "rock",
    label: "BATU",
    icon: Sticker,
    color: "hover:bg-emerald-500/20 hover:border-emerald-500",
  },
  {
    id: "paper",
    label: "KERTAS",
    icon: Hand,
    color: "hover:bg-blue-500/20 hover:border-blue-500",
  },
  {
    id: "scissors",
    label: "GUNTING",
    icon: Scissors,
    color: "hover:bg-red-500/20 hover:border-red-500",
  },
];

type Choice = "rock" | "paper" | "scissors";

export default function RpsComPage() {
  const router = useRouter();
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [computerChoice, setComputerChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<"win" | "lose" | "draw" | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [comScore, setComScore] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper to get icon
  const getIcon = (choice: string | null) => {
    const item = CHOICES.find((c) => c.id === choice);
    if (!item) return null;
    const Icon = item.icon;
    return <Icon className="w-12 h-12" />;
  };

  const handleMove = (choice: Choice) => {
    if (playerChoice || isProcessing) return; // Prevent double click
    setPlayerChoice(choice);
    setIsProcessing(true);

    // Simulate "thinking" delay for realism
    setTimeout(() => {
      const options: Choice[] = ["rock", "paper", "scissors"];
      const comMove = options[Math.floor(Math.random() * options.length)];
      setComputerChoice(comMove);
      determineWinner(choice, comMove);
      setIsProcessing(false);
    }, 600);
  };

  const determineWinner = (p1: Choice, cpu: Choice) => {
    if (p1 === cpu) {
      setResult("draw");
    } else if (
      (p1 === "rock" && cpu === "scissors") ||
      (p1 === "paper" && cpu === "rock") ||
      (p1 === "scissors" && cpu === "paper")
    ) {
      setResult("win");
      setPlayerScore((prev) => prev + 1);
    } else {
      setResult("lose");
      setComScore((prev) => prev + 1);
    }
  };

  const resetRound = () => {
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
  };

  return (
    <div className="container max-w-lg mx-auto p-4 flex-1 flex flex-col justify-center min-h-[80vh]">
      {/* SCORING HEADER */}
      <div className="flex justify-between items-center bg-zinc-900/80 p-3 rounded-lg border border-white/5 backdrop-blur mb-6">
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mb-1">
            Room
          </div>
          <div className="font-mono font-bold text-lg text-primary leading-none tracking-tighter">
            VS COM
          </div>
        </div>

        <div className="flex items-center gap-4 bg-black/20 px-4 py-1 rounded-full border border-white/5">
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground uppercase leading-none mb-1 truncate max-w-[60px]">
              KAMU
            </div>
            <div className="text-xl font-black leading-none">{playerScore}</div>
          </div>
          <div className="text-zinc-600 font-bold text-sm">VS</div>
          <div className="text-left">
            <div className="text-[10px] text-muted-foreground uppercase leading-none mb-1 truncate max-w-[60px]">
              CPU
            </div>
            <div className="text-xl font-black leading-none">{comScore}</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mb-1">
            Mode
          </div>
          <div className="font-bold text-[10px] text-purple-400 leading-none uppercase">
            Solo
          </div>
        </div>
      </div>

      <Card className="w-full border-border/40 bg-card/50 backdrop-blur-sm relative overflow-hidden">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold">
            Batu Gunting Kertas
          </CardTitle>
          <CardDescription>Kalahkan Komputer!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          {/* Battle Area */}
          <div className="flex justify-between items-center px-4">
            {/* Player Side */}
            <div className="flex flex-col items-center gap-2">
              <Badge
                variant="outline"
                className="border-primary/50 text-primary"
              >
                Pilihanmu
              </Badge>
              <div
                className={`w-24 h-24 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 ${
                  playerChoice
                    ? "bg-primary/20 border-primary shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    : "bg-zinc-900/50 border-white/5"
                }`}
              >
                {playerChoice ? (
                  getIcon(playerChoice)
                ) : (
                  <span className="text-4xl text-muted-foreground animate-pulse">
                    ?
                  </span>
                )}
              </div>
            </div>

            <div className="text-xl font-black text-muted-foreground italic">
              VS
            </div>

            {/* CPU Side */}
            <div className="flex flex-col items-center gap-2">
              <Badge
                variant="outline"
                className="border-rose-500/50 text-rose-500"
              >
                Komputer
              </Badge>
              <div
                className={`w-24 h-24 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 ${
                  computerChoice
                    ? "bg-rose-500/20 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)]"
                    : "bg-zinc-900/50 border-white/5"
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                ) : computerChoice ? (
                  getIcon(computerChoice)
                ) : (
                  <span className="text-4xl text-muted-foreground animate-pulse">
                    ?
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Choice Selection or Result */}
          {!result ? (
            <div className="grid grid-cols-3 gap-3 w-full">
              {CHOICES.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMove(item.id as Choice)}
                    disabled={!!playerChoice}
                    className={`
                      aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200
                      ${
                        playerChoice === item.id
                          ? "bg-primary text-primary-foreground border-primary scale-105"
                          : `bg-card border-border/50 text-muted-foreground ${item.color}`
                      }
                      ${
                        playerChoice && playerChoice !== item.id
                          ? "opacity-40 grayscale"
                          : ""
                      }
                    `}
                  >
                    <Icon className="w-8 h-8" />
                    <span className="text-xs font-bold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-center">
                {result === "win" && (
                  <>
                    <h2 className="text-2xl font-black text-primary italic tracking-tighter">
                      MENANG!
                    </h2>
                    <p className="text-zinc-400 text-sm">Hebat juga kamu.</p>
                  </>
                )}
                {result === "lose" && (
                  <>
                    <h2 className="text-2xl font-black text-rose-500 italic tracking-tighter">
                      KALAH...
                    </h2>
                    <p className="text-zinc-400 text-sm">Coba lagi ya!</p>
                  </>
                )}
                {result === "draw" && (
                  <>
                    <h2 className="text-2xl font-black text-yellow-500 italic tracking-tighter">
                      SERI!
                    </h2>
                    <p className="text-zinc-400 text-sm">Sama kuat.</p>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1 h-12 text-lg font-bold"
                  onClick={resetRound}
                >
                  Main Lagi <RotateCcw className="ml-2 w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-12 w-12 p-0 border-white/10"
                  onClick={() => router.push("/")}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
