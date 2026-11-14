import snake from '@/assets/snake-battle.jpg';
import quiz from '@/assets/quiz-battle.jpg';
import bomb from '@/assets/bomb-arena.jpg';
import racing from '@/assets/mini-racing.jpg';

export const games = [
  { id: 'snake', name: 'SNAKE BATTLE', category: 'Arcade', min: 2, max: 4, image: snake, tone: 'lime', tagline: 'Small snake. Big rivalry.', description: 'Outsmart your friends. Grow, dodge, and be the last snake standing.' },
  { id: 'quiz', name: 'QUIZ BATTLE', category: 'Trivia', min: 2, max: 8, image: quiz, tone: 'violet', tagline: 'Big brains. Bigger bragging rights.', description: 'Think fast and buzz first in the ultimate battle of knowledge.' },
  { id: 'bomb', name: 'BOMB ARENA', category: 'Strategy', min: 2, max: 4, image: bomb, tone: 'ember', tagline: 'Make your next move explosive.', description: 'Drop bombs, dodge blasts, and outplay your rivals in the arena.' },
  { id: 'racing', name: 'MINI RACING', category: 'Racing', min: 2, max: 4, image: racing, tone: 'cyan', tagline: 'Tiny cars. Massive competition.', description: 'Drift through tight corners and race your friends to the finish.' },
] as const;
export type Game = typeof games[number];
export function getGame(id: string): Game { return games.find(game => game.id === id) ?? games[0]; }
export function pageHead(title: string, description: string) {
  return { meta: [{ title: `${title} | AIR GAMES` }, { name: 'description', content: description }, { property: 'og:title', content: `${title} | AIR GAMES` }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] };
}