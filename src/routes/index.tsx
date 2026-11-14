
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import {
  ArrowRight,
  Play,
  Smartphone,
  Users,
  Monitor,
  Download,
  Check,
  Zap,
  Gamepad2,
} from 'lucide-react';

import hero from '@/assets/gaming-hero.jpg';
import { games, pageHead } from '@/lib/games';
import { GameLibrary } from '@/components/game-library';
import { HowSteps } from '@/components/how-steps';
import { Button } from '@/components/ui/button';
import { useRoom } from '@/components/room-provider';

export const Route = createFileRoute('/')({
  head: () =>
    pageHead(
      'Your phone. Your controller. Your game.',
      'Free original party games for your big screen. Bring your phone and your friends to AIR GAMES.'
    ),
  component: Index,
});

function Index() {
  const { create } = useRoom();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function play(id = 'snake') {
    try {
      setLoading(true);
      setError('');
      await create(id, 'Host');
      await navigate({ to: '/room' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create room');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="hero">
        <img
          className="hero-image"
          src={hero}
          alt="AIR GAMES snake arena on a big screen with smartphone controllers"
          width={1536}
          height={864}
          fetchPriority="high"
        />

        <div className="hero-content page-width">
          <span className="hero-label">
            <Zap /> BIG SCREEN. SMALL PHONE. ENDLESS FUN.
          </span>

          <h1>
            YOUR PHONE.<br />
            YOUR CONTROLLER.<br />
            <span>YOUR GAME.</span>
          </h1>

          <p className="hero-copy">
            Turn your living room into a game room.<br />
            Free multiplayer games. Your phone is the controller.<br />
            All you need is your people.
          </p>

          <div className="hero-buttons">
            <Button
              variant="gaming"
              size="lg"
              disabled={loading}
              onClick={() => play()}
            >
              <Play fill="currentColor" />
              {loading ? 'Creating room...' : 'Play now'}
              <ArrowRight />
            </Button>

            <Button variant="outline" size="lg" asChild>
              <Link to="/games">
                Explore games <ArrowRight />
              </Link>
            </Button>
          </div>

          {error && <p className="error-message" role="alert">{error}</p>}

          <div className="hero-perks">
            <span><Check />100% free</span>
            <span><Check />No downloads</span>
            <span><Check />Just bring your phone</span>
          </div>
        </div>
      </section>

      <div className="trust-strip">
        <div className="trust-inner page-width">
          <span><Monitor />Any big screen</span>
          <span><Smartphone />Your phone is the controller</span>
          <span><Users />2–8 players</span>
          <span><Download />No installs. No hassle.</span>
        </div>
      </div>

      <div className="featured-band page-width">
        <div>
          <img
            src={games[0].image}
            alt="Featured Snake Battle"
            width={1024}
            height={640}
          />
          <div>
            <span className="featured-tag">IN THE SPOTLIGHT</span>
            <h3>Snake Battle</h3>
            <p>Four friends. One arena. Only one survivor.</p>
          </div>
        </div>

        <Button variant="ghost" disabled={loading} onClick={() => play()}>
          <Gamepad2 />Jump into the battle <ArrowRight />
        </Button>
      </div>

      <GameLibrary compact />
      <HowSteps />
    </>
  );
}
