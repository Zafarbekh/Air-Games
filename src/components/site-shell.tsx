import { Link, useNavigate } from '@tanstack/react-router';
import { Gamepad2, ArrowUpRight, Smartphone, Menu, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRoom } from './room-provider';
export function Logo() { return <Link to="/" className="brand" aria-label="AIR GAMES home"><span className="brand-mark"><Gamepad2 /></span>AIR<span className="text-primary">GAMES</span></Link>; }
export function Header() {
  const [open, setOpen] = useState(false); const { create } = useRoom(); const navigate = useNavigate();
  return <header className="site-header"><div className="page-width header-inner"><Logo /><nav className={open ? 'main-nav nav-open' : 'main-nav'} aria-label="Main navigation"><Link to="/games" onClick={() => setOpen(false)}>Games</Link><Link to="/how-it-works" onClick={() => setOpen(false)}>How it works</Link><Link to="/about" onClick={() => setOpen(false)}>About</Link></nav><div className="header-actions"><Button variant="ghost" asChild className="join-nav"><Link to="/controller"><Smartphone />Join a room</Link></Button><Button variant="gaming" onClick={() => { create('snake'); navigate({ to: '/room' }); }}><Zap />Create room</Button><Button variant="ghost" size="icon" aria-label="Toggle navigation" className="mobile-menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button></div></div></header>;
}
export function Footer() { return <footer className="site-footer page-width"><div><Logo /><p>Good friends. Great games. Zero cost.</p></div><div className="footer-links"><Link to="/about">About</Link><Link to="/privacy">Privacy</Link><Link to="/contact">Contact <ArrowUpRight size={13} /></Link></div><span className="copyright">© 2026 AIR GAMES</span></footer>; }