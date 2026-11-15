import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Search, Users, ArrowUpRight, Gamepad2, X, Play } from 'lucide-react';
import { games, type Game } from '@/lib/games';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useRoom } from './room-provider';

export function GameCard({ game, index = 0 }: { game: Game; index?: number }) {
  const { create } = useRoom();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function play() {
    try {
      setLoading(true);
      setError('');
      await create(game.id, 'Host');
      await navigate({ to: '/room' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create room');
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className={`game-card tone-${game.tone}`}>
      <div className="game-art">
        <img
          src={game.image}
          alt={`${game.name} original game artwork`}
          loading="lazy"
          decoding="async"
          width={1024}
          height={640}
        />
        <div className="game-art-shade" aria-hidden="true" />
        <span className="game-category">{game.category}</span>
        <span className="free-badge">FREE</span>
        <span className="game-art-number" aria-hidden="true">0{index + 1}</span>
        <span className="game-art-action" aria-hidden="true"><Play fill="currentColor" /></span>
      </div>

      <div className="game-card-body">
        <span className="game-tagline">{game.tagline}</span>
        <div className="game-title-row">
          <h3>{game.name}</h3>
          <ArrowUpRight size={20} />
        </div>

        <p>{game.description}</p>

        <div className="game-card-bottom">
          <span><Users size={15} />{game.min}–{game.max} players</span>
          <Button
            variant="secondary"
            disabled={loading}
            onClick={play}
            aria-label={`Play ${game.name}`}
          >
            {loading ? 'Creating...' : 'Play now'} <ArrowUpRight />
          </Button>
        </div>

        {error && <p className="error-message" role="alert">{error}</p>}
      </div>
    </article>
  );
}

export function GameLibrary({ compact = false }: { compact?: boolean }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All games');

  const filtered = games.filter(
    game =>
      (category === 'All games' || game.category === category) &&
      `${game.name} ${game.description}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className={`library-section page-width${compact ? ' library-compact' : ''}`}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">01 / CHOOSE YOUR ARENA</span>
          <h2>{compact ? <>Four games. <span>Infinite rematches.</span></> : <>All games. <span>All free.</span></>}</h2>
          <p>A little friendly competition never hurt anyone.</p>
        </div>
        <span className="game-total"><Gamepad2 /> {games.length} original games · Endless rematches</span>
      </div>

      <div className="library-toolbar">
        <div className="category-filters" aria-label="Filter games by category">
          {['All games', 'Arcade', 'Trivia', 'Strategy', 'Racing'].map(item => (
            <Button
              key={item}
              variant={item === category ? 'secondary' : 'ghost'}
              aria-pressed={item === category}
              onClick={() => setCategory(item)}
            >
              {item === 'All games' && <Gamepad2 />}
              {item}
            </Button>
          ))}
        </div>

        <div className="search-field">
          <Search size={17} />
          <Input
            aria-label="Search games"
            placeholder="Find your game..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
          {search && (
            <Button variant="ghost" size="icon" aria-label="Clear search" onClick={() => setSearch('')}>
              <X />
            </Button>
          )}
        </div>
      </div>

      {filtered.length ? (
        <div className="game-grid">
          {filtered.map(game => (
            <GameCard key={game.id} game={game} index={games.indexOf(game)} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Search />
          <h3>No games found</h3>
          <p>Try another search or category.</p>
          <Button variant="outline" onClick={() => { setSearch(''); setCategory('All games'); }}>
            Reset filters
          </Button>
        </div>
      )}
    </section>
  );
}
