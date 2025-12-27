"use client";

import React, { useState } from "react";
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
import { Swords, PartyPopper, Trophy, RefreshCw } from "lucide-react";

type Player = {
  name: string;
  secretNumber: number;
  guesses: number[];
  range: [number, number];
};

export default function LuckyDuelPage() {
  const [phase, setPhase] = useState<"setup" | "playing" | "winner">("setup");

  // Input states as strings for setup
  const [maxConfigInput, setMaxConfigInput] = useState("100");
  const [p1SecretInput, setP1SecretInput] = useState("");
  const [p2SecretInput, setP2SecretInput] = useState("");
  const [p1Name, setP1Name] = useState("Player 1");
  const [p2Name, setP2Name] = useState("Player 2");

  const [player1, setPlayer1] = useState<Player>({
    name: "Player 1",
    secretNumber: 0,
    guesses: [],
    range: [1, 100],
  });
  const [player2, setPlayer2] = useState<Player>({
    name: "Player 2",
    secretNumber: 0,
    guesses: [],
    range: [1, 100],
  });

  const [turn, setTurn] = useState<0 | 1>(0);
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [winner, setWinner] = useState<Player | null>(null);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  const handleStartGame = () => {
    const maxVal = parseInt(maxConfigInput) || 100;
    const s1 = parseInt(p1SecretInput);
    const s2 = parseInt(p2SecretInput);

    if (isNaN(s1) || isNaN(s2)) {
      alert("Keduanya harus mengisi angka rahasia!");
      return;
    }

    if (s1 < 1 || s1 > maxVal || s2 < 1 || s2 > maxVal) {
      alert(`Angka rahasia harus antara 1 - ${maxVal}!`);
      return;
    }

    setPlayer1({
      name: p1Name,
      secretNumber: s1,
      guesses: [],
      range: [1, maxVal],
    });
    setPlayer2({
      name: p2Name,
      secretNumber: s2,
      guesses: [],
      range: [1, maxVal],
    });
    setPhase("playing");
  };

  const handleGuess = () => {
    const guessNum = parseInt(currentGuess);
    if (isNaN(guessNum)) return;

    const currentPlayer = turn === 0 ? player1 : player2;
    const opponent = turn === 0 ? player2 : player1;

    if (guessNum === opponent.secretNumber) {
      setWinner(currentPlayer);
      setPhase("winner");
      return;
    }

    let feedback = "";
    if (guessNum < opponent.secretNumber) {
      feedback = `${guessNum} terlalu kecil!`;
      if (turn === 0) {
        setPlayer2((prev) => ({
          ...prev,
          range: [Math.max(prev.range[0], guessNum + 1), prev.range[1]],
        }));
      } else {
        setPlayer1((prev) => ({
          ...prev,
          range: [Math.max(prev.range[0], guessNum + 1), prev.range[1]],
        }));
      }
    } else {
      feedback = `${guessNum} terlalu besar!`;
      if (turn === 0) {
        setPlayer2((prev) => ({
          ...prev,
          range: [prev.range[0], Math.min(prev.range[1], guessNum - 1)],
        }));
      } else {
        setPlayer1((prev) => ({
          ...prev,
          range: [prev.range[0], Math.min(prev.range[1], guessNum - 1)],
        }));
      }
    }

    setLastFeedback(`${currentPlayer.name}: ${feedback}`);
    setCurrentGuess("");
    setTurn(turn === 0 ? 1 : 0);
  };

  return (
    <div className="container max-w-lg mx-auto p-4 flex-1 flex flex-col justify-center min-h-[80vh]">
      {phase === "setup" && (
        <Card className="w-full border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Setup Permainan
            </CardTitle>
            <CardDescription className="text-center">
              Tentukan angka rahasia masing-masing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Rentang Maksimal (1 - {maxConfigInput || "..."})</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={maxConfigInput}
                onChange={(e) =>
                  setMaxConfigInput(e.target.value.replace(/\D/g, ""))
                }
                className="bg-zinc-900/50 border-zinc-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <Label className="text-purple-400">Player 1</Label>
                <Input
                  placeholder="Nama P1"
                  value={p1Name}
                  onChange={(e) => setP1Name(e.target.value)}
                  className="bg-zinc-900/50 border-zinc-800"
                />
                <Input
                  type="password"
                  inputMode="numeric"
                  placeholder="Angka Rahasia"
                  value={p1SecretInput}
                  onChange={(e) =>
                    setP1SecretInput(e.target.value.replace(/\D/g, ""))
                  }
                  className="bg-zinc-900/50 border-zinc-800"
                />
              </div>
              <div className="space-y-4">
                <Label className="text-blue-400">Player 2</Label>
                <Input
                  placeholder="Nama P2"
                  value={p2Name}
                  onChange={(e) => setP2Name(e.target.value)}
                  className="bg-zinc-900/50 border-zinc-800"
                />
                <Input
                  type="password"
                  inputMode="numeric"
                  placeholder="Angka Rahasia"
                  value={p2SecretInput}
                  onChange={(e) =>
                    setP2SecretInput(e.target.value.replace(/\D/g, ""))
                  }
                  className="bg-zinc-900/50 border-zinc-800"
                />
              </div>
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
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <Badge
              variant="outline"
              className="text-lg px-4 py-1 border-primary/50 text-primary"
            >
              Giliran {turn === 0 ? player1.name : player2.name}
            </Badge>
            <h2 className="text-xl font-medium text-muted-foreground">
              Menebak angka rahasia {turn === 0 ? player2.name : player1.name}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card
              className={`border-border/20 transition-all ${
                turn === 1
                  ? "ring-2 ring-primary bg-primary/5 shadow-lg"
                  : "opacity-50"
              }`}
            >
              <CardHeader className="p-3">
                <CardTitle className="text-xs text-center uppercase tracking-tighter">
                  Target: {player1.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-center">
                <div className="text-2xl font-mono font-bold text-blue-400">
                  {player1.range[0]} - {player1.range[1]}
                </div>
              </CardContent>
            </Card>
            <Card
              className={`border-border/20 transition-all ${
                turn === 0
                  ? "ring-2 ring-primary bg-primary/5 shadow-lg"
                  : "opacity-50"
              }`}
            >
              <CardHeader className="p-3">
                <CardTitle className="text-xs text-center uppercase tracking-tighter">
                  Target: {player2.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-center">
                <div className="text-2xl font-mono font-bold text-purple-400">
                  {player2.range[0]} - {player2.range[1]}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/40 bg-zinc-900/40 backdrop-blur-md">
            <CardContent className="pt-6 space-y-4">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Masukkan Tebakan..."
                value={currentGuess}
                onChange={(e) =>
                  setCurrentGuess(e.target.value.replace(/\D/g, ""))
                }
                onKeyDown={(e) => e.key === "Enter" && handleGuess()}
                className="text-2xl text-center h-16 bg-zinc-950/50 border-zinc-800"
              />
              <Button
                onClick={handleGuess}
                className="w-full h-12 text-lg font-bold uppercase"
              >
                TEBAK!
              </Button>
            </CardContent>
          </Card>

          {lastFeedback && (
            <div className="p-4 rounded-lg bg-zinc-800/40 text-center text-zinc-300 animate-in fade-in duration-300 border border-white/5">
              {lastFeedback}
            </div>
          )}
        </div>
      )}

      <Dialog open={phase === "winner"}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-center sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-3xl text-center pb-2 flex items-center justify-center gap-2">
              <PartyPopper className="text-primary" /> KEMENANGAN!
            </DialogTitle>
            <DialogDescription className="text-lg text-center font-medium text-zinc-300 pt-4">
              <span className="text-primary text-3xl font-black">
                {winner?.name.toUpperCase()}
              </span>
              <br />
              berhasil menebak angka rahasia lawan!
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center gap-4">
            <Trophy className="w-16 h-16 text-yellow-500 animate-bounce" />
          </div>
          <Button
            className="w-full h-14 text-xl font-bold flex gap-2"
            onClick={() => {
              setPhase("setup");
              setP1SecretInput("");
              setP2SecretInput("");
              setWinner(null);
              setLastFeedback(null);
            }}
          >
            MAIN LAGI <RefreshCw className="w-5 h-5" />
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
