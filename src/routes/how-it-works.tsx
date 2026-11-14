import { createFileRoute, Link } from '@tanstack/react-router';
import { HowSteps } from '@/components/how-steps';
import { Button } from '@/components/ui/button';
import { pageHead } from '@/lib/games';
export const Route = createFileRoute('/how-it-works')({ head: () => pageHead('How it works', 'Bring your screen, phone, and friends. Discover how AIR GAMES party rooms work.'), component: How });
function How() { return <div className="interior-page"><HowSteps /><div className="page-width info-note"><h3>A sneak peek at the party</h3><p>This version is a local frontend demo. Rooms and players exist only in the current tab. Connecting separate phones and live multiplayer are not available yet.</p><Button variant="gaming" asChild><Link to="/games">Pick a game</Link></Button></div></div>; }