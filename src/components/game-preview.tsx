import { useEffect, useRef } from 'react';
import { getGame } from '@/lib/games';
export function GamePreview({ gameId, input = 'idle' }: { gameId: string; input?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const context = canvas.getContext('2d'); if (!context) return;
    const style = getComputedStyle(document.documentElement);
    const bg = style.getPropertyValue('--background').trim();
    const color = style.getPropertyValue(`--${getGame(gameId).tone === 'violet' ? 'primary' : getGame(gameId).tone}`).trim();
    const muted = style.getPropertyValue('--border').trim(); const text = style.getPropertyValue('--foreground').trim();
    let frame = 0; let animation = 0; const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    function draw() {
      if (!context || !canvas) return;
      const t = reduced ? 0 : frame / 35; frame++;
      context.fillStyle = bg; context.fillRect(0, 0, 600, 400);
      context.strokeStyle = muted; context.lineWidth = 1;
      for (let x = 0; x < 600; x += 30) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, 400); context.stroke(); }
      for (let y = 0; y < 400; y += 30) { context.beginPath(); context.moveTo(0, y); context.lineTo(600, y); context.stroke(); }
      context.fillStyle = color;
      if (gameId === 'snake') { for (let i = 0; i < 12; i++) context.fillRect(110 + i * 25, 170 + Math.sin(t + i * .3) * 40, 22, 22); }
      else if (gameId === 'quiz') { context.font = 'bold 130px sans-serif'; context.textAlign = 'center'; context.fillText('?', 300, 235); }
      else if (gameId === 'bomb') { context.beginPath(); context.arc(300, 185, 55 + Math.sin(t) * 5, 0, Math.PI * 2); context.fill(); context.fillRect(294, 112, 12, 25); }
      else { context.strokeStyle = color; context.lineWidth = 6; context.beginPath(); context.ellipse(300, 195, 195, 105, 0, 0, Math.PI * 2); context.stroke(); context.fillRect(290 + Math.cos(t) * 195, 185 + Math.sin(t) * 105, 26, 17); }
      context.fillStyle = text; context.textAlign = 'center'; context.font = '14px sans-serif'; context.fillText(input === 'idle' ? 'LOCAL VISUAL PREVIEW · NOT A PLAYABLE GAME' : `Controller input: ${input}`, 300, 365);
      if (!reduced) animation = requestAnimationFrame(draw);
    }
    draw(); return () => cancelAnimationFrame(animation);
  }, [gameId, input]);
  return <canvas ref={ref} width={600} height={400} className="canvas-preview" aria-label={`${getGame(gameId).name} local visual preview`} />;
}