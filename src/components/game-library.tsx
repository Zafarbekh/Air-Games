import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Search, Users, ArrowUpRight, Gamepad2, X } from 'lucide-react';
import { games, type Game } from '@/lib/games';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useRoom } from './room-provider';
export function GameCard({ game }: { game: Game }) {
  const { create } = useRoom(); const navigate = useNavigate();
  return <article className={`game-card tone-${game.tone}`}><div className="game-art"><img src={game.image} alt={`${game.name} original game artwork`} loading="lazy" width={1024} height={640} /><span className="game-category">{game.category}</span><span className="free-badge">FREE</span></div><div className="game-card-body"><div className="game-title-row"><h3>{game.name}</h3><ArrowUpRight size={18} /></div><p>{game.description}</p><div className="game-card-bottom"><span><Users size={14} />{game.min}–{game.max} players</span><Button variant="secondary" onClick={() => { create(game.id); navigate({ to: '/room' }); }}>Play <ArrowUpRight /></Button></div></div></article>;
}
export function GameLibrary({ compact = false }: { compact?: boolean }) {
  const [search, setSearch] = useState(''); const [category, setCategory] = useState('All games');
  const filtered = games.filter(g => (category === 'All games' || g.category === category) && `${g.name} ${g.description}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="library-section page-width"><div className="section-heading"><div><span className="eyebrow">PICK YOUR NEXT OBSESSION</span><h2>{compact ? 'The good times start here.' : 'All games. All free.'}</h2><p>A little friendly competition never hurt anyone.</p></div><span className="game-total">{games.length} games · Endless rematches</span></div><div className="library-toolbar"><div className="category-filters">{['All games', 'Arcade', 'Trivia', 'Strategy', 'Racing'].map(c => <Button key={c} variant={c === category ? 'secondary' : 'ghost'} onClick={() => setCategory(c)}>{c === 'All games' && <Gamepad2 />}{c}</Button>)}</div><div className="search-field"><Search size={16} /><Input aria-label="Search games" placeholder="Find your game..." value={search} onChange={e => setSearch(e.target.value)} />{search && <Button variant="ghost" size="icon" aria-label="Clear search" onClick={() => setSearch('')}><X /></Button>}</div></div>{filtered.length ? <div className="game-grid">{filtered.map(game => <GameCard key={game.id} game={game} />)}</div> : <div className="empty-state"><Search /><h3>No games found</h3><p>Try another search or category.</p><Button variant="outline" onClick={() => { setSearch(''); setCategory('All games'); }}>Reset filters</Button></div>}</section>;
}