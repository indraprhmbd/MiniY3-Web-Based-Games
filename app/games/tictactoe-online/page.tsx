"use client";

import React, { useState, useEffect } from "react";
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
    if (!game?.id || phase === "finished") return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("tictactoe_games")
        .select("*")
        .eq("id", game.id)
        .single();

      if (data) {
        setGame(data);
        if (data.status === "playing") setPhase("playing");
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

    const { data } = await supabase
      .from("tictactoe_games")
      .update({
        board: boardStr,
        current_turn: playerRole === "X" ? "O" : "X",
        winner: winnerName,
        status,
      })
      .eq("id", game.id)
      .select()
      .single();

    if (data) setGame(data);
    setLoading(false);
  };

  // Waiting for opponent
  if (phase === "lobby" && playerRole === "X" && !game?.player_o_name) {
    return (
      <div className="container max-w-lg mx-auto p-4 flex-1 flex flex-col justify-center">
        <Card className="text-center bg-card/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Menunggu Lawan...</CardTitle>
            <CardDescription>Bagikan kode ini ke lawan:</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold tracking-widest text-primary py-4 bg-zinc-900 rounded-lg">
              {game?.room_code}
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground animate-pulse">
              Kamu adalah Player X
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-lg mx-auto p-4 flex-1 flex flex-col justify-center">
      {/* Lobby - Create/Join */}
      {phase === "lobby" && !playerRole && (
        <Card className="bg-card/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Tic Tac Toe Online
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
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Tic Tac Toe</CardTitle>
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
            <DialogTitle className="text-3xl text-center pb-2 flex items-center justify-center gap-2">
              {game?.winner === "draw" ? (
                <>
                  <Minus className="text-muted-foreground" /> Seri!{" "}
                  <Minus className="text-muted-foreground" />
                </>
              ) : (
                <>
                  <Trophy className="text-yellow-500" /> {game?.winner} Menang!
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-lg text-center font-medium text-zinc-300">
              {game?.winner === "draw"
                ? "Tidak ada pemenang kali ini."
                : `${game?.winner} berhasil menyusun garis!`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Button
              className="w-full h-12 text-lg font-bold flex gap-2"
              onClick={() => window.location.reload()}
            >
              Main Lagi <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
