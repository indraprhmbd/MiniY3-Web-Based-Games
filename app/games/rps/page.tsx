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
import { Hand, Scissors, RotateCcw, ArrowLeft, Stone } from "lucide-react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type RPSGame = {
  id: string;
  room_code: string;
  player1_name: string;
  player2_name: string | null;
  p1_choice: "rock" | "paper" | "scissors" | null;
  p2_choice: "rock" | "paper" | "scissors" | null;
  p1_score: number;
  p2_score: number;
  winner: string | null;
  status: "waiting" | "playing" | "finished";
};

const fetchGame = async (id: string) => {
  const { data, error } = await supabase
    .from("rps_games")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as RPSGame;
};

export default function RpsPage() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerRole, setPlayerRole] = useState<1 | 2 | null>(null);

  const queryClient = useQueryClient();

  const { data: game, isLoading } = useQuery({
    queryKey: ["rps", gameId],
    queryFn: () => fetchGame(gameId!),
    enabled: !!gameId,
    refetchInterval: 1000,
  });

  // Mutations
  const createRoomMutation = useMutation({
    mutationFn: async (name: string) => {
      const code = Math.random().toString(36).substring(2, 6).toUpperCase();
      const { data, error } = await supabase
        .from("rps_games")
        .insert([
          {
            room_code: code,
            player1_name: name,
            status: "waiting",
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
      queryClient.setQueryData(["rps", data.id], data);
    },
    onError: (err: any) => alert(err.message),
  });

  const joinRoomMutation = useMutation({
    mutationFn: async ({ name, code }: { name: string; code: string }) => {
      // Check existing
      const { data: existingGame } = await supabase
        .from("rps_games")
        .select("*")
        .eq("room_code", code.toUpperCase())
        .single();

      if (!existingGame) throw new Error("Room tidak ditemukan!");

      if (existingGame.status !== "waiting") {
        if (existingGame.player2_name === name) return existingGame;
        throw new Error("Room penuh atau sudah mulai!");
      }

      const { data, error } = await supabase
        .from("rps_games")
        .update({
          player2_name: name,
          status: "playing",
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
      queryClient.setQueryData(["rps", data.id], data);
    },
    onError: (err: any) => alert(err.message),
  });

  const updateGameMutation = useMutation({
    mutationFn: async (updates: Partial<RPSGame>) => {
      if (!gameId) return;
      const { data, error } = await supabase
        .from("rps_games")
        .update(updates)
        .eq("id", gameId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data) queryClient.setQueryData(["rps", data.id], data);
    },
  });

  // Auto-recovery logic
  useEffect(() => {
    if (!game) return;
    if (game.status === "playing" && game.p1_choice && game.p2_choice) {
      // Triggered by playerRole 1 ONLY to maintain single source of truth logic
      if (playerRole === 1) {
        const p1 = game.p1_choice;
        const p2 = game.p2_choice;
        let winner = "p2";
        if (p1 === p2) winner = "draw";
        else if (
          (p1 === "rock" && p2 === "scissors") ||
          (p1 === "paper" && p2 === "rock") ||
          (p1 === "scissors" && p2 === "paper")
        ) {
          winner = "p1";
        }

        const updates: any = { status: "finished", winner };
        if (winner === "p1") updates.p1_score = (game.p1_score || 0) + 1;
        if (winner === "p2") updates.p2_score = (game.p2_score || 0) + 1;

        updateGameMutation.mutate(updates);
      }
    }
  }, [game, playerRole, updateGameMutation]);

  const createRoom = () => {
    if (!playerName) return alert("Masukkan namamu dulu!");
    createRoomMutation.mutate(playerName);
  };

  const joinRoom = () => {
    if (!playerName || !roomCode) return alert("Nama dan Kode wajib diisi!");
    joinRoomMutation.mutate({ name: playerName, code: roomCode });
  };

  const determineWinner = (p1: string, p2: string) => {
    if (p1 === p2) return "draw";
    if (
      (p1 === "rock" && p2 === "scissors") ||
      (p1 === "paper" && p2 === "rock") ||
      (p1 === "scissors" && p2 === "paper")
    ) {
      return "p1";
    }
    return "p2";
  };

  const makeMove = (choice: "rock" | "paper" | "scissors") => {
    if (!game || !playerRole) return;
    const updateField = playerRole === 1 ? "p1_choice" : "p2_choice";

    // Calculate if we need to finish immediately (if current game state known)
    // Actually, trust the server/effect logic for finish, just send choice effectively.
    // However, original logic did optimistic checks.

    const p1 = playerRole === 1 ? choice : game.p1_choice;
    const p2 = playerRole === 2 ? choice : game.p2_choice;

    let updates: any = { [updateField]: choice };

    if (p1 && p2) {
      const winner = determineWinner(p1, p2);
      updates.status = "finished";
      updates.winner = winner;
      if (winner === "p1") updates.p1_score = (game.p1_score || 0) + 1;
      if (winner === "p2") updates.p2_score = (game.p2_score || 0) + 1;
    }

    // We update via mutation.
    // Effect handles recovery, but immediate update handles snappy response if we have both data.
    updateGameMutation.mutate(updates);
  };

  const resetGame = () => {
    updateGameMutation.mutate({
      p1_choice: null,
      p2_choice: null,
      winner: null,
      status: "playing",
    });
  };

  const copyCode = () => {
    if (game?.room_code) {
      navigator.clipboard.writeText(game.room_code);
      alert("Kode room disalin!");
    }
  };

  // --- RENDER HELPERS ---
  const getIcon = (choice: string | null) => {
    if (!choice)
      return (
        <div className="w-12 h-12 bg-zinc-800 rounded-full animate-pulse" />
      );
    switch (choice) {
      case "rock":
        return <Stone className="w-12 h-12 text-white" />;
      case "paper":
        return <Hand className="w-12 h-12 text-white" />;
      case "scissors":
        return <Scissors className="w-12 h-12 text-white" />;
      default:
        return null;
    }
  };

  const isMutating =
    createRoomMutation.isPending ||
    joinRoomMutation.isPending ||
    updateGameMutation.isPending;
  const isMyTurnDone = playerRole === 1 ? !!game?.p1_choice : !!game?.p2_choice;
  const opponentName =
    playerRole === 1 ? game?.player2_name : game?.player1_name;
  const opponentMoved =
    playerRole === 1 ? !!game?.p2_choice : !!game?.p1_choice;

  // LOBBY
  if (!gameId || !game) {
    return (
      <div className="container max-w-md mx-auto p-4 flex flex-col justify-center min-h-[80vh]">
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-black italic tracking-tighter">
              Batu<span className="text-primary">Gunting</span>Kertas
            </CardTitle>
            <CardDescription>Duel klasik penentuan nasib!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Nama Petarung</Label>
              <Input
                placeholder="Siapa namamu?"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="bg-zinc-900/50"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 pt-2">
              <Button
                onClick={createRoom}
                disabled={isMutating}
                className="h-12 font-bold text-lg"
              >
                BUAT RING BARU
              </Button>
              <div className="relative text-center">
                <span className="bg-background px-2 text-muted-foreground text-xs relative z-10">
                  ATAU
                </span>
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/40"></div>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="KODE ROOM"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="uppercase font-mono tracking-widest bg-zinc-900/50 text-center"
                  maxLength={4}
                />
                <Button
                  onClick={joinRoom}
                  disabled={isMutating}
                  variant="secondary"
                  className="font-bold"
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

  // WAITING
  if (game.status === "waiting") {
    return (
      <div className="container max-w-md mx-auto p-4 py-20 text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Menunggu Lawan...</h1>
          <p className="text-muted-foreground">Bagikan kode ini ke lawanmu</p>
        </div>

        <div
          onClick={copyCode}
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

  return (
    <div className="container max-w-md mx-auto p-4 py-4 min-h-screen flex flex-col">
      {/* SCORING HEADER */}
      <div className="flex justify-between items-center bg-zinc-900/80 p-3 rounded-lg border border-white/5 backdrop-blur mb-6">
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
      {/* HEADER: OPPONENT */}
      <div className="flex-1 flex flex-col justify-end items-center pb-8 opacity-90">
        <div
          className={`transition-all duration-500 ${
            game.status === "finished" ? "scale-125" : ""
          }`}
        >
          {game.status === "finished" ? (
            getIcon(playerRole === 1 ? game.p2_choice : game.p1_choice)
          ) : opponentMoved ? (
            <div className="w-20 h-20 bg-primary/20 rounded-full animate-bounce flex items-center justify-center">
              <span className="text-4xl text-primary font-bold">...</span>
            </div>
          ) : (
            <div className="w-16 h-16 bg-zinc-800/50 rounded-full animate-pulse flex items-center justify-center">
              <span className="text-zinc-600 font-bold">?</span>
            </div>
          )}
        </div>
        <p className="mt-4 font-bold text-lg text-muted-foreground">
          {opponentName}
        </p>
        <Badge
          variant={opponentMoved ? "default" : "outline"}
          className="mt-2 text-xs"
        >
          {game.status === "finished"
            ? game.winner === "draw"
              ? "SERI"
              : game.winner === (playerRole === 1 ? "p2" : "p1")
              ? "WINNER"
              : "LOSER"
            : opponentMoved
            ? "SUDAH MEMILIH"
            : "BERPIKIR..."}
        </Badge>
      </div>

      {/* VS DIVIDER */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent w-full my-4" />

      {/* FOOTER: ME */}
      <div className="flex-1 flex flex-col justify-start items-center pt-4">
        {game.status !== "finished" ? (
          <p className="mb-2 text-sm text-muted-foreground font-medium tracking-widest">
            GILIRANMU
          </p>
        ) : (
          <p className="mb-2 text-sm text-muted-foreground font-medium tracking-widest"></p>
        )}

        {game.status === "finished" ? (
          <div className="text-center space-y-6 animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className="scale-150 mb-8 flex justify-center">
              {getIcon(playerRole === 1 ? game.p1_choice : game.p2_choice)}
            </div>

            <div className="space-y-2">
              <h2 className="text-4xl font-black italic uppercase">
                {game.winner === "draw" ? (
                  "SERI!"
                ) : (game.winner === "p1" && playerRole === 1) ||
                  (game.winner === "p2" && playerRole === 2) ? (
                  <span className="text-green-500">MENANG!</span>
                ) : (
                  <span className="text-red-500">KALAH!</span>
                )}
              </h2>
            </div>

            <div className="grid gap-2 w-full">
              <Button
                onClick={resetGame}
                size="lg"
                className="w-full font-bold"
              >
                <RotateCcw className="mr-2 w-4 h-4" /> MAIN LAGI
              </Button>
              <Link href="/" className="w-full">
                <Button
                  variant="outline"
                  className="w-full h-12 text-lg gap-2 border-border/50 hover:bg-white/5"
                >
                  <ArrowLeft className="w-5 h-5" /> KEMBALI
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 w-full">
            {[
              {
                id: "rock",
                label: "BATU",
                icon: Stone,
                color: "hover:bg-blue-500/20 hover:border-blue-500",
              },
              {
                id: "paper",
                label: "KERTAS",
                icon: Hand,
                color: "hover:bg-yellow-500/20 hover:border-yellow-500",
              },
              {
                id: "scissors",
                label: "GUNTING",
                icon: Scissors,
                color: "hover:bg-red-500/20 hover:border-red-500",
              },
            ].map((item) => {
              const myChoice =
                playerRole === 1 ? game.p1_choice : game.p2_choice;
              const isSelected = myChoice === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => makeMove(item.id as any)}
                  disabled={isMyTurnDone || isMutating}
                  className={`
                    aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200
                    ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                        : `bg-card border-border/50 text-muted-foreground ${
                            !isMyTurnDone ? item.color : "opacity-40"
                          }`
                    }
                  `}
                >
                  <Icon className="w-8 h-8" />
                  <span className="text-xs font-bold">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
