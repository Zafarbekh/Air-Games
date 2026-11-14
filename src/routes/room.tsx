import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import {
  Check,
  Copy,
  QrCode,
  Users,
  Play,
  ArrowLeft,
} from 'lucide-react';

import { useRoom } from '@/components/room-provider';
import { Button } from '@/components/ui/button';
import { GamePreview } from '@/components/game-preview';
import { getGame, pageHead } from '@/lib/games';

export const Route = createFileRoute('/room')({
  head: () =>
    pageHead(
      'Party room',
      'Manage your AIR GAMES multiplayer room.'
    ),
  component: RoomPage,
});

function RoomPage() {
  const { room, session, start, leave } = useRoom();

  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!room) {
    return (
      <section className="empty-state room-page">
        <Users size={40} />
        <h2>No party room yet.</h2>
        <p>Pick a game to create your room.</p>
        <Button variant="gaming" asChild>
          <Link to="/games">Explore games</Link>
        </Button>
      </section>
    );
  }

  const game = getGame(room.gameId);
  const isHost = session?.playerId === room.hostPlayerId;
  const isPlaying = room.status === 'playing';

  const canStart =
    isHost &&
    !isPlaying &&
    room.players.length >= game.min &&
    room.players.every(player => player.ready);

  async function handleStart() {
    try {
      setLoading(true);
      setError('');
      await start();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to start game.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
  if (!room) return;

  try {
    await navigator.clipboard.writeText(room.code);
    setCopied(true);
    setError('');
  } catch {
    setError('Copy failed. You can select the room code manually.');
  }
}

  return (
    <section className="room-page page-width">
      <div className="room-heading">
        <h1>
          {isPlaying ? 'Game is starting!' : 'Your party starts here.'}
        </h1>
        <span className="demo-label">
          <Users size={15} />
          Online room
        </span>
      </div>

      <div className="room-layout">
        <div className="room-game">
          <img
            className="room-cover"
            src={game.image}
            alt={game.name}
            width={1024}
            height={640}
          />

          <h2>{game.name}</h2>
          <p>{game.description}</p>

          <p>
            <Users size={14} className="inline" />
            {' '}
            {game.min}–{game.max} players · {game.category}
          </p>

          {isPlaying && <GamePreview gameId={room.gameId} />}

          <p className="demo-note">
            Players connect using the room code on their phones.
          </p>
        </div>

        <div>
          <div className="room-code-panel">
            <div>
              <span className="eyebrow">YOUR ROOM CODE</span>
              <div className="room-code">{room.code}</div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
              >
                {copied ? <Check /> : <Copy />}
                {copied ? 'Copied!' : 'Copy code'}
              </Button>
            </div>

            <div
              className="qr-placeholder"
              aria-label="QR code coming soon"
            >
              <QrCode />
              <small>QR coming soon</small>
            </div>
          </div>

          <div className="lobby-title">
            <h2>Player lobby</h2>
            <span>
              {room.players.length} / {game.max} players
            </span>
          </div>

          {room.players.map(player => (
            <div key={player.id} className="player-row">
              <div className="player-info">
                <span className="player-avatar">
                  {player.name[0]?.toUpperCase()}
                </span>

                <span>
                  {player.name}
                  {player.isHost ? ' · Host' : ''}
                </span>
              </div>

              <span
                className={player.ready ? 'ready-text' : ''}
              >
                {player.ready ? (
                  <>
                    <Check size={14} className="inline" /> Ready
                  </>
                ) : (
                  'Not ready'
                )}
              </span>
            </div>
          ))}

          <div className="room-controls">
            {!isPlaying && isHost && (
              <Button
                variant="gaming"
                size="lg"
                disabled={!canStart || loading}
                onClick={handleStart}
              >
                <Play />
                {loading ? 'Starting...' : 'Start game'}
              </Button>
            )}

            {!isPlaying && !isHost && (
              <p className="demo-note">
                Waiting for the host to start the game.
                Mark yourself Ready on your phone controller.
              </p>
            )}

            <Button variant="outline" asChild>
              <Link to="/controller">Open phone controller</Link>
            </Button>

            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}

            <Button
              variant="ghost"
              onClick={() => void leave()}
            >
              <ArrowLeft />
              Exit room
            </Button>
          </div>

          <p className="demo-note">
            Room members and readiness are synchronized through the server.
          </p>
        </div>
      </div>
    </section>
  );
}