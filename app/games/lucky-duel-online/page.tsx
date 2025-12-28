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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { RefreshCw, Eye, EyeOff, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type GameState = {
  id: string;
  room_code: string;
  player1_name: string;
  player2_name: string;
  player1_secret: number | null;
  player2_secret: number | null;
  p1_range_min: number;
  p1_range_max: number;
  p2_range_min: number;
  p2_range_max: number;
  p1_score: number;
  p2_score: number;
  turn: number;
  winner_name: string | null;
  status: "waiting" | "setup" | "playing" | "finished";
  last_guess: number | null;
  initial_max?: number;
};

// Fetcher function
const fetchGame = async (id: string) => {
  const { data, error } = await supabase
    .from("luckyduel_games")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as GameState;
};

export default function LuckyDuelOnlinePage() {
  const [phase, setPhase] = useState<"lobby" | "setup" | "playing" | "winner">(
    "lobby"
  );
  const [roomCode, setRoomCode] = useState("");
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [playerRole, setPlayerRole] = useState<1 | 2 | null>(null);
  const [secretInput, setSecretInput] = useState("");
  const [guessInput, setGuessInput] = useState("");
  const [maxRangeInput, setMaxRangeInput] = useState("100");
  const [error, setError] = useState<string | null>(null);
  const [showMySecret, setShowMySecret] = useState(false);
  const [warning, setWarning] = useState<"too-low" | "too-high" | null>(null);

  const queryClient = useQueryClient();

  // Query for Game State
  const { data: game, isLoading } = useQuery({
    queryKey: ["luckyduel", gameId],
    queryFn: () => fetchGame(gameId!),
    enabled: !!gameId,
    refetchInterval: 1000,
  });

  const formatNumber = (val: string | number) => {
    if (!val && val !== 0) return "";
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const parseNumber = (val: string) => {
    return val.replace(/,/g, "");
  };

  const handleNumberInput = (
    val: string,
    setter: (v: string) => void,
    max?: number
  ) => {
    const rawValue = parseNumber(val);
    if (rawValue === "" || /^\d*$/.test(rawValue)) {
      if (max && parseInt(rawValue) > max) return;
      setter(formatNumber(rawValue));
    }
  };

  // Warning logic
  useEffect(() => {
    if (phase === "playing" && guessInput && game) {
      const currentGuess = parseInt(parseNumber(guessInput));
      const isP1 = playerRole === 1;
      const targetMin = isP1 ? game.p2_range_min : game.p1_range_min;
      const targetMax = isP1 ? game.p2_range_max : game.p1_range_max;

      if (
        !isNaN(currentGuess) &&
        targetMin !== undefined &&
        targetMax !== undefined
      ) {
        if (currentGuess < targetMin) setWarning("too-low");
        else if (currentGuess > targetMax) setWarning("too-high");
        else setWarning(null);
      } else {
        setWarning(null);
      }
    } else {
      setWarning(null);
    }
  }, [guessInput, phase, playerRole, game]);

  // Mutations
  const createRoomMutation = useMutation({
    mutationFn: async ({
      name,
      maxRange,
    }: {
      name: string;
      maxRange: number;
    }) => {
      const code = Math.random().toString(36).substring(2, 6).toUpperCase();
      const { data, error } = await supabase
        .from("luckyduel_games")
        .insert([
          {
            room_code: code,
            player1_name: name,
            status: "waiting",
            p1_range_max: maxRange,
            p2_range_max: maxRange,
            initial_max: maxRange,
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
      setPhase("lobby");
      queryClient.setQueryData(["luckyduel", data.id], data);
    },
    onError: (err: any) => setError(err.message),
  });

  const joinRoomMutation = useMutation({
    mutationFn: async ({ name, code }: { name: string; code: string }) => {
      const { data, error } = await supabase
        .from("luckyduel_games")
        .update({ player2_name: name, status: "setup" })
        .eq("room_code", code.toUpperCase())
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setGameId(data.id);
      setPlayerRole(2);
      setPhase("setup");
      queryClient.setQueryData(["luckyduel", data.id], data);
    },
    onError: () => setError("Room tidak ditemukan atau error!"),
  });

  const updateGameMutation = useMutation({
    mutationFn: async (updates: Partial<GameState>) => {
      if (!gameId) throw new Error("No game ID");
      const { data, error } = await supabase
        .from("luckyduel_games")
        .update(updates)
        .eq("id", gameId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["luckyduel", gameId], data);
    },
  });

  // Sync Phase & Auto-Recovery
  useEffect(() => {
    if (!game) return;

    // Auto-recovery
    if (game.status === "setup" && game.player1_secret && game.player2_secret) {
      updateGameMutation.mutate({ status: "playing" });
    }

    // Phase syncing
    if (game.status === "setup") {
      if (phase !== "setup") {
        setPhase("setup");
        setSecretInput("");
        setGuessInput("");
        setWarning(null);
        setShowMySecret(false);
      }
    }
    if (game.status === "playing" && phase !== "playing") setPhase("playing");
    if (game.status === "finished" && phase !== "winner") setPhase("winner");
  }, [game, phase, updateGameMutation]);

  // Handlers
  const createRoom = () => {
    if (!playerName) return setError("Masukkan namamu!");
    const maxRange = parseInt(parseNumber(maxRangeInput)) || 100;
    createRoomMutation.mutate({ name: playerName, maxRange });
  };

  const joinRoom = () => {
    if (!playerName || !roomCode)
      return setError("Nama dan Kode Room harus diisi!");
    joinRoomMutation.mutate({ name: playerName, code: roomCode });
  };

  const handleReset = () => {
    if (!game) return;
    updateGameMutation.mutate({
      status: "setup",
      player1_secret: null,
      player2_secret: null,
      winner_name: null,
      turn: 0,
      last_guess: null,
      p1_range_min: 1,
      p1_range_max: game.initial_max || 100,
      p2_range_min: 1,
      p2_range_max: game.initial_max || 100,
    });
    setSecretInput("");
    setGuessInput("");
    setWarning(null);
  };

  const submitSecret = () => {
    const secret = parseInt(parseNumber(secretInput));
    if (isNaN(secret)) return;

    const maxRange = playerRole === 1 ? game?.p1_range_max : game?.p2_range_max;
    if (secret < 1 || (maxRange && secret > maxRange)) {
      alert(`Angka rahasia harus antara 1 - ${formatNumber(maxRange || 100)}!`);
      return;
    }

    const update: any =
      playerRole === 1
        ? { player1_secret: secret }
        : { player2_secret: secret };

    if (
      (playerRole === 1 && game?.player2_secret) ||
      (playerRole === 2 && game?.player1_secret)
    ) {
      update.status = "playing";
    }

    updateGameMutation.mutate(update);
  };

  const handleGuess = () => {
    const guess = parseInt(parseNumber(guessInput));
    if (isNaN(guess) || !game) return;

    const maxVal = playerRole === 1 ? game.p2_range_max : game.p1_range_max;
    if (guess < 1 || guess > maxVal) {
      alert(`Tebakan harus antara 1 - ${formatNumber(maxVal)}!`);
      return;
    }

    const isP1 = playerRole === 1;
    const opponentSecret = isP1 ? game.player2_secret : game.player1_secret;

    let nextStatus = game.status;
    let winner = game.winner_name;
    let p1RangeMin = game.p1_range_min;
    let p1RangeMax = game.p1_range_max;
    let p2RangeMin = game.p2_range_min;
    let p2RangeMax = game.p2_range_max;

    if (guess === opponentSecret) {
      nextStatus = "finished";
      winner = isP1 ? game.player1_name : game.player2_name;
    } else {
      if (isP1) {
        if (guess < opponentSecret!)
          p2RangeMin = Math.max(p2RangeMin, guess + 1);
        else p2RangeMax = Math.min(p2RangeMax, guess - 1);
      } else {
        if (guess < opponentSecret!)
          p1RangeMin = Math.max(p1RangeMin, guess + 1);
        else p1RangeMax = Math.min(p1RangeMax, guess - 1);
      }
    }

    const updates: any = {
      turn: game.turn === 0 ? 1 : 0,
      status: nextStatus,
      winner_name: winner,
      p1_range_min: p1RangeMin,
      p1_range_max: p1RangeMax,
      p2_range_min: p2RangeMin,
      p2_range_max: p2RangeMax,
      last_guess: guess,
    };

    if (guess === opponentSecret) {
      if (isP1) updates.p1_score = (game.p1_score || 0) + 1;
      else updates.p2_score = (game.p2_score || 0) + 1;
    }

    updateGameMutation.mutate(updates);
    setGuessInput("");
  };

  const isMutating =
    createRoomMutation.isPending ||
    joinRoomMutation.isPending ||
    updateGameMutation.isPending;

  // LOBBY UI
  if (phase === "lobby" && playerRole === 1 && game?.status === "waiting") {
    return (
      <div className="container max-w-md mx-auto p-4 py-20 text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Menunggu Lawan...</h1>
          <p className="text-muted-foreground">Bagikan kode ini ke lawanmu</p>
        </div>

        <div
          onClick={() => {
            navigator.clipboard.writeText(game.room_code || "");
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
          onClick={() => {
            setGameId(null);
            setGameId(null); // Clear game ID
          }}
        >
          Batal
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-lg mx-auto p-4 flex-1 flex flex-col justify-center">
      {/* SCORING HEADER */}
      {game && game.status !== "waiting" && (
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
      )}

      {/* LOBBY / JOIN FORM */}
      {phase === "lobby" && !playerRole && (
        <Card className="bg-card/50 backdrop-blur-md">
          <CardHeader className="pb-4">
            <CardTitle>Lucky Duel Online</CardTitle>
            <CardDescription>
              Tebak angka rahasia lawanmu sebelum dia menebak angka rahasiamu!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Kamu</Label>
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2 border-r border-border/40 pr-4">
                <Label>Buat Room Baru</Label>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Max Range
                  </Label>
                  <Input
                    value={maxRangeInput}
                    onChange={(e) =>
                      handleNumberInput(e.target.value, setMaxRangeInput)
                    }
                    placeholder="100"
                    inputMode="numeric"
                  />
                </div>
                <Button
                  onClick={createRoom}
                  disabled={isMutating}
                  variant="outline"
                  className="w-full"
                >
                  BUAT ROOM
                </Button>
              </div>
              <div className="space-y-4">
                <Label>Gabung Room</Label>
                <div className="space-y-2">
                  <Input
                    placeholder="KODE ROOM"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                  />
                  <Button
                    onClick={joinRoom}
                    disabled={isMutating}
                    className="w-full"
                  >
                    JOIN
                  </Button>
                </div>
              </div>
            </div>
            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* SETUP PHASE */}
      {(phase === "setup" || game?.status === "setup") && (
        <Card className="bg-card/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Setup Angka Rahasia</CardTitle>
            <CardDescription>
              Lawanmu sudah bergabung. Masukkan angka rahasia (1 -{" "}
              {formatNumber(
                (playerRole === 1 ? game?.p1_range_max : game?.p2_range_max) ??
                  100
              )}
              ).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="text"
              autoComplete="off"
              placeholder="Angka Rahasia"
              value={secretInput}
              onChange={(e) =>
                handleNumberInput(e.target.value, setSecretInput, 1000000000)
              }
              inputMode="numeric"
            />
            <Button
              onClick={submitSecret}
              disabled={
                isMutating ||
                (playerRole === 1
                  ? !!game?.player1_secret
                  : !!game?.player2_secret)
              }
              className="w-full"
            >
              {(
                playerRole === 1
                  ? !!game?.player1_secret
                  : !!game?.player2_secret
              )
                ? "Menunggu lawan..."
                : "SIAP!"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* PLAYING PHASE */}
      {phase === "playing" && game && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <Badge
              variant="outline"
              className={`text-lg px-4 py-1 border-primary/50 inline-flex items-center gap-3 mx-auto ${
                game.turn === playerRole! - 1
                  ? "text-emerald-400 border-emerald-400/50"
                  : "text-rose-400 border-rose-400/50"
              }`}
            >
              <span className={`relative flex h-3 w-3`}>
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    game.turn === playerRole! - 1
                      ? "bg-emerald-400"
                      : "bg-rose-400"
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    game.turn === playerRole! - 1
                      ? "bg-emerald-500"
                      : "bg-rose-500"
                  }`}
                ></span>
              </span>
              Giliran {game.turn === playerRole! - 1 ? "Kamu" : "Lawan"}
            </Badge>
            <h2 className="text-xl font-medium text-muted-foreground flex items-center justify-center gap-2">
              Target:{" "}
              {formatNumber(
                playerRole === 1 ? game.p2_range_min : game.p1_range_min
              )}{" "}
              -{" "}
              {formatNumber(
                playerRole === 1 ? game.p2_range_max : game.p1_range_max
              )}
            </h2>
            <div className="flex justify-center items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">Angka Kamu:</span>
              <Badge variant="secondary" className="font-mono">
                {showMySecret
                  ? playerRole === 1
                    ? game.player1_secret
                    : game.player2_secret
                  : "****"}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowMySecret(!showMySecret)}
              >
                {showMySecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Card
            className={`transition-all duration-300 ${
              warning
                ? "border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)] bg-yellow-500/10"
                : "bg-zinc-900/40"
            }`}
          >
            <CardContent className="pt-6 space-y-4">
              <div className="relative">
                <Input
                  disabled={game.turn !== playerRole! - 1}
                  placeholder="Tebakanmu..."
                  value={guessInput}
                  onChange={(e) =>
                    handleNumberInput(e.target.value, setGuessInput)
                  }
                  className={`text-2xl text-center h-16 bg-transparent transition-colors duration-300 ${
                    warning ? "text-yellow-500 border-yellow-500" : ""
                  }`}
                  inputMode="numeric"
                />
                {warning && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-bounce">
                    <AlertTriangle className="h-3 w-3" />
                    {warning === "too-low" ? "TOO LOW!" : "TOO HIGH!"}
                  </div>
                )}
              </div>
              <Button
                onClick={handleGuess}
                disabled={isMutating || game.turn !== playerRole! - 1}
                className={`w-full h-12 transition-all duration-300 ${
                  warning
                    ? "bg-yellow-500 hover:bg-yellow-600 text-black border-none"
                    : ""
                }`}
              >
                TEBAK!
              </Button>
            </CardContent>
          </Card>
          {game.last_guess && (
            <p className="text-center text-muted-foreground text-sm italic">
              Tebakan terakhir: {game.last_guess}
            </p>
          )}
        </div>
      )}

      {/* WINNER DIALOG */}
      <Dialog open={phase === "winner"}>
        <DialogContent className="text-center">
          <DialogHeader>
            <DialogTitle className="hidden">Game Over</DialogTitle>
            <DialogDescription className="text-lg text-center font-medium text-zinc-300 pt-4">
              {game?.winner_name ===
              (playerRole === 1 ? game?.player1_name : game?.player2_name) ? (
                <span className="text-primary text-3xl font-black italic tracking-tighter block animate-pulse">
                  CONGRATS! YOU WIN
                </span>
              ) : (
                <span className="text-rose-500 text-3xl font-black italic tracking-tighter block">
                  YOU LOSE...
                </span>
              )}
              <span className="mt-2 text-sm text-zinc-500 block">
                Pemenangnya adalah{" "}
                <span className="text-zinc-300">{game?.winner_name}</span>
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Button
              onClick={handleReset}
              className="w-full flex gap-2 h-12 font-bold"
            >
              MAIN LAGI <RefreshCw className="w-5 h-5" />
            </Button>
            <Link href="/" className="w-full">
              <Button
                variant="outline"
                className="w-full h-12 text-lg gap-2 border-white/10 hover:bg-white/5"
              >
                <ArrowLeft className="w-5 h-5" /> KEMBALI
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
