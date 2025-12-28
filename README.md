# MiniY3 - Simple Web-Based Game Platform

MiniY3 is a lightweight, mobile-first web gaming platform designed for simple and fun interactions with friends. The platform follows a "Shell & Cartridge" architecture where the platform acts as a shell for multiple mini-games.

## Games Collection

### 1. Lucky Number Duel

A turn-based guessing game where two players attempt to find each other's secret number.

- **VS Computer**: Practice against a simulated opponent.
- **Local Mode (Hotseat)**: Play with a friend on a single device.
- **Online Mode**: Play remotely using Room Codes.
- **Features**: Custom range (e.g., 1-100), dynamic range narrowing, and persistent scoring.

### 2. Battleship Mini

Strategy naval warfare in a compact 5x5 grid.

- **VS Computer**: Deploy your fleet and hunt down the AI's ships.
- **Online War**: Challenge a friend remotely.
- **Features**: Real-time turn updates, visual hit/miss indicators, and intense 3-ship combat.

### 3. Rock Paper Scissors (Batu Gunting Kertas)

The classic hand game to settle any dispute.

- **VS Computer**: Quick matches against an AI.
- **Online Duel**: Real-time remote duel with hidden choices until the reveal.
- **Features**: Premium animations, scoring tracking, and race-condition recovery.

### 4. Tic Tac Toe

The timeless game of X and O.

- **VS Computer**: Test your logic against an AI.
- **Local Mode**: Quick match on a single device.
- **Online Play**: Competitive play with friends over the internet.

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

Run these SQL scripts in your Supabase SQL Editor to enable Online Mode for all games:

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
  last_guess INTEGER,
  initial_max INTEGER DEFAULT 100,
  p1_score INTEGER DEFAULT 0,
  p2_score INTEGER DEFAULT 0
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

### Rock Paper Scissors (`rps_games`)

```sql
CREATE TABLE rps_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE NOT NULL,
  player1_name TEXT,
  player2_name TEXT,
  p1_choice TEXT,
  p2_choice TEXT,
  p1_score INTEGER DEFAULT 0,
  p2_score INTEGER DEFAULT 0,
  winner TEXT,
  status TEXT DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER PUBLICATION supabase_realtime ADD TABLE rps_games;
```

### Battleship Mini (`battleship_games`)

```sql
CREATE TABLE battleship_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE NOT NULL,
  player1_name TEXT,
  player2_name TEXT,
  p1_ships TEXT[],
  p2_ships TEXT[],
  p1_shots TEXT[],
  p2_shots TEXT[],
  p1_score INTEGER DEFAULT 0,
  p2_score INTEGER DEFAULT 0,
  turn INTEGER DEFAULT 0,
  status TEXT DEFAULT 'waiting',
  winner TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER PUBLICATION supabase_realtime ADD TABLE battleship_games;
```

## Credits

Built by Indraprhmbd. © 2025 MiniY3.
