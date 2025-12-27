"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import {
  Target,
  Ship,
  Anchor,
  Waves,
  Crosshair,
  Skull,
  Trophy,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

type BSGame = {
  id: string;
  room_code: string;
  player1_name: string;
  player2_name: string | null;
  p1_ships: string[]; // Coordinates e.g. ["0-0", "1-2"]
  p2_ships: string[];
  p1_shots: string[];
  p2_shots: string[];
  p1_score: number;
  p2_score: number;
  turn: number; // 0 = p1, 1 = p2
  status: "waiting" | "setup" | "playing" | "finished";
  winner: string | null;
};

export default function BattleshipPage() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [game, setGame] = useState<BSGame | null>(null);
  const [playerRole, setPlayerRole] = useState<1 | 2 | null>(null);
  const [loading, setLoading] = useState(false);

  // Local setup state
  const [myShips, setMyShips] = useState<string[]>([]);

  // Realtime subscription
  useEffect(() => {
    if (!game?.id) return;

    const channel = supabase
      .channel(`battleship:${game.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "battleship_games",
          filter: `id=eq.${game.id}`,
        },
        (payload) => {
          setGame(payload.new as BSGame);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [game?.id]);

  const createRoom = async () => {
    if (!playerName) return alert("Masukkan namamu dulu!");
    setLoading(true);

    const code = Math.random().toString(36).substring(2, 6).toUpperCase();

    const { data, error } = await supabase
      .from("battleship_games")
      .insert([
        {
          room_code: code,
          player1_name: playerName,
          status: "waiting",
          p1_ships: [],
          p2_ships: [],
          p1_shots: [],
          p2_shots: [],
        },
      ])
      .select()
      .single();

    if (error) alert(error.message);
    else {
      setGame(data);
      setPlayerRole(1);
    }
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!playerName || !roomCode) return alert("Nama dan Kode wajib diisi!");
    setLoading(true);

    const { data: existingGame } = await supabase
      .from("battleship_games")
      .select("*")
      .eq("room_code", roomCode.toUpperCase())
      .single();

    if (!existingGame) {
      setLoading(false);
      return alert("Room tidak ditemukan!");
    }

    if (existingGame.status !== "waiting") {
      if (existingGame.player2_name === playerName) {
        setGame(existingGame);
        setPlayerRole(2);
        setLoading(false);
        return;
      }
      setLoading(false);
      return alert("Room sudah penuh!");
    }

    const { data, error } = await supabase
      .from("battleship_games")
      .update({
        player2_name: playerName,
        status: "setup",
      })
      .eq("room_code", roomCode.toUpperCase())
      .select()
      .single();

    if (error) alert("Gagal join room");
    else {
      setGame(data);
      setPlayerRole(2);
    }
    setLoading(false);
  };

  const handleSetupClick = (coord: string) => {
    if (myShips.includes(coord)) {
      setMyShips(myShips.filter((s) => s !== coord));
    } else {
      if (myShips.length < 3) {
        setMyShips([...myShips, coord]);
      }
    }
  };

  const submitShips = async () => {
    if (myShips.length !== 3) return alert("Pilih 3 posisi kapal!");
    if (!game || !playerRole) return;
    setLoading(true);

    const updateField = playerRole === 1 ? "p1_ships" : "p2_ships";
    const otherShips = playerRole === 1 ? game.p2_ships : game.p1_ships;

    let updates: any = { [updateField]: myShips };

    // If opponent already has ships, start game
    // Note: Checking length because default might be empty array
    if (otherShips && otherShips.length === 3) {
      updates.status = "playing";
    }

    const { data, error } = await supabase
      .from("battleship_games")
      .update(updates)
      .eq("id", game.id)
      .select()
      .single();

    if (error) {
      alert("Error submitting ships");
    } else {
      setGame(data);
    }
    setLoading(false);
  };

  const handleAttack = async (coord: string) => {
    if (!game || !playerRole) return;

    // Check shooting own board? No, UI handles clicking ENEMY board.
    // Check if already shot
    const myShots = playerRole === 1 ? game.p1_shots : game.p2_shots;
    if (myShots.includes(coord)) return; // Already shot

    const newShots = [...myShots, coord];
    const updateField = playerRole === 1 ? "p1_shots" : "p2_shots";

    // Check win
    const enemyShips = playerRole === 1 ? game.p2_ships : game.p1_ships;
    const hitCount = newShots.filter((shot) =>
      enemyShips.includes(shot)
    ).length;

    let updates: any = {
      [updateField]: newShots,
      turn: game.turn === 0 ? 1 : 0,
    };

    if (hitCount === 3) {
      // 3 ships total
      updates.status = "finished";
      updates.winner = playerRole === 1 ? game.player1_name : game.player2_name;
      if (playerRole === 1) updates.p1_score = (game.p1_score || 0) + 1;
      if (playerRole === 2) updates.p2_score = (game.p2_score || 0) + 1;
    }

    await supabase.from("battleship_games").update(updates).eq("id", game.id);
  };

  const resetGame = async () => {
    if (!game) return;
    await supabase
      .from("battleship_games")
      .update({
        status: "setup",
        p1_ships: [],
        p2_ships: [],
        p1_shots: [],
        p2_shots: [],
        winner: null,
        turn: 0,
      })
      .eq("id", game.id);
    setMyShips([]);
  };

  // --- RENDER HELPERS ---
  const gridSize = 5;
  const renderGrid = (
    isMyBoard: boolean,
    ships: string[],
    shots: string[],
    opponentShots: string[] = [],
    onCellClick?: (coord: string) => void
  ) => {
    const cells = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const coord = `${r}-${c}`;
        const isShip = ships.includes(coord);
        const isShot = shots.includes(coord); // Shots fired AT this board by opponent (if isMyBoard)
        // OR Shots fired BY me at opponent (if !isMyBoard)

        // Logic fix:
        // If my board: show MY ships. Show Opponent Shots hitting me.
        // If enemy board: HIDE enemy ships. Show MY shots hitting them.

        let content = null;
        let bgClass = "bg-blue-900/20 hover:bg-blue-800/40";

        if (isMyBoard) {
          // My Board
          const hitByEnemy = opponentShots.includes(coord);
          if (isShip) {
            bgClass = hitByEnemy ? "bg-red-500/50" : "bg-emerald-500/50"; // Ship hit or safe
            content = (
              <Ship
                className={`w-4 h-4 ${
                  hitByEnemy ? "text-white animate-pulse" : "text-emerald-200"
                }`}
              />
            );
          } else if (hitByEnemy) {
            bgClass = "bg-zinc-700/50"; // Miss by enemy
            content = <div className="w-2 h-2 rounded-full bg-white/20" />;
          }
        } else {
          // Enemy Board (Target)
          const myShotHere = shots.includes(coord);
          const isHit = myShotHere && isShip; // isShip here refers to actual enemy ships passed in

          if (myShotHere) {
            if (isHit) {
              bgClass = "bg-red-500";
              content = <Skull className="w-4 h-4 text-white animate-bounce" />;
            } else {
              bgClass = "bg-zinc-700";
              content = <div className="w-3 h-3 rounded-full bg-white/30" />;
            }
          } else {
            // Not shot yet
            if (
              onCellClick &&
              game?.turn === playerRole! - 1 &&
              game?.status === "playing"
            ) {
              bgClass = "bg-blue-900/30 hover:bg-red-500/30 cursor-crosshair";
            }
          }
        }

        // Setup Phase special logic
        if (game?.status === "setup" && isMyBoard && onCellClick) {
          if (isShip) bgClass = "bg-emerald-500";
        }

        cells.push(
          <div
            key={coord}
            onClick={() => onCellClick && onCellClick(coord)}
            className={`
                w-full aspect-square border border-blue-500/20 rounded-md flex items-center justify-center transition-all duration-200
                ${bgClass}
            `}
          >
            {content}
          </div>
        );
      }
    }
    return <div className="grid grid-cols-5 gap-1 md:gap-2">{cells}</div>;
  };

  if (!game) {
    return (
      <div className="container max-w-md mx-auto p-4 flex flex-col justify-center min-h-[80vh]">
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-black italic tracking-tighter flex items-center justify-center gap-2">
              <Anchor className="text-blue-500" /> BATTLESHIP{" "}
              <span className="text-sm font-normal text-muted-foreground bg-zinc-800 px-2 rounded">
                MINI
              </span>
            </CardTitle>
            <CardDescription>
              Hancurkan armada lawan di laut 5x5!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input
              placeholder="Nama Kapten"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="bg-zinc-900/50"
            />
            <div className="space-y-3">
              <Button
                onClick={createRoom}
                disabled={loading}
                className="w-full h-12 font-bold"
              >
                BUAT BASE
              </Button>
              <div className="flex gap-2">
                <Input
                  placeholder="CODE"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="uppercase font-mono text-center tracking-widest"
                  maxLength={4}
                />
                <Button
                  onClick={joinRoom}
                  disabled={loading}
                  variant="secondary"
                >
                  GABUNG
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Waiting for opponent
  if (game?.status === "waiting") {
    return (
      <div className="container max-w-md mx-auto p-4 py-20 text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Menunggu Lawan...</h1>
          <p className="text-muted-foreground">Bagikan kode ini ke lawanmu</p>
        </div>

        <div
          onClick={() => {
            navigator.clipboard.writeText(game.room_code);
            alert("Kode room disalin!");
          }}
          className="bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-xl p-8 py-12 cursor-pointer hover:border-primary transition-colors group relative"
        >
          <div className="text-6xl font-mono font-black tracking-[0.5em] pl-4 text-white group-hover:scale-110 transition-transform">
            {game.room_code}
          </div>
          <div className="absolute bottom-4 left-0 right-0 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            KLIK UNTUK COPY
          </div>
        </div>

        <Button
          variant="ghost"
          className="text-muted-foreground"
          onClick={() => setGame(null)}
        >
          Batal
        </Button>
      </div>
    );
  }

  const isMyTurn = game.turn === playerRole! - 1;

  return (
    <div className="container max-w-lg mx-auto p-2 py-4 min-h-screen flex flex-col gap-4">
      {/* SCORING HEADER */}
      {game && (
        <div className="flex justify-between items-center bg-zinc-900/80 p-3 rounded-lg border border-white/5 backdrop-blur mb-2">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mb-1">
              Room
            </div>
            <div className="font-mono font-bold text-lg text-primary leading-none tracking-tighter">
              {game.room_code}
            </div>
          </div>

          <div className="flex items-center gap-4 bg-black/20 px-4 py-1 rounded-full border border-white/5">
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground uppercase leading-none mb-1 truncate max-w-[60px]">
                {game.player1_name}
              </div>
              <div className="text-xl font-black leading-none">
                {game.p1_score || 0}
              </div>
            </div>
            <div className="text-zinc-600 font-bold text-sm">VS</div>
            <div className="text-left">
              <div className="text-[10px] text-muted-foreground uppercase leading-none mb-1 truncate max-w-[60px]">
                {game.player2_name || "..."}
              </div>
              <div className="text-xl font-black leading-none">
                {game.p2_score || 0}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mb-1">
              Role
            </div>
            <div className="font-bold text-[10px] text-emerald-400 leading-none">
              P{playerRole}
            </div>
          </div>
        </div>
      )}

      {game.status === "setup" && (
        <Card className="bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-center text-emerald-400">
              DEPLOY SHIPS
            </CardTitle>
            <CardDescription className="text-center">
              Pilih 3 lokasi untuk menyembunyikan kapalmu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderGrid(true, myShips, [], [], handleSetupClick)}

            <Button
              onClick={submitShips}
              disabled={
                myShips.length !== 3 ||
                loading ||
                (playerRole === 1
                  ? game.p1_ships.length === 3
                  : game.p2_ships.length === 3)
              }
              className="w-full mt-6 font-bold"
            >
              {(
                playerRole === 1
                  ? game.p1_ships.length === 3
                  : game.p2_ships.length === 3
              )
                ? "MENUNGGU LAWAN..."
                : "SIAP TEMPUR!"}
            </Button>
          </CardContent>
        </Card>
      )}

      {(game.status === "playing" || game.status === "finished") && (
        <div className="space-y-6 flex-1">
          {/* ENEMY BOARD (TARGET) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <Label className="text-red-400 flex items-center gap-2">
                <Crosshair className="w-4 h-4" /> WILAYAH MUSUH (
                {playerRole === 1 ? game.player2_name : game.player1_name})
              </Label>
              {isMyTurn && game.status === "playing" && (
                <Badge className="animate-pulse bg-red-500">
                  GILIRANMU MENEMBAK
                </Badge>
              )}
            </div>
            {/* We pass enemy ships to renderGrid so it can check hits, but renderGrid logic HIDES them visually unless hit */}
            {renderGrid(
              false,
              playerRole === 1 ? game.p2_ships : game.p1_ships,
              playerRole === 1 ? game.p1_shots : game.p2_shots,
              [],
              handleAttack
            )}
          </div>

          {/* SEPARATOR */}
          <div className="h-px bg-white/10 w-full" />

          {/* MY BOARD */}
          <div className="space-y-2">
            <Label className="text-emerald-400 flex items-center gap-2">
              <Anchor className="w-4 h-4" /> WILAYAH KITA
            </Label>
            {renderGrid(
              true,
              playerRole === 1 ? game.p1_ships : game.p2_ships,
              [], // My shots (irrelevant for my board view)
              playerRole === 1 ? game.p2_shots : game.p1_shots // Opponent shots at me
            )}
          </div>

          {game.status === "finished" && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <Card className="max-w-xs w-full bg-zinc-900 border-zinc-700 text-center animate-in zoom-in duration-300">
                <CardHeader>
                  <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
                  <CardTitle className="text-3xl">GAME OVER</CardTitle>
                  <CardDescription className="text-lg text-white">
                    {game.winner ===
                    (playerRole === 1
                      ? game.player1_name
                      : game.player2_name) ? (
                      <span className="text-emerald-400 font-bold">
                        KAMU MENANG! 🎉
                      </span>
                    ) : (
                      <span className="text-red-400 font-bold">
                        KAMU KALAH 💀
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <Button onClick={resetGame} className="w-full font-bold">
                      MAIN LAGI
                    </Button>
                    <Link href="/" className="w-full">
                      <Button
                        variant="outline"
                        className="w-full text-lg gap-2 border-zinc-700 hover:bg-zinc-800"
                      >
                        <ArrowLeft className="w-4 h-4" /> KEMBALI
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
