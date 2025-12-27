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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [maxConfig, setMaxConfig] = useState(100);
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
  const [turn, setTurn] = useState<0 | 1>(0); // 0 = P1's turn to guess P2's secret
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [winner, setWinner] = useState<Player | null>(null);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  // Setup Handlers
  const handleStartGame = () => {
    if (!player1.secretNumber || !player2.secretNumber) {
      alert("Keduanya harus mengisi angka rahasia!");
      return;
    }
    setPlayer1((prev) => ({ ...prev, range: [1, maxConfig] }));
    setPlayer2((prev) => ({ ...prev, range: [1, maxConfig] }));
    setPhase("playing");
  };

  // Gameplay Handlers
  const handleGuess = () => {
    const guessNum = parseInt(currentGuess);
    if (isNaN(guessNum)) return;

    const currentPlayer = turn === 0 ? player1 : player2;
    const opponent = turn === 0 ? player2 : player1;
    const setOpponent = turn === 0 ? setPlayer2 : setPlayer1;

    // Feedback logic: narrowing the range of the OPPONENT'S secret
    if (guessNum === opponent.secretNumber) {
      setWinner(currentPlayer);
      setPhase("winner");
      return;
    }

    let feedback = "";
    if (guessNum < opponent.secretNumber) {
      feedback = `${guessNum} terlalu kecil!`;
      // Update the range for the secret they are looking for
      setOpponent((prev) => ({
        ...prev,
        range: [Math.max(prev.range[0], guessNum + 1), prev.range[1]],
      }));
    } else {
      feedback = `${guessNum} terlalu besar!`;
      setOpponent((prev) => ({
        ...prev,
        range: [prev.range[0], Math.min(prev.range[1], guessNum - 1)],
      }));
    }

    setLastFeedback(`${currentPlayer.name}: ${feedback}`);
    setCurrentGuess("");
    setTurn(turn === 0 ? 1 : 0);
  };

  return (
    <div className="container max-w-lg mx-auto p-4 flex-1 flex flex-col justify-center">
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
              <Label>Rentang Maksimal (1 - ...)</Label>
              <Input
                type="number"
                value={maxConfig}
                onChange={(e) => setMaxConfig(parseInt(e.target.value) || 100)}
                className="bg-zinc-900/50 border-zinc-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <Label className="text-purple-400">Player 1</Label>
                <Input
                  placeholder="Nama P1"
                  value={player1.name}
                  onChange={(e) =>
                    setPlayer1({ ...player1, name: e.target.value })
                  }
                  className="bg-zinc-900/50 border-zinc-800"
                />
                <Input
                  type="password"
                  placeholder="Angka Rahasia"
                  onChange={(e) =>
                    setPlayer1({
                      ...player1,
                      secretNumber: parseInt(e.target.value) || 0,
                    })
                  }
                  className="bg-zinc-900/50 border-zinc-800"
                />
              </div>
              <div className="space-y-4">
                <Label className="text-blue-400">Player 2</Label>
                <Input
                  placeholder="Nama P2"
                  value={player2.name}
                  onChange={(e) =>
                    setPlayer2({ ...player2, name: e.target.value })
                  }
                  className="bg-zinc-900/50 border-zinc-800"
                />
                <Input
                  type="password"
                  placeholder="Angka Rahasia"
                  onChange={(e) =>
                    setPlayer2({
                      ...player2,
                      secretNumber: parseInt(e.target.value) || 0,
                    })
                  }
                  className="bg-zinc-900/50 border-zinc-800"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleStartGame}
              className="w-full size-lg bg-primary hover:bg-primary/90 font-bold flex gap-2"
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
              className={`border-border/20 ${
                turn === 1 ? "ring-2 ring-primary bg-primary/5" : "opacity-50"
              }`}
            >
              <CardHeader className="p-4">
                <CardTitle className="text-sm text-center">
                  Target: Secret {player1.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-center">
                <div className="text-2xl font-mono font-bold text-blue-400">
                  {player1.range[0]} - {player1.range[1]}
                </div>
              </CardContent>
            </Card>
            <Card
              className={`border-border/20 ${
                turn === 0 ? "ring-2 ring-primary bg-primary/5" : "opacity-50"
              }`}
            >
              <CardHeader className="p-4">
                <CardTitle className="text-sm text-center">
                  Target: Secret {player2.name}
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
              <div className="space-y-2">
                <Label>Masukkan Tebakanmu</Label>
                <Input
                  type="number"
                  autoFocus
                  placeholder={`Coba angka antara ${
                    turn === 0 ? player2.range[0] : player1.range[0]
                  } - ${turn === 0 ? player2.range[1] : player1.range[1]}`}
                  value={currentGuess}
                  onChange={(e) => setCurrentGuess(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGuess()}
                  className="text-2xl text-center h-16 bg-zinc-950/50 border-zinc-800"
                />
              </div>
              <Button
                onClick={handleGuess}
                className="w-full h-12 text-lg font-bold uppercase tracking-widest"
              >
                TEBAK!
              </Button>
            </CardContent>
          </Card>

          {lastFeedback && (
            <div className="p-4 rounded-lg bg-zinc-800/40 text-center text-zinc-300 animate-in fade-in zoom-in duration-300">
              {lastFeedback}
            </div>
          )}
        </div>
      )}

      <Dialog open={phase === "winner"} onOpenChange={() => {}}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-center sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-3xl text-center pb-2 flex items-center justify-center gap-2">
              <PartyPopper className="text-primary" /> KEMENANGAN!{" "}
              <PartyPopper className="text-primary" />
            </DialogTitle>
            <DialogDescription className="text-lg text-center font-medium text-zinc-300">
              <span className="text-primary text-2xl font-bold">
                {winner?.name}
              </span>{" "}
              berhasil menebak angka rahasia lawan!
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center gap-4">
            <Trophy className="w-16 h-16 text-yellow-500 animate-bounce" />
            <p className="text-muted-foreground italic">
              "Siapa sangka angka itu emang beruntung."
            </p>
          </div>
          <Button
            className="w-full h-12 text-lg font-bold flex gap-2"
            onClick={() => {
              setPhase("setup");
              setPlayer1((p) => ({
                ...p,
                guesses: [],
                range: [1, 100],
                secretNumber: 0,
              }));
              setPlayer2((p) => ({
                ...p,
                guesses: [],
                range: [1, 100],
                secretNumber: 0,
              }));
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
