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
  Anchor,
  Crosshair,
  Skull,
  ArrowLeft,
  RefreshCw,
  Ship,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type BSGame = {
  id: string;
  room_code: string;
  player1_name: string;
  player2_name: string | null;
  p1_ships: string[];
  p2_ships: string[];
  p1_shots: string[];
  p2_shots: string[];
  p1_score: number;
  p2_score: number;
  turn: number;
  status: "waiting" | "setup" | "playing" | "finished";
  winner: string | null;
};

const fetchGame = async (id: string) => {
  const { data, error } = await supabase
    .from("battleship_games")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as BSGame;
};

export default function BattleshipPage() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerRole, setPlayerRole] = useState<1 | 2 | null>(null);
  const [myShips, setMyShips] = useState<string[]>([]);

  const queryClient = useQueryClient();

  // Query
  const { data: game, isLoading } = useQuery({
    queryKey: ["battleship", gameId],
    queryFn: () => fetchGame(gameId!),
    enabled: !!gameId,
    refetchInterval: 1000,
  });

  // Sync local state on reset
  useEffect(() => {
    if (game?.status === "setup") {
      setMyShips([]);
    }
  }, [game?.status]);

  // Mutations
  const createRoomMutation = useMutation({
    mutationFn: async (name: string) => {
      const code = Math.random().toString(36).substring(2, 6).toUpperCase();
      const { data, error } = await supabase
        .from("battleship_games")
        .insert([
          {
            room_code: code,
            player1_name: name,
            status: "waiting",
            p1_ships: [],
            p2_ships: [],
            p1_shots: [],
            p2_shots: [],
          },
        ])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setGameId(data.id);
      setPlayerRole(1);
      queryClient.setQueryData(["battleship", data.id], data);
    },
    onError: (err: any) => alert(err.message),
  });

  const joinRoomMutation = useMutation({
    mutationFn: async ({ name, code }: { name: string; code: string }) => {
      const { data: existingGame } = await supabase
        .from("battleship_games")
        .select("*")
        .eq("room_code", code.toUpperCase())
        .single();

      if (!existingGame) throw new Error("Room tidak ditemukan!");

      if (existingGame.status !== "waiting") {
        if (existingGame.player2_name === name) return existingGame;
        throw new Error("Room sudah penuh!");
      }

      const { data, error } = await supabase
        .from("battleship_games")
        .update({
          player2_name: name,
          status: "setup",
        })
        .eq("room_code", code.toUpperCase())
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setGameId(data.id);
      setPlayerRole(2);
      queryClient.setQueryData(["battleship", data.id], data);
    },
    onError: (err: any) => alert(err.message),
  });

  const updateGameMutation = useMutation({
    mutationFn: async (updates: Partial<BSGame>) => {
      if (!gameId) return;
      const { data, error } = await supabase
        .from("battleship_games")
        .update(updates)
        .eq("id", gameId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data) queryClient.setQueryData(["battleship", data.id], data);
    },
  });

  const createRoom = () => {
    if (!playerName) return alert("Masukkan namamu dulu!");
    createRoomMutation.mutate(playerName);
  };

  const joinRoom = () => {
    if (!playerName || !roomCode) return alert("Nama dan Kode wajib diisi!");
    joinRoomMutation.mutate({ name: playerName, code: roomCode });
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

  const submitShips = () => {
    if (myShips.length !== 3) return alert("Pilih 3 posisi kapal!");
    if (!game || !playerRole) return;

    const updateField = playerRole === 1 ? "p1_ships" : "p2_ships";
    const otherShips = playerRole === 1 ? game.p2_ships : game.p1_ships;

    let updates: any = { [updateField]: myShips };

    if (otherShips && otherShips.length === 3) {
      updates.status = "playing";
    }

    updateGameMutation.mutate(updates);
  };

  const handleAttack = (coord: string) => {
    if (!game || !playerRole) return;
    if (game.status !== "playing") return;
    if (game.turn !== playerRole - 1) return; // Prevent attack if not my turn

    const myShots = playerRole === 1 ? game.p1_shots : game.p2_shots;
    if (myShots.includes(coord)) return;

    const newShots = [...myShots, coord];
    const updateField = playerRole === 1 ? "p1_shots" : "p2_shots";

    const enemyShips = playerRole === 1 ? game.p2_ships : game.p1_ships;
    const hitCount = newShots.filter((shot) =>
      enemyShips.includes(shot)
    ).length;

    let updates: any = {
      [updateField]: newShots,
      turn: game.turn === 0 ? 1 : 0,
    };

    if (hitCount === 3) {
      updates.status = "finished";
      updates.winner = playerRole === 1 ? game.player1_name : game.player2_name;
      if (playerRole === 1) updates.p1_score = (game.p1_score || 0) + 1;
      if (playerRole === 2) updates.p2_score = (game.p2_score || 0) + 1;
    }

    updateGameMutation.mutate(updates);
  };

  const resetGame = () => {
    updateGameMutation.mutate({
      status: "setup",
      p1_ships: [],
      p2_ships: [],
      p1_shots: [],
      p2_shots: [],
      winner: null,
      turn: 0,
    });
    setMyShips([]);
  };

  const isMutating =
    createRoomMutation.isPending ||
    joinRoomMutation.isPending ||
    updateGameMutation.isPending;

  // GRID RENDERER
  const gridSize = 5;
  const renderGrid = (
    isMyBoard: boolean,
    ships: string[],
    shots: string[],
    opponentShots: string[] = [],
    isMinimap: boolean = false,
    onCellClick?: (coord: string) => void
  ) => {
    const cells = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const coord = `${r}-${c}`;
        const isShip = ships.includes(coord);

        let content = null;
        // Adjust style based on isMinimap
        let bgClass = isMinimap
          ? "bg-black/40 border-white/5"
          : "bg-blue-900/20 hover:bg-blue-800/40 border-blue-500/20";

        let roundedClass = isMinimap ? "rounded-sm" : "rounded-md";
        let cellSizeClass = isMinimap
          ? "w-[12px] h-[12px] md:w-[16px] md:h-[16px]"
          : "w-full aspect-square";
        let iconSize = isMinimap ? "w-2 h-2" : "w-4 h-4";

        if (isMyBoard) {
          const hitByEnemy = opponentShots.includes(coord);
          if (isShip) {
            bgClass = hitByEnemy ? "bg-red-500/80" : "bg-emerald-500/80";
            if (!isMinimap) {
              content = (
                <Ship
                  className={`${iconSize} ${
                    hitByEnemy ? "text-white animate-pulse" : "text-emerald-200"
                  }`}
                />
              );
            }
          } else if (hitByEnemy) {
            bgClass = "bg-zinc-700/80"; // Miss by enemy
            if (!isMinimap)
              content = <div className="w-2 h-2 rounded-full bg-white/20" />;
          }
        } else {
          // Enemy Board
          const myShotHere = shots.includes(coord);
          const isHit = myShotHere && isShip;

          if (myShotHere) {
            if (isHit) {
              bgClass = "bg-red-500";
              content = (
                <Skull className={`${iconSize} text-white animate-bounce`} />
              );
            } else {
              bgClass = "bg-zinc-700/50";
              content = <div className="w-2 h-2 rounded-full bg-white/30" />;
            }
          } else {
            if (
              onCellClick &&
              game?.turn === playerRole! - 1 &&
              game?.status === "playing"
            ) {
              bgClass = "bg-blue-900/30 hover:bg-red-500/30 cursor-crosshair";
            }
          }
        }

        if (game?.status === "setup" && isMyBoard && onCellClick) {
          if (myShips.includes(coord)) bgClass = "bg-emerald-500";
        }

        cells.push(
          <div
            key={coord}
            onClick={() => onCellClick && onCellClick(coord)}
            className={`
                ${cellSizeClass}
                border ${roundedClass} flex items-center justify-center transition-all duration-200
                ${bgClass}
            `}
          >
            {content}
          </div>
        );
      }
    }
    return (
      <div
        className={`grid grid-cols-5 ${
          isMinimap ? "gap-0.5" : "gap-1 md:gap-2"
        }`}
      >
        {cells}
      </div>
    );
  };

  // --- UI RENDER ---

  if (!gameId || !game) {
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
                disabled={isMutating}
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
                  disabled={isMutating}
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

  if (game.status === "waiting") {
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
          onClick={() => setGameId(null)}
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

      <Card className="w-full border-border/40 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center pb-2 relative min-h-[100px] flex flex-col justify-center">
          <CardTitle className="text-3xl font-black italic tracking-tighter flex items-center justify-center gap-2">
            <Anchor className="text-blue-500" /> BATTLESHIP{" "}
            <span className="text-sm font-normal text-muted-foreground bg-zinc-800 px-2 rounded">
              MINI
            </span>
          </CardTitle>
          <CardDescription>
            {game.status === "setup"
              ? "Tempatkan 3 Kapalmu"
              : "Hancurkan Kapal Musuh!"}
          </CardDescription>

          {/* MINIMAP */}
          {(game.status === "playing" || game.status === "finished") && (
            <div className="absolute right-2 top-2 scale-75 origin-top-right bg-zinc-950/90 border border-zinc-800 p-1.5 rounded-lg shadow-xl backdrop-blur-md z-10 flex flex-col gap-1 w-[100px]">
              <div className="flex items-center justify-between">
                <Label className="text-[8px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                  BASE
                </Label>
                <div className="flex gap-0.5">
                  {Array.from({ length: 3 }).map((_, i) => {
                    const myShips =
                      playerRole === 1 ? game.p1_ships : game.p2_ships;
                    const enemyShots =
                      playerRole === 1 ? game.p2_shots : game.p1_shots;
                    const hits = enemyShots.filter((s) =>
                      myShips?.includes(s)
                    ).length;
                    return (
                      <div
                        key={i}
                        className={`w-1 h-1 rounded-full ${
                          i < hits
                            ? "bg-red-500 animate-pulse"
                            : "bg-emerald-500"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
              {renderGrid(
                true,
                playerRole === 1 ? game.p1_ships : game.p2_ships,
                [],
                playerRole === 1 ? game.p2_shots : game.p1_shots,
                true
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {game.status === "setup" && (
            <>
              <div className="mb-6">
                {renderGrid(true, myShips, [], [], false, handleSetupClick)}
              </div>

              <Button
                onClick={submitShips}
                disabled={
                  myShips.length !== 3 ||
                  isMutating ||
                  (playerRole === 1
                    ? game.p1_ships.length === 3
                    : game.p2_ships.length === 3)
                }
                className="w-full font-bold"
              >
                {(
                  playerRole === 1
                    ? game.p1_ships.length === 3
                    : game.p2_ships.length === 3
                )
                  ? "MENUNGGU LAWAN..."
                  : "SIAP TEMPUR!"}
              </Button>
            </>
          )}

          {(game.status === "playing" || game.status === "finished") && (
            <div className="space-y-6 flex-1 relative">
              {/* MAIN BOARD: ENEMY (TARGET) */}
              <div className="space-y-2 relative">
                <div className="flex justify-between items-center px-1 mb-2">
                  <Label className="text-red-400 flex items-center gap-2 text-lg font-bold">
                    <Crosshair className="w-5 h-5" /> RADAR MUSUH
                  </Label>
                  {isMyTurn && game.status === "playing" && (
                    <Badge className="animate-pulse bg-emerald-500 hover:bg-emerald-600 text-white border-0">
                      GILIRANMU MENEMBAK!
                    </Badge>
                  )}
                </div>

                <div
                  className={`transition-all duration-300 rounded-xl p-1 ${
                    isMyTurn && game.status === "playing"
                      ? "shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-gradient-to-br from-emerald-500/10 to-transparent"
                      : "opacity-90 grayscale-[0.3]"
                  }`}
                >
                  {renderGrid(
                    false,
                    playerRole === 1 ? game.p2_ships : game.p1_ships,
                    playerRole === 1 ? game.p1_shots : game.p2_shots,
                    [],
                    false,
                    handleAttack
                  )}
                </div>
              </div>
              {/* No Old Minimap Here */}

              {game.status === "finished" && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                  <Card className="max-w-xs w-full bg-zinc-900 border-zinc-700 text-center animate-in zoom-in duration-300">
                    <CardHeader>
                      <CardTitle className="text-3xl">GAME OVER</CardTitle>
                      <CardDescription className="text-lg text-white">
                        {game.winner ===
                        (playerRole === 1
                          ? game.player1_name
                          : game.player2_name) ? (
                          <span className="text-emerald-400 font-bold">
                            KAMU MENANG!
                          </span>
                        ) : (
                          <span className="text-red-400 font-bold">
                            KAMU KALAH
                          </span>
                        )}
                        <span className="mt-2 text-sm text-zinc-500 block">
                          Pemenangnya adalah{" "}
                          <span className="text-zinc-300">{game?.winner}</span>
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        <Button
                          onClick={resetGame}
                          className="w-full font-bold"
                        >
                          MAIN LAGI
                          <RefreshCw className="w-5 h-5" />
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
        </CardContent>
      </Card>
    </div>
  );
}
