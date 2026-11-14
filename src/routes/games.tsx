import { createFileRoute } from '@tanstack/react-router';
import { GameLibrary } from '@/components/game-library';
import { pageHead } from '@/lib/games';
export const Route = createFileRoute('/games')({ head: () => pageHead('Game library', 'Explore four original free party games, from Snake Battle to Mini Racing.'), component: Games });
function Games() { return <div className="interior-page"><GameLibrary /></div>; }