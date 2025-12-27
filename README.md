# MiniY3 - Simple Web-Based Game Platform

MiniY3 is a lightweight, mobile-first web gaming platform designed for simple and fun interactions with friends. The platform follows a "Shell & Cartridge" architecture where the platform acts as a shell for multiple mini-games.

## Games Collection

### 1. Lucky Number Duel

A turn-based guessing game where two players attempt to find each other's secret number.

- **Local Mode (Hotseat)**: Play with a friend on a single device.
- **Online Mode**: Play remotely using Room Codes.
- **Custom Range**: Room creators can set a custom maximum number (e.g., 1-100, 1-500, etc.).
- **Dynamic Range Narrowing**: Automatically narrows the possible range based on previous guesses.

### 2. Tic Tac Toe

The classic game of X and O.

- **Local Mode**: Quick match on a single device.
- **Online Mode**: Competitive play with friends over the internet using Room Codes.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **Components**: Shadcn/UI
- **Icons**: Lucide React
- **Backend/Database**: Supabase (PostgreSQL)
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase Project

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/indraprhmbd/MiniY3-Web-Based-Games.git
   ```
2. Navigate to the project directory:
   ```bash
   cd MiniY3-Web-Based-Games
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Setup Environment Variables in `.env.local`:
   ```text
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
5. Run the development server:
   ```bash
   npm run dev
   ```

## Database Schema (Supabase)

Run these SQL scripts in your Supabase SQL Editor to enable Online Mode:

### Lucky Duel (`luckyduel_games`)

```sql
CREATE TABLE luckyduel_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE NOT NULL,
  player1_name TEXT,
  player2_name TEXT,
  player1_secret INTEGER,
  player2_secret INTEGER,
  p1_range_min INTEGER DEFAULT 1,
  p1_range_max INTEGER DEFAULT 100,
  p2_range_min INTEGER DEFAULT 1,
  p2_range_max INTEGER DEFAULT 100,
  turn INTEGER DEFAULT 0,
  winner_name TEXT,
  status TEXT DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_guess INTEGER
);
ALTER PUBLICATION supabase_realtime ADD TABLE luckyduel_games;
```

### Tic Tac Toe (`tictactoe_games`)

```sql
CREATE TABLE tictactoe_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE NOT NULL,
  player_x_name TEXT,
  player_o_name TEXT,
  board TEXT DEFAULT '---------',
  current_turn TEXT DEFAULT 'X',
  winner TEXT,
  status TEXT DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER PUBLICATION supabase_realtime ADD TABLE tictactoe_games;
```

## Credits

Built by Indraprhmbd. © 2025 MiniY3.
