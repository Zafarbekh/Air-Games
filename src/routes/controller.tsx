
import { createFileRoute, Link } from '@tanstack/react-router';
import { useRef, useState, type PointerEvent, type FormEvent } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Smartphone,
  ArrowLeft,
} from 'lucide-react';

import { useRoom } from '@/components/room-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GamePreview } from '@/components/game-preview';
import { validRoomCode } from '@/lib/network-room';
import { getGame, pageHead } from '@/lib/games';

export const Route = createFileRoute('/controller')({
  head: () =>
    pageHead(
      'Phone controller',
      'Join an AIR GAMES room using your phone.'
    ),
  component: Controller,
});

function Controller() {
  const { room, session, join, ready, leave } = useRoom();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [input, setInput] = useState('idle');

  const stick = useRef<HTMLDivElement>(null);

  const player = room?.players.find(
    p => p.id === session?.playerId
  );

  async function handleJoin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validRoomCode(code)) {
      setError('Enter a valid six-character room code.');
      return;
    }

    if (!name.trim()) {
      setError('Enter your player name.');
      return;
    }

    try {
      setJoining(true);
      setError('');
      await join(code, name.trim());
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Unable to join room.'
      );
    } finally {
      setJoining(false);
    }
  }

  function move(e: PointerEvent<HTMLDivElement>) {
    if (!e.buttons && e.pointerType === 'mouse') return;

    const bounds = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - bounds.left - bounds.width / 2;
    const dy = e.clientY - bounds.top - bounds.height / 2;

    const scale = Math.min(
      1,
      48 / Math.max(1, Math.hypot(dx, dy))
    );

    stick.current?.style.setProperty(
      '--stick-x',
      `${dx * scale}px`
    );

    stick.current?.style.setProperty(
      '--stick-y',
      `${dy * scale}px`
    );

    setInput(
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0 ? 'right' : 'left'
        : dy > 0 ? 'down' : 'up'
    );
  }

  function reset() {
    stick.current?.style.setProperty('--stick-x', '0px');
    stick.current?.style.setProperty('--stick-y', '0px');
    setInput('idle');
  }

  async function toggleReady() {
    if (!player) return;

    try {
      setError('');
      await ready(player.id);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Unable to change ready status.'
      );
    }
  }

  if (session && !room) {
    return (
      <section className="controller-page">
        <Smartphone size={30} />
        <h1>Connecting...</h1>
        <p className="demo-note">
          Connecting to room {session.code}. Please wait.
        </p>
      </section>
    );
  }

  if (!session || !room || !player) {
    return (
      <section className="controller-page">
        <span className="demo-label">
          <Smartphone size={15} />
          AIR GAMES phone controller
        </span>

        <h1>Join the party.</h1>

        <p className="demo-note">
          Enter the six-character room code shown on the big screen.
        </p>

        <form className="controller-form" onSubmit={handleJoin}>
          <label>
            Room code
            <Input
              aria-label="Room code"
              placeholder="ABC123"
              value={code}
              maxLength={6}
              autoCapitalize="characters"
              onChange={e =>
                setCode(
                  e.target.value
                    .replace(/[^a-z0-9]/gi, '')
                    .toUpperCase()
                )
              }
            />
          </label>

          <label>
            Player name
            <Input
              aria-label="Player name"
              placeholder="What should we call you?"
              value={name}
              maxLength={24}
              required
              onChange={e => setName(e.target.value)}
            />
          </label>

          {error && (
            <p className="error-message" role="alert">{error}</p>
          )}

          <Button
            variant="gaming"
            size="lg"
            type="submit"
            disabled={joining}
          >
            {joining ? 'Joining...' : 'Join room'}
          </Button>

          <Button variant="ghost" asChild>
            <Link to="/room">
              <ArrowLeft />Back to lobby
            </Link>
          </Button>
        </form>
      </section>
    );
  }

  const game = getGame(room.gameId);

  return (
    <section className="controller-page">
      <div className="controller-top">
        <h1>{player.name}</h1>
        <span className="eyebrow">
          {room.code} · {game.name}
        </span>
      </div>

      <GamePreview gameId={room.gameId} input={input} />

      <div className="controller-tools">
        <div
          className="joystick"
          ref={stick}
          role="application"
          tabIndex={0}
          aria-label="Virtual joystick"
          onPointerDown={e => {
            e.currentTarget.setPointerCapture(e.pointerId);
            move(e);
          }}
          onPointerMove={e => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) {
              move(e);
            }
          }}
          onPointerUp={reset}
          onPointerCancel={reset}
          onKeyDown={e => {
            if (
              ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
                .includes(e.key)
            ) {
              e.preventDefault();
              setInput(e.key.replace('Arrow', '').toLowerCase());
            }
          }}
          onKeyUp={reset}
        >
          <div className="joystick-directions">
            <ChevronUp />
            <ChevronDown />
            <ChevronLeft />
            <ChevronRight />
          </div>
          <span className="joystick-knob" />
        </div>

        <div className="action-buttons">
          <Button
            aria-label="Action A"
            onPointerDown={e => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setInput('A');
            }}
            onPointerUp={reset}
            onPointerCancel={reset}
            onKeyDown={() => setInput('A')}
            onKeyUp={reset}
          >
            A
          </Button>

          <Button
            aria-label="Action B"
            onPointerDown={e => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setInput('B');
            }}
            onPointerUp={reset}
            onPointerCancel={reset}
            onKeyDown={() => setInput('B')}
            onKeyUp={reset}
          >
            B
          </Button>
        </div>
      </div>

      <p className="controller-output" aria-live="polite">
        {input === 'idle' ? 'Controller idle' : `Input: ${input}`}
      </p>

      <Button
        variant={player.ready ? 'secondary' : 'gaming'}
        className="controller-ready"
        disabled={room.status !== 'lobby'}
        onClick={toggleReady}
      >
        <Check />
        {player.ready ? 'Ready for the party' : "I'm ready"}
      </Button>

      {error && (
        <p className="error-message" role="alert">{error}</p>
      )}

      <Button
        variant="ghost"
        className="mt-4 w-full"
        onClick={async () => {
          await leave();
        }}
      >
        <ArrowLeft />Leave room
      </Button>
    </section>
  );
}
