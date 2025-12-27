"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
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
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  PartyPopper,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";

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
  turn: number;
  winner_name: string | null;
  status: "waiting" | "setup" | "playing" | "finished";
  last_guess: number | null;
};

export default function LuckyDuelOnlinePage() {
  const [phase, setPhase] = useState<"lobby" | "setup" | "playing" | "winner">(
    "lobby"
  );
  const [roomCode, setRoomCode] = useState("");
  const [game, setGame] = useState<GameState | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [playerRole, setPlayerRole] = useState<1 | 2 | null>(null);
  const [secretInput, setSecretInput] = useState("");
  const [guessInput, setGuessInput] = useState("");
  const [maxRangeInput, setMaxRangeInput] = useState("100");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMySecret, setShowMySecret] = useState(false);
  const [warning, setWarning] = useState<"too-low" | "too-high" | null>(null);

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

  useEffect(() => {
    if (phase === "playing" && guessInput) {
      const currentGuess = parseInt(parseNumber(guessInput));
      const isP1 = playerRole === 1;
      const targetMin = isP1 ? game?.p2_range_min : game?.p1_range_min;
      const targetMax = isP1 ? game?.p2_range_max : game?.p1_range_max;

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

  // Polling for updates
  useEffect(() => {
    if (!game?.id || phase === "winner") return;

    const interval = setInterval(async () => {
      const { data, error } = await supabase
        .from("luckyduel_games")
        .select("*")
        .eq("id", game.id)
        .single();

      if (data) {
        setGame(data);

        // Phase logic based on status
        if (data.status === "setup") setPhase("setup");
        if (data.status === "playing") setPhase("playing");
        if (data.status === "finished") setPhase("winner");
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [game?.id, phase, playerRole]);

  const createRoom = async () => {
    if (!playerName) return setError("Masukkan namamu!");
    setLoading(true);
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    const maxRange = parseInt(parseNumber(maxRangeInput)) || 100;

    const { data, error } = await supabase
      .from("luckyduel_games")
      .insert([
        {
          room_code: code,
          player1_name: playerName,
          status: "waiting",
          p1_range_max: maxRange,
          p2_range_max: maxRange,
        },
      ])
      .select()
      .single();

    if (error) setError(error.message);
    else {
      setGame(data);
      setPlayerRole(1);
      setPhase("lobby");
    }
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!playerName || !roomCode)
      return setError("Nama dan Kode Room harus diisi!");
    setLoading(true);

    const { data, error } = await supabase
      .from("luckyduel_games")
      .update({ player2_name: playerName, status: "setup" })
      .eq("room_code", roomCode.toUpperCase())
      .select()
      .single();

    if (error) setError("Room tidak ditemukan atau error!");
    else {
      setGame(data);
      setPlayerRole(2);
      setPhase("setup");
    }
    setLoading(false);
  };

  const submitSecret = async () => {
    const secret = parseInt(parseNumber(secretInput));
    if (isNaN(secret)) return;
    setLoading(true);

    const update: any =
      playerRole === 1
        ? { player1_secret: secret }
        : { player2_secret: secret };

    // Check if the other secret is already there to start the game
    if (
      (playerRole === 1 && game?.player2_secret) ||
      (playerRole === 2 && game?.player1_secret)
    ) {
      update.status = "playing";
    }

    const { data, error } = await supabase
      .from("luckyduel_games")
      .update(update)
      .eq("id", game?.id)
      .select()
      .single();

    if (data) {
      setGame(data);
      if (data.status === "playing") {
        setPhase("playing");
      }
    }
    setLoading(false);
  };

  const handleGuess = async () => {
    const guess = parseInt(parseNumber(guessInput));
    if (isNaN(guess) || !game) return;
    setLoading(true);

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
      // Narrow range
      if (isP1) {
        // P1 is guessing for P2's secret
        if (guess < opponentSecret!)
          p2RangeMin = Math.max(p2RangeMin, guess + 1);
        else p2RangeMax = Math.min(p2RangeMax, guess - 1);
      } else {
        // P2 is guessing for P1's secret
        if (guess < opponentSecret!)
          p1RangeMin = Math.max(p1RangeMin, guess + 1);
        else p1RangeMax = Math.min(p1RangeMax, guess - 1);
      }
    }

    const { data, error } = await supabase
      .from("luckyduel_games")
      .update({
        turn: game.turn === 0 ? 1 : 0,
        status: nextStatus,
        winner_name: winner,
        p1_range_min: p1RangeMin,
        p1_range_max: p1RangeMax,
        p2_range_min: p2RangeMin,
        p2_range_max: p2RangeMax,
        last_guess: guess,
      })
      .eq("id", game.id)
      .select()
      .single();

    if (data) setGame(data);
    setGuessInput("");
    setLoading(false);
  };

  if (phase === "lobby" && playerRole === 1 && !game?.player2_name) {
    return (
      <div className="container max-w-lg mx-auto p-4 flex-1 flex flex-col justify-center">
        <Card className="text-center bg-card/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Menunggu Lawan...</CardTitle>
            <CardDescription>Bagikan kode ini ke lawan duelmu:</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold tracking-widest text-primary py-4 bg-zinc-900 rounded-lg">
              {game?.room_code}
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground animate-pulse">
              Otomatis pindah halaman jika lawan bergabung
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Common UI logic for setup, playing, winner...
  // (Simplified for brevity, similar to Hotseat but with sync)

  return (
    <div className="container max-w-lg mx-auto p-4 flex-1 flex flex-col justify-center">
      {phase === "lobby" && !playerRole && (
        <Card className="bg-card/50 backdrop-blur-md">
          <CardHeader className="pb-4">
            <div className="flex justify-center">
              <Image
                src="/games/lucky-duel.webp"
                alt="Lucky Duel Online"
                width={300}
                height={150}
                className="rounded-lg"
                priority
              />
            </div>
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
                  disabled={loading}
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
                    disabled={loading}
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
              type="password"
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
                loading ||
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
                disabled={loading || game.turn !== playerRole! - 1}
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

      <Dialog open={phase === "winner"}>
        <DialogContent className="text-center">
          <DialogHeader>
            <DialogTitle className="text-3xl text-center flex items-center justify-center gap-2">
              <PartyPopper className="text-primary" /> MENANG!{" "}
              <PartyPopper className="text-primary" />
            </DialogTitle>
            <DialogDescription className="text-center">
              {game?.winner_name} adalah juara duel kali ini!
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => window.location.reload()}
            className="w-full flex gap-2"
          >
            MAIN LAGI <RefreshCw className="w-5 h-5" />
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
