import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import {
  ArrowRight,
  Check,
  Download,
  Gamepad2,
  Monitor,
  Play,
  Smartphone,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';

import hero from '@/assets/gaming-hero.jpg';
import { pageHead } from '@/lib/games';
import { GameLibrary } from '@/components/game-library';
import { HowSteps } from '@/components/how-steps';
import { Button } from '@/components/ui/button';
import { useRoom } from '@/components/room-provider';

export const Route = createFileRoute('/')({
  head: () =>
    pageHead(
      'Your phone. Your controller. Your game.',
      'Free original multiplayer party games for your big screen. Turn every phone into a controller with AIR GAMES.'
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
      <section className="home-hero">
        <img
          className="home-hero-image"
          src={hero}
          alt="A neon Snake Battle arena on a big screen with two smartphone controllers"
          width={1536}
          height={864}
          fetchPriority="high"
          decoding="async"
        />
        <div className="home-hero-shade" aria-hidden="true" />
        <div className="home-hero-grid" aria-hidden="true" />

        <div className="home-hero-content page-width">
          <div className="home-hero-copy">
            <span className="hero-label">
              <span className="live-dot" aria-hidden="true" />
              THE PARTY STARTS HERE
              <span className="hero-label-divider" aria-hidden="true" />
              FREE TO PLAY
            </span>

            <h1>
              YOUR PHONE.<br />
              <span>YOUR CONTROLLER.</span><br />
              YOUR GAME.
            </h1>

            <p className="hero-copy">
              Turn any screen into a multiplayer arena. Grab your friends,
              join with a room code, and play original party games together.
            </p>

            <div className="hero-buttons">
              <Button
                variant="gaming"
                size="lg"
                disabled={loading}
                onClick={() => play()}
              >
                <Play fill="currentColor" />
                {loading ? 'Creating room...' : 'Start playing'}
                <ArrowRight />
              </Button>

              <Button variant="outline" size="lg" asChild>
                <Link to="/games">
                  Explore games <ArrowRight />
                </Link>
              </Button>
            </div>

            {error && <p className="error-message" role="alert">{error}</p>}

            <div className="hero-perks" aria-label="AIR GAMES benefits">
              <span><Check />No console needed</span>
              <span><Check />No downloads</span>
              <span><Check />100% free</span>
            </div>
          </div>
        </div>

        <div className="hero-visual-ui" aria-hidden="true">
          <div className="hero-feature-card">
            <span className="hero-feature-icon"><Gamepad2 /></span>
            <span>
              <small>IN THE SPOTLIGHT</small>
              <strong>SNAKE BATTLE</strong>
            </span>
            <span className="hero-feature-number">01</span>
          </div>
          <div className="hero-controller-toast">
            <span className="toast-icon"><Smartphone /></span>
            <span>
              <strong>Controller ready</strong>
              <small>Join instantly with a room code</small>
            </span>
            <span className="toast-check"><Check /></span>
          </div>
        </div>

        <div className="home-hero-stats page-width">
          <div><strong>04</strong><span>Original games</span></div>
          <div><strong>08</strong><span>Players max</span></div>
          <div><strong>00</strong><span>Downloads</span></div>
          <div><strong>100%</strong><span>Free to play</span></div>
        </div>
      </section>

      <div className="trust-strip">
        <div className="trust-inner page-width">
          <span><Monitor />Any big screen</span>
          <span><Smartphone />Your phone is the controller</span>
          <span><Users />Made for 2–8 players</span>
          <span><Download />No installs. No hassle.</span>
        </div>
      </div>

      <GameLibrary compact />
      <HowSteps />

      <section className="why-section page-width">
        <div className="section-heading">
          <div>
            <span className="eyebrow">03 / BUILT FOR TOGETHER</span>
            <h2>Less setup. <span>More stories.</span></h2>
            <p>Everything you need for an effortless game night, and nothing you don’t.</p>
          </div>
        </div>

        <div className="benefits-grid">
          <article className="benefit-card benefit-card-large">
            <span className="benefit-icon"><Zap /></span>
            <span className="benefit-kicker">ZERO BARRIERS</span>
            <h3>No console. No downloads.<br />No problem.</h3>
            <p>Open AIR GAMES on your big screen, bring a phone for each player, and jump straight into the fun.</p>
            <div className="benefit-pills" aria-label="Included with AIR GAMES">
              <span><Check />Instant setup</span>
              <span><Check />Free games</span>
              <span><Check />Easy controls</span>
            </div>
            <Sparkles className="benefit-spark" aria-hidden="true" />
          </article>

          <article className="benefit-card benefit-card-cyan">
            <span className="benefit-icon"><Users /></span>
            <span className="benefit-kicker">SHARED SCREEN ENERGY</span>
            <h3>Better together.</h3>
            <p>Built for living rooms, friendly rivalries, family nights, and the rematch nobody saw coming.</p>
            <div className="benefit-players" aria-hidden="true">
              <span>YOU</span><span>+1</span><span>+2</span><span>+3</span><span>···</span>
            </div>
          </article>

          <article className="benefit-card benefit-card-blue">
            <span className="benefit-icon"><Trophy /></span>
            <span className="benefit-kicker">FOUR WAYS TO WIN</span>
            <h3>Original games.<br />Real rivalries.</h3>
            <p>Race, outsmart, survive, and buzz your way to bragging rights.</p>
            <Button variant="ghost" asChild>
              <Link to="/games">Meet the games <ArrowRight /></Link>
            </Button>
          </article>
        </div>
      </section>

      <section className="home-cta page-width">
        <div className="home-cta-glow" aria-hidden="true" />
        <div className="home-cta-copy">
          <span className="eyebrow">YOUR NEXT GAME NIGHT STARTS HERE</span>
          <h2>Bring your people.<br /><span>We’ll bring the games.</span></h2>
          <p>One big screen. A room full of friends. A very different kind of night in.</p>
          <div className="hero-buttons">
            <Button variant="gaming" size="lg" disabled={loading} onClick={() => play()}>
              <Play fill="currentColor" />
              {loading ? 'Creating room...' : 'Create a free room'}
              <ArrowRight />
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/controller"><Smartphone />Join with your phone</Link>
            </Button>
          </div>
        </div>
        <div className="cta-emblem" aria-hidden="true">
          <span><Gamepad2 /></span>
          <small>AIR</small>
          <strong>GAMES</strong>
        </div>
      </section>
    </>
  );
}
