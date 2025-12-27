"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { PartyPopper, RefreshCw } from "lucide-react";

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
    const maxRange = parseInt(maxRangeInput) || 100;

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
    const secret = parseInt(secretInput);
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
    const guess = parseInt(guessInput);
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
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Lucky Duel Online
            </CardTitle>
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
                    type="number"
                    value={maxRangeInput}
                    onChange={(e) => setMaxRangeInput(e.target.value)}
                    placeholder="100"
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
              Lawanmu sudah bergabung. Masukkan angka rahasia (1-
              {playerRole === 1 ? game?.p1_range_max : game?.p2_range_max}).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Angka Rahasia"
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
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
              className="text-lg px-4 py-1 border-primary/50 text-primary"
            >
              Giliran {game.turn === playerRole! - 1 ? "Kamu" : "Lawan"}
            </Badge>
            <h2 className="text-xl font-medium text-muted-foreground">
              Target: {playerRole === 1 ? game.p2_range_min : game.p1_range_min}{" "}
              - {playerRole === 1 ? game.p2_range_max : game.p1_range_max}
            </h2>
          </div>

          <Card className="bg-zinc-900/40">
            <CardContent className="pt-6 space-y-4">
              <Input
                type="number"
                disabled={game.turn !== playerRole! - 1}
                placeholder="Tebakanmu..."
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                className="text-2xl text-center h-16"
              />
              <Button
                onClick={handleGuess}
                disabled={loading || game.turn !== playerRole! - 1}
                className="w-full h-12"
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
