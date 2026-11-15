import { Monitor, Smartphone, Gamepad2, ArrowRight, Check } from 'lucide-react';

const steps = [
  {
    icon: Monitor,
    title: 'Open the big screen',
    text: 'Launch AIR GAMES on your computer or Smart TV and pick your game.',
    number: '01',
  },
  {
    icon: Smartphone,
    title: 'Join with your phone',
    text: 'Enter the room code on your phone. No app download, no extra hardware.',
    number: '02',
  },
  {
    icon: Gamepad2,
    title: 'Play. Win. Rematch.',
    text: 'Your phone becomes the controller. Bring your best game and your favorite people.',
    number: '03',
  },
];

export function HowSteps() {
  return (
    <section className="how-section">
      <div className="page-width">
        <div className="section-heading">
          <div>
            <span className="eyebrow">02 / HOW IT WORKS</span>
            <h2>Couch to competition <span>in seconds.</span></h2>
            <p>One shared screen. A controller in every pocket. Three simple steps.</p>
          </div>
          <span className="game-total">No console. No cables. No learning curve.</span>
        </div>

        <div className="how-layout">
          <div className="steps-grid">
            {steps.map(({ icon: Icon, title, text, number }, index) => (
              <article className="step" key={number}>
                <div className="step-top">
                  <span className="step-number">{number}</span>
                  <span className="step-icon"><Icon /></span>
                  {index < steps.length - 1 && <ArrowRight className="step-arrow" aria-hidden="true" />}
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>

          <div className="controller-showcase" aria-label="Illustration of the AIR GAMES phone controller">
            <div className="controller-glow" aria-hidden="true" />
            <div className="phone-shell" aria-hidden="true">
              <div className="phone-speaker" />
              <div className="phone-screen-top"><span>AIR GAMES</span><small>CONTROLLER</small></div>
              <div className="phone-room"><small>ROOM CODE</small><strong>AIR123</strong><span><Check /> Connected</span></div>
              <div className="phone-controls">
                <div className="phone-dpad"><span>↑</span><span>←</span><i /><span>→</span><span>↓</span></div>
                <div className="phone-actions"><span>A</span><span>B</span></div>
              </div>
            </div>
            <div className="controller-caption">
              <span className="live-dot" aria-hidden="true" />
              <span><strong>Already in your pocket</strong><small>Your phone is all you need.</small></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
