import { Link, useNavigate } from '@tanstack/react-router';
import { Gamepad2, ArrowUpRight, Smartphone, Menu, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRoom } from './room-provider';

export function Logo() {
  return (
    <Link to="/" className="brand" aria-label="AIR GAMES home">
      <span className="brand-mark"><Gamepad2 /></span>
      <span className="brand-wordmark">AIR<span>GAMES</span></span>
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { create } = useRoom();
  const navigate = useNavigate();

  async function createRoom() {
    try {
      setLoading(true);
      setError('');
      await create('snake', 'Host');
      await navigate({ to: '/room' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create room');
    } finally {
      setLoading(false);
    }
  }

  return (
    <header className="site-header">
      <div className="page-width header-inner">
        <Logo />

        <nav className={open ? 'main-nav nav-open' : 'main-nav'} aria-label="Main navigation">
          <Link to="/games" onClick={() => setOpen(false)}>Games</Link>
          <Link to="/how-it-works" onClick={() => setOpen(false)}>How it works</Link>
          <Link to="/about" onClick={() => setOpen(false)}>About</Link>
        </nav>

        <div className="header-actions">
          <Button variant="ghost" asChild className="join-nav">
            <Link to="/controller"><Smartphone />Join a room</Link>
          </Button>

          <Button variant="gaming" disabled={loading} onClick={createRoom}>
            <Zap />{loading ? 'Creating...' : 'Create room'}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle navigation"
            aria-expanded={open}
            className="mobile-menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
        {error && <p className="error-message header-error" role="alert">{error}</p>}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="page-width footer-main">
        <div className="footer-brand">
          <Logo />
          <p>Good friends. Great games. Zero cost.</p>
          <span><span className="live-dot" aria-hidden="true" /> BUILT FOR YOUR NEXT GAME NIGHT</span>
        </div>

        <div className="footer-column">
          <strong>EXPLORE</strong>
          <Link to="/games">All games</Link>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/controller">Join a room</Link>
        </div>

        <div className="footer-column">
          <strong>AIR GAMES</strong>
          <Link to="/about">About us</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/contact">Contact <ArrowUpRight size={13} /></Link>
        </div>

        <div className="footer-callout">
          <span>READY WHEN YOU ARE</span>
          <strong>One screen.<br />Endless possibilities.</strong>
          <Button variant="outline" size="sm" asChild>
            <Link to="/games">Choose your game <ArrowUpRight /></Link>
          </Button>
        </div>
      </div>

      <div className="page-width footer-bottom">
        <span className="copyright">© 2026 AIR GAMES. ALL RIGHTS RESERVED.</span>
        <span>ORIGINAL GAMES. SHARED MOMENTS.</span>
      </div>
    </footer>
  );
}
