# MiniY3 - Simple Web-Based Game Platform

MiniY3 is a lightweight, mobile-first web gaming platform designed for simple and fun interactions with friends. The platform follows a "Shell & Cartridge" architecture where the platform acts as a shell for multiple mini-games.

## Current Game: Lucky Number Duel

Lucky Number Duel is a turn-based guessing game where two players attempt to find each other's secret number.

### Features

- **Local Mode (Hotseat)**: Play with a friend on a single device.
- **Online Mode**: Play remotely with a friend using a Room Code system powered by Supabase.
- **Dynamic Range Narrowing**: The game automatically narrows the possible range of numbers based on previous guesses to help players win.
- **Mobile First Design**: Optimized for mobile browsers with a clean dark mode interface.
- **Professional UI**: Built using Shadcn/UI and Lucide icons (Emoji-free interface).

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
- Supabase Project (for Online Mode)

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

4. Setup Environment Variables:
   Create a `.env.local` file in the root directory with your Supabase credentials:

   ```text
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

## Database Schema (Supabase)

To enable Online Mode, run the following SQL script in your Supabase SQL Editor:

```sql
CREATE TABLE games (
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

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE games;
```

## Credits

Built by Indraprhmbd. © 2025 MiniY3.
