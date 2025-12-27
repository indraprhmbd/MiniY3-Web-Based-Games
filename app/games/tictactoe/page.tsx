"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { RefreshCw, Trophy, Minus } from "lucide-react";

type Player = "X" | "O";
type Cell = Player | null;
type Board = Cell[];

const WIN_CONDITIONS = [
  [0, 1, 2], // Top row
  [3, 4, 5], // Middle row
  [6, 7, 8], // Bottom row
  [0, 3, 6], // Left column
  [1, 4, 7], // Middle column
  [2, 5, 8], // Right column
  [0, 4, 8], // Diagonal
  [2, 4, 6], // Anti-diagonal
];

function checkWinner(board: Board): Player | "draw" | null {
  for (const [a, b, c] of WIN_CONDITIONS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  if (board.every((cell) => cell !== null)) {
    return "draw";
  }
  return null;
}

export default function TicTacToePage() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
  const [winner, setWinner] = useState<Player | "draw" | null>(null);

  const handleCellClick = (index: number) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) {
      setWinner(result);
    } else {
      setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setWinner(null);
  };

  return (
    <div className="container max-w-lg mx-auto p-4 flex-1 flex flex-col justify-center">
      <Card className="w-full border-border/40 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Tic Tac Toe</CardTitle>
          <CardDescription>Mode Lokal - Satu Layar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <Badge
              variant="outline"
              className="text-lg px-4 py-1 border-primary/50 text-primary"
            >
              Giliran: {currentPlayer}
            </Badge>
          </div>

          {/* Game Board */}
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto aspect-square">
            {board.map((cell, index) => (
              <button
                key={index}
                onClick={() => handleCellClick(index)}
                disabled={!!cell || !!winner}
                className={`
                  aspect-square rounded-lg text-4xl font-bold
                  transition-all duration-200
                  ${
                    cell
                      ? "bg-zinc-800 cursor-default"
                      : "bg-zinc-900 hover:bg-zinc-800 cursor-pointer"
                  }
                  ${cell === "X" ? "text-blue-400" : ""}
                  ${cell === "O" ? "text-rose-400" : ""}
                  border border-zinc-700
                  flex items-center justify-center
                `}
              >
                {cell}
              </button>
            ))}
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <Button variant="outline" onClick={resetGame} className="flex gap-2">
            <RefreshCw className="w-4 h-4" /> Reset
          </Button>
        </CardFooter>
      </Card>

      {/* Winner/Draw Dialog */}
      <Dialog open={winner !== null} onOpenChange={() => {}}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-center sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-3xl text-center pb-2 flex items-center justify-center gap-2">
              {winner === "draw" ? (
                <>
                  <Minus className="text-muted-foreground" /> Seri!{" "}
                  <Minus className="text-muted-foreground" />
                </>
              ) : (
                <>
                  <Trophy className="text-yellow-500" /> Pemenang:{" "}
                  <span
                    className={
                      winner === "X" ? "text-blue-400" : "text-rose-400"
                    }
                  >
                    {winner}
                  </span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-lg text-center font-medium text-zinc-300">
              {winner === "draw"
                ? "Tidak ada pemenang kali ini."
                : `Player ${winner} berhasil menyusun garis!`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Button
              className="w-full h-12 text-lg font-bold flex gap-2"
              onClick={resetGame}
            >
              Main Lagi <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
