"use client";

import React, { useState, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RefreshCw, Trophy, Minus } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Player = "X" | "O";

type GameState = {
  id: string;
  room_code: string;
  player_x_name: string | null;
  player_o_name: string | null;
  board: string;
  current_turn: Player;
  x_score: number;
  o_score: number;
  winner: string | null;
  status: "waiting" | "playing" | "finished";
};

const WIN_CONDITIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function checkWinner(board: string): Player | "draw" | null {
  const cells = board.split("");
  for (const [a, b, c] of WIN_CONDITIONS) {
    if (cells[a] !== "-" && cells[a] === cells[b] && cells[a] === cells[c]) {
      return cells[a] as Player;
    }
  }
  if (!cells.includes("-")) {
    return "draw";
  }
  return null;
}

export default function TicTacToeOnlinePage() {
  const [phase, setPhase] = useState<"lobby" | "playing" | "finished">("lobby");
  const [roomCode, setRoomCode] = useState("");
  const [game, setGame] = useState<GameState | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [playerRole, setPlayerRole] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Polling for updates
  useEffect(() => {
    if (!game?.id) return; // Removed phase === "finished" guard

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("tictactoe_games")
        .select("*")
        .eq("id", game.id)
        .single();

      if (data) {
        setGame(data); // Always update game state
        if (data.status === "playing") setPhase("playing");
        // Only set finished if actually finished, but allow playing if status reverts to playing (reset)
        if (data.status === "finished") setPhase("finished");
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [game?.id, phase]);

  const createRoom = async () => {
    if (!playerName) return setError("Masukkan namamu!");
    setLoading(true);
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();

    const { data, error } = await supabase
      .from("tictactoe_games")
      .insert([
        { room_code: code, player_x_name: playerName, status: "waiting" },
      ])
      .select()
      .single();

    if (error) setError(error.message);
    else {
      setGame(data);
      setPlayerRole("X");
      setPhase("lobby");
    }
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!playerName || !roomCode)
      return setError("Nama dan Kode Room harus diisi!");
    setLoading(true);

    const { data, error } = await supabase
      .from("tictactoe_games")
      .update({ player_o_name: playerName, status: "playing" })
      .eq("room_code", roomCode.toUpperCase())
      .select()
      .single();

    if (error) setError("Room tidak ditemukan!");
    else {
      setGame(data);
      setPlayerRole("O");
      setPhase("playing");
    }
    setLoading(false);
  };

  const handleCellClick = async (index: number) => {
    if (!game || game.board[index] !== "-" || game.current_turn !== playerRole)
      return;
    setLoading(true);

    const newBoard = game.board.split("");
    newBoard[index] = playerRole!;
    const boardStr = newBoard.join("");

    const result = checkWinner(boardStr);
    let winnerName: string | null = null;
    let status = game.status;

    if (result === "X") {
      winnerName = game.player_x_name;
      status = "finished";
    } else if (result === "O") {
      winnerName = game.player_o_name;
      status = "finished";
    } else if (result === "draw") {
      winnerName = "draw";
      status = "finished";
    }

    const updates: any = {
      board: boardStr,
      current_turn: playerRole === "X" ? "O" : "X",
      winner: winnerName,
      status,
    };

    if (result === "X") updates.x_score = (game.x_score || 0) + 1;
    if (result === "O") updates.o_score = (game.o_score || 0) + 1;

    const { data } = await supabase
      .from("tictactoe_games")
      .update(updates)
      .eq("id", game.id)
      .select()
      .single();

    if (data) setGame(data);
    setLoading(false);
  };

  // Waiting for opponent
  if (phase === "lobby" && playerRole === "X" && !game?.player_o_name) {
    return (
      <div className="container max-w-md mx-auto p-4 py-20 text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Menunggu Lawan...</h1>
          <p className="text-muted-foreground">Bagikan kode ini ke lawanmu</p>
        </div>

        <div
          onClick={() => {
            navigator.clipboard.writeText(game?.room_code || "");
            alert("Kode room disalin!");
          }}
          className="bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-xl p-8 py-12 cursor-pointer hover:border-primary transition-colors group relative"
        >
          <div className="text-6xl font-mono font-black tracking-[0.5em] pl-4 text-white group-hover:scale-110 transition-transform">
            {game?.room_code}
          </div>
          <div className="absolute bottom-4 left-0 right-0 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            KLIK UNTUK COPY
          </div>
        </div>

        <Button
          variant="ghost"
          className="text-muted-foreground"
          onClick={() => {
            setGame(null);
            setPhase("lobby");
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
      {game && phase !== "lobby" && (
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
                {game.player_x_name}
              </div>
              <div className="text-xl font-black leading-none">
                {game.x_score || 0}
              </div>
            </div>
            <div className="text-zinc-600 font-bold text-sm">VS</div>
            <div className="text-left">
              <div className="text-[10px] text-muted-foreground uppercase leading-none mb-1 truncate max-w-[60px]">
                {game.player_o_name || "..."}
              </div>
              <div className="text-xl font-black leading-none">
                {game.o_score || 0}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mb-1">
              Role
            </div>
            <div className="font-bold text-[10px] text-emerald-400 leading-none">
              {playerRole}
            </div>
          </div>
        </div>
      )}

      {/* Lobby - Create/Join */}
      {phase === "lobby" && !playerRole && (
        <Card className="bg-card/50 backdrop-blur-md">
          <CardHeader className="pb-4">
            <div className="flex justify-center">
              <Image
                src="/games/tictactoe.webp"
                alt="Tic Tac Toe Online"
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
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={createRoom} disabled={loading} variant="outline">
                BUAT ROOM
              </Button>
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
            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Game Board */}
      {phase === "playing" && game && (
        <Card className="w-full border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardDescription>
              Kamu: {playerRole} vs Lawan: {playerRole === "X" ? "O" : "X"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <Badge
                variant="outline"
                className={`text-lg px-4 py-1 ${
                  game.current_turn === playerRole
                    ? "border-green-500 text-green-400"
                    : "border-zinc-600 text-zinc-400"
                }`}
              >
                {game.current_turn === playerRole
                  ? "Giliranmu!"
                  : "Giliran Lawan..."}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto aspect-square">
              {game.board.split("").map((cell, index) => (
                <button
                  key={index}
                  onClick={() => handleCellClick(index)}
                  disabled={
                    cell !== "-" || game.current_turn !== playerRole || loading
                  }
                  className={`
                    aspect-square rounded-lg text-4xl font-bold
                    transition-all duration-200
                    ${
                      cell !== "-"
                        ? "bg-zinc-800 cursor-default"
                        : "bg-zinc-900 hover:bg-zinc-800 cursor-pointer"
                    }
                    ${cell === "X" ? "text-blue-400" : ""}
                    ${cell === "O" ? "text-rose-400" : ""}
                    border border-zinc-700
                    flex items-center justify-center
                  `}
                >
                  {cell !== "-" ? cell : ""}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Winner/Draw Dialog */}
      <Dialog open={phase === "finished"}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-center sm:max-w-md">
          <DialogHeader>
            <DialogDescription className="text-lg text-center font-medium text-zinc-300 pt-4">
              {game?.winner === "draw" ? (
                <span className="text-yellow-500 text-3xl font-black italic tracking-tighter block animate-pulse">
                  IT'S A DRAW!
                </span>
              ) : game?.winner === playerName ? (
                <span className="text-primary text-3xl font-black italic tracking-tighter block animate-pulse">
                  CONGRATS! YOU WIN
                </span>
              ) : (
                <span className="text-rose-500 text-3xl font-black italic tracking-tighter block">
                  YOU LOSE...
                </span>
              )}
              <span className="mt-2 text-sm text-zinc-500 block">
                {game?.winner === "draw" ? (
                  "Permainan berakhir seri."
                ) : (
                  <>
                    Pemenangnya adalah{" "}
                    <span className="text-zinc-300">{game?.winner}</span>
                  </>
                )}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center gap-4">
            {/* Optional icon or graphic here if validation needed */}
          </div>
          <div className="py-4">
            <div className="grid gap-2">
              <Button
                className="w-full h-12 text-lg font-bold flex gap-2"
                onClick={async () => {
                  if (!game) return;
                  // Reset game state in DB
                  await supabase
                    .from("tictactoe_games")
                    .update({
                      board: "---------",
                      current_turn: "X",
                      winner: null,
                      status: "playing",
                    })
                    .eq("id", game.id);
                  setPhase("playing");
                }}
              >
                Main Lagi <RefreshCw className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 text-lg gap-2 border-white/10 hover:bg-white/5"
                onClick={() => (window.location.href = "/")}
              >
                KEMBALI
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
