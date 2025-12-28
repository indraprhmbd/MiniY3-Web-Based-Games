"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Ship,
  Skull,
  Crosshair,
  RefreshCw,
  ArrowLeft,
  Trophy,
  Anchor,
  ShieldAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type GamePhase = "setup" | "playing" | "finished";

export default function BattleshipComPage() {
  const router = useRouter();
  const gridSize = 5;
  const totalShips = 3;

  const [phase, setPhase] = useState<GamePhase>("setup");
  const [turn, setTurn] = useState<"player" | "computer">("player");
  const [winner, setWinner] = useState<"player" | "computer" | null>(null);

  // Coordinates are "row-col" strings
  const [myShips, setMyShips] = useState<string[]>([]);
  const [comShips, setComShips] = useState<string[]>([]);
  const [myShots, setMyShots] = useState<string[]>([]); // Shots I fired at COM
  const [comShots, setComShots] = useState<string[]>([]); // Shots COM fired at ME

  const [playerScore, setPlayerScore] = useState(0);
  const [comScore, setComScore] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- LOGIC ---

  const handleCellClick = (
    r: number,
    c: number,
    boardOwner: "player" | "computer"
  ) => {
    const coord = `${r}-${c}`;

    // SETUP PHASE: Place ships on my board
    if (phase === "setup") {
      if (boardOwner === "computer") return; // Cant touch enemy board in setup
      if (myShips.includes(coord)) {
        setMyShips(myShips.filter((s) => s !== coord));
      } else {
        if (myShips.length < totalShips) {
          setMyShips([...myShips, coord]);
        }
      }
      return;
    }

    // PLAYING PHASE: Shoot at enemy board
    if (phase === "playing") {
      if (boardOwner === "player") return; // Cant shoot self
      if (turn !== "player") return; // Not my turn
      if (myShots.includes(coord)) return; // Already shot this

      // Player fires
      const newShots = [...myShots, coord];
      setMyShots(newShots);

      // Check HIT
      const isHit = comShips.includes(coord);

      // Check Win
      const hipsCount = newShots.filter((s) => comShips.includes(s)).length;
      if (hipsCount >= totalShips) {
        setWinner("player");
        setPlayerScore((prev) => prev + 1);
        setPhase("finished");
        return;
      }

      // If Miss, switch turn. If Hit, keep turn?
      // Standard rules: usually switch. Let's switch for simplicity/balance.
      setTurn("computer");
      setIsProcessing(true);
    }
  };

  // Computer Turn Effect
  useEffect(() => {
    if (phase === "playing" && turn === "computer" && !winner) {
      const timeout = setTimeout(() => {
        executeComputerTurn();
      }, 1000); // 1s thinking time
      return () => clearTimeout(timeout);
    }
  }, [phase, turn, winner]);

  const executeComputerTurn = () => {
    // Logic: Pick random unshot coordinate
    const potentialMoves: string[] = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const coord = `${r}-${c}`;
        if (!comShots.includes(coord)) {
          potentialMoves.push(coord);
        }
      }
    }

    if (potentialMoves.length === 0) return;

    const randomIdx = Math.floor(Math.random() * potentialMoves.length);
    const shot = potentialMoves[randomIdx];

    const newComShots = [...comShots, shot];
    setComShots(newComShots);

    // Check Loss
    const hitsCount = newComShots.filter((s) => myShips.includes(s)).length;
    if (hitsCount >= totalShips) {
      setWinner("computer");
      setComScore((prev) => prev + 1);
      setPhase("finished");
    } else {
      setTurn("player");
      setIsProcessing(false);
    }
  };

  const startGame = () => {
    if (myShips.length !== totalShips) {
      alert(`Pasang ${totalShips} kapal dulu!`);
      return;
    }

    // Place COM ships
    const newComShips: string[] = [];
    while (newComShips.length < totalShips) {
      const r = Math.floor(Math.random() * gridSize);
      const c = Math.floor(Math.random() * gridSize);
      const coord = `${r}-${c}`;
      if (!newComShips.includes(coord)) {
        newComShips.push(coord);
      }
    }
    setComShips(newComShips);
    setPhase("playing");
    setTurn("player");
  };

  const resetGame = () => {
    setPhase("setup");
    setMyShips([]);
    setComShips([]);
    setMyShots([]);
    setComShots([]);
    setWinner(null);
    setTurn("player");
    setIsProcessing(false);
  };

  // --- RENDER HELPERS ---
  const renderGrid = (
    owner: "player" | "computer",
    isMinimap: boolean = false
  ) => {
    const cells = [];
    const isPlayer = owner === "player";

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const coord = `${r}-${c}`;

        // Determine state
        let isShip = false;
        let isShot = false;

        if (isPlayer) {
          isShip = myShips.includes(coord);
          isShot = comShots.includes(coord);
        } else {
          isShip = comShips.includes(coord);
          isShot = myShots.includes(coord);
        }

        let content = null;

        // Styles
        let bgClass = isMinimap
          ? "bg-black/40 border-white/5"
          : "bg-blue-900/20";
        let roundedClass = isMinimap ? "rounded-sm" : "rounded-md";
        let cellSizeClass = isMinimap
          ? "w-[12px] h-[12px] md:w-[16px] md:h-[16px]"
          : "aspect-square";
        let iconSize = isMinimap ? "w-2 h-2" : "w-4 h-4";

        let cursorClass = "cursor-default";

        if (!isMinimap) {
          if (phase === "setup" && isPlayer)
            cursorClass = "cursor-pointer hover:bg-emerald-500/20";
          if (phase === "playing" && !isPlayer && !isShot && turn === "player")
            cursorClass = "cursor-crosshair hover:bg-rose-500/20";
        }

        if (isPlayer) {
          // My Board
          if (isShip) {
            bgClass = isShot ? "bg-red-500/50" : "bg-emerald-500/50";
            if (!isMinimap) {
              content = (
                <Ship
                  className={`${iconSize} ${
                    isShot ? "text-white animate-pulse" : "text-emerald-200"
                  }`}
                />
              );
            }
          } else if (isShot) {
            bgClass = "bg-zinc-700/50";
            if (!isMinimap)
              content = <div className="w-2 h-2 rounded-full bg-white/20" />;
          }
        } else {
          // Enemy Board
          if (isShot) {
            if (isShip) {
              bgClass = "bg-red-500";
              content = (
                <Skull className={`${iconSize} text-white animate-bounce`} />
              );
            } else {
              bgClass = "bg-zinc-700";
              content = <div className="w-3 h-3 rounded-full bg-white/30" />;
            }
          }
        }

        cells.push(
          <div
            key={coord}
            onClick={() => handleCellClick(r, c, owner)}
            className={`
               ${cellSizeClass}
               border ${roundedClass} flex items-center justify-center transition-all duration-200
               ${bgClass} ${cursorClass}
            `}
          >
            {content}
          </div>
        );
      }
    }

    return (
      <div
        className={`grid grid-cols-5 ${isMinimap ? "gap-0.5" : "gap-1.5"} ${
          !isMinimap ? "p-2 bg-black/20 rounded-xl border border-white/5" : ""
        }`}
      >
        {cells}
      </div>
    );
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
          <div className="font-bold text-[10px] text-blue-400 leading-none uppercase">
            Sea War
          </div>
        </div>
      </div>

      <Card className="w-full border-border/40 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center pb-2 relative min-h-[100px] flex flex-col justify-center">
          <CardTitle className="text-3xl font-black italic tracking-tighter flex items-center justify-center gap-2">
            <Anchor className="text-blue-500" /> BATTLESHIP{" "}
            <span className="text-sm font-normal text-muted-foreground bg-zinc-800 px-2 rounded">
              MINI
            </span>
          </CardTitle>
          <CardDescription>
            {phase === "setup"
              ? "Tempatkan 3 Kapalmu"
              : "Hancurkan Kapal Musuh!"}
          </CardDescription>

          {/* MINIMAP MOVED HERE */}
          {(phase === "playing" || phase === "finished") && (
            <div className="absolute right-2 top-2 scale-75 origin-top-right bg-zinc-950/90 border border-zinc-800 p-1.5 rounded-lg shadow-xl backdrop-blur-md z-10 flex flex-col gap-1 w-[100px]">
              <div className="flex items-center justify-between">
                <Label className="text-[8px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                  BASE
                </Label>
                <div className="flex gap-0.5">
                  {Array.from({ length: totalShips }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-1 rounded-full ${
                        i < comShots.filter((s) => myShips.includes(s)).length
                          ? "bg-red-500 animate-pulse"
                          : "bg-emerald-500"
                      }`}
                    />
                  ))}
                </div>
              </div>
              {renderGrid("player", true)}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* SETUP PHASE: Show Big Player Board */}
          {phase === "setup" && (
            <div className="flex flex-col gap-6">
              <div>
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <Ship className="w-3 h-3" /> Area Kamu
                  </span>
                  <Badge variant="outline">
                    {myShips.length}/{totalShips}
                  </Badge>
                </div>
                {renderGrid("player", false)}
              </div>
              <Button
                className="w-full font-bold h-12"
                onClick={startGame}
                disabled={myShips.length !== totalShips}
              >
                MULAI PERTEMPURAN
              </Button>
            </div>
          )}

          {/* PLAYING PHASE: Minimap Layout */}
          {(phase === "playing" || phase === "finished") && (
            <div className="flex flex-col gap-6 relative">
              {/* ENEMY BOARD (Big) */}
              <div className="space-y-2 relative">
                <div className="flex justify-between items-center mb-2 px-1">
                  <Label className="text-red-400 flex items-center gap-2 text-lg font-bold">
                    <Crosshair className="w-5 h-5" /> RADAR MUSUH
                  </Label>
                  {turn === "player" && (
                    <Badge className="animate-pulse bg-emerald-500 hover:bg-emerald-600 text-white border-0">
                      GILIRANMU
                    </Badge>
                  )}
                  {turn === "computer" && (
                    <Badge variant="outline" className="animate-pulse">
                      KOMPUTER BERPIKIR...
                    </Badge>
                  )}
                </div>

                <div
                  className={`transition-all duration-300 rounded-xl p-1 ${
                    turn === "player" && phase === "playing"
                      ? "shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-gradient-to-br from-emerald-500/10 to-transparent"
                      : "opacity-90 grayscale-[0.3]"
                  }`}
                >
                  {renderGrid("computer", false)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* WINNER DIALOG */}
      <Dialog open={phase === "finished"}>
        <DialogContent className="text-center bg-zinc-950 border-white/10">
          <DialogHeader>
            <DialogTitle className="flex justify-center items-center gap-2 text-2xl">
              {winner === "player" ? (
                <Trophy className="text-yellow-500" />
              ) : (
                <Skull className="text-zinc-500" />
              )}
              GAME OVER
            </DialogTitle>
            <DialogDescription className="text-lg text-center font-medium text-zinc-300 pt-4">
              {winner === "player" ? (
                <span className="text-primary text-3xl font-black italic tracking-tighter block animate-pulse">
                  CONGRATS! YOU WIN
                </span>
              ) : (
                <span className="text-rose-500 text-3xl font-black italic tracking-tighter block">
                  YOU LOSE...
                </span>
              )}
              <span className="mt-2 text-sm text-zinc-500 block">
                {winner === "player"
                  ? "Semua kapal musuh hancur!"
                  : "Semua kapalmu hancur..."}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 mt-4">
            <Button onClick={resetGame} className="w-full h-12 font-bold">
              MAIN LAGI <RefreshCw className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 text-lg gap-2 border-white/10 hover:bg-white/5"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="w-5 h-5" /> KEMBALI
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
