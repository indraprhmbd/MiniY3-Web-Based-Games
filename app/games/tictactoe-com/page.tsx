"use client";

import React, { useState, useEffect } from "react";
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
import { RefreshCw, Trophy, Minus, Monitor, User } from "lucide-react";

type Player = "X" | "O";
type Cell = Player | null;
type Board = Cell[];

const WIN_CONDITIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // Rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // Cols
  [0, 4, 8],
  [2, 4, 6], // Diagonals
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

// Minimax algorithm for optimal move
function minimax(board: Board, depth: number, isMaximizing: boolean): number {
  const result = checkWinner(board);
  if (result === "O") return 10 - depth; // Computer wins
  if (result === "X") return depth - 10; // Player wins
  if (result === "draw") return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = "O";
        const score = minimax(board, depth + 1, false);
        board[i] = null;
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = "X";
        const score = minimax(board, depth + 1, true);
        board[i] = null;
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}

function findBestMove(board: Board): number {
  let bestScore = -Infinity;
  let move = -1;
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = "O";
      const score = minimax(board, 0, false);
      board[i] = null;
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  return move;
}

export default function TicTacToeComPage() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(true);
  const [winner, setWinner] = useState<Player | "draw" | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  // Computer's move logic
  useEffect(() => {
    if (!isPlayerTurn && !winner) {
      setIsThinking(true);
      const timer = setTimeout(() => {
        const bestMove = findBestMove(board);
        if (bestMove !== -1) {
          makeMove(bestMove, "O");
        }
        setIsThinking(false);
      }, 600); // Small delay to make it feel natural
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, winner, board]);

  const makeMove = (index: number, player: Player) => {
    const newBoard = [...board];
    newBoard[index] = player;
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) {
      setWinner(result);
    } else {
      setIsPlayerTurn(player === "O");
    }
  };

  const handleCellClick = (index: number) => {
    if (board[index] || winner || !isPlayerTurn) return;
    makeMove(index, "X");
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setWinner(null);
  };

  return (
    <div className="container max-w-lg mx-auto p-4 flex-1 flex flex-col justify-center">
      <Card className="w-full border-border/40 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Tic Tac Toe</CardTitle>
          <CardDescription>Mode VS Komputer - Strategi Optimal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center gap-4">
            <Badge
              variant={isPlayerTurn ? "default" : "outline"}
              className={`text-sm px-4 py-1 flex gap-2 items-center ${
                isPlayerTurn
                  ? "bg-blue-500/20 text-blue-400 border-blue-500/50"
                  : ""
              }`}
            >
              <User className="w-4 h-4" /> Kamu (X)
            </Badge>
            <Badge
              variant={!isPlayerTurn ? "default" : "outline"}
              className={`text-sm px-4 py-1 flex gap-2 items-center ${
                !isPlayerTurn
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/50"
                  : ""
              }`}
            >
              <Monitor className="w-4 h-4" /> Komputer (O)
            </Badge>
          </div>

          {/* Game Board */}
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto aspect-square relative">
            {board.map((cell, index) => (
              <button
                key={index}
                onClick={() => handleCellClick(index)}
                disabled={!!cell || !!winner || !isPlayerTurn}
                className={`
                  aspect-square rounded-lg text-4xl font-bold
                  transition-all duration-200
                  ${
                    cell
                      ? "bg-zinc-800 cursor-default"
                      : isPlayerTurn
                      ? "bg-zinc-900 hover:bg-zinc-800 cursor-pointer"
                      : "bg-zinc-900 cursor-wait"
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
            {isThinking && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] pointer-events-none rounded-lg">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce delay-0" />
                  <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce delay-150" />
                  <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce delay-300" />
                </div>
              </div>
            )}
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
                  <Trophy
                    className={
                      winner === "X" ? "text-blue-400" : "text-rose-400"
                    }
                  />
                  <span>
                    {winner === "X" ? "Kamu Menang!" : "Komputer Menang!"}
                  </span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-lg text-center font-medium text-zinc-300">
              {winner === "draw"
                ? "Pertandingan yang seimbang."
                : winner === "X"
                ? "Hebat! Kamu berhasil mengalahkan AI."
                : "Jangan menyerah! Coba strategi lain."}
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
