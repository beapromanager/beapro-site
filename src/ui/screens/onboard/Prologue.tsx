import { useEffect, useState } from 'react';
import { ShotFrame } from '../../onboard/ShotFrame.tsx';
import { preloadShots } from '../../onboard/shots.ts';
import type { ShotId } from '../../onboard/shots.ts';
import { nextPrologueStep, PROLOGUE_START, PROLOGUE_STEPS, walkPrologue } from '../../../game/prologueFlow.ts';
import type { ObChoice, PrologueStepId } from '../../../game/prologueFlow.ts';
import { obMark } from '../../../game/telemetry.ts';
import { Icon } from '../../components/Icon.tsx';

/**
 * ONBOARD_V2, plan T4: the real prologue, shot by shot (plan sections 2, 5,
 * 6). Every line of text here is code, not a baked-in image caption, per
 * the plan's own rule (section 6): the score, the minute, the caller's name
 * and every word of dialogue come from this file so the Hebrew is correct
 * and nothing an image generator invented ever reaches the screen.
 *
 * One state machine (src/game/prologueFlow.ts) drives it; this component
 * only reads the current step, renders its shot and words, and calls go()
 * on a tap. Reaching 'city' hands the chosen branch up to the caller
 * (App.tsx), which is what actually moves gs.phase — this component never
 * touches GameState.
 */

const TEAM = 'הקבוצה שלך בלאומית';

const CAPTIONS: Partial<Record<PrologueStepId, string>> = {
  'bench-shot': 'דקה 89. היציע כבר שותק.',
  goal5: 'וזה ה-5. איזה בושות! הקבוצה מתפרקת.',
  down: 'אתה עומד בקו, לבד עם זה.',
  sit: 'אתה מסתובב ויושב על הספסל. בלי מילה.',
  'bottle-kick': 'אתה בועט אותו בחזרה, לכיוון היציע של היריבה. הוא נוחת על המסלול הריק, רחוק מכל אדם.',
  'red-card': 'השופט מרים כרטיס אדום. מולך.',
  tunnel: 'אתה הולך למנהרה, לבד.',
  call: 'אני מאמין בך. פתחנו קבוצה חדשה בעיר. תעיף את העיר קדימה.',
  squad: 'זה הסגל החדש שלך. חבר׳ה מהשכונה, מגרש חול, בוקר שבת.',
};

/** what the beat AFTER `step` will show: both branch shots at the choice, the city backdrop at the end (plan section 7) */
function nextShots(step: PrologueStepId, choice: ObChoice = 'bench'): ShotId[] {
  if (step === 'choice') return ['s05a-sit', 's05b-bottle'];
  const n = nextPrologueStep(step, { choice });
  if (n === 'city') return ['s11-city'];
  return PROLOGUE_STEPS[n].shots as ShotId[];
}

/**
 * The next beat's still first, then the one after it (2.11, flow audit): a
 * quick tapper used to outrun a one-beat warm-up and land on an empty
 * gradient (the 5th goal and the sand pitch, ~0.8s and ~1.3s on a slow line).
 * Same files, same total bytes, just asked for one tap earlier.
 */
function warmShots(step: PrologueStepId, choice: ObChoice): ShotId[] {
  const near = nextShots(step, choice);
  if (step === 'choice') return [...near, 's06-red', 's07-tunnel'];
  const n = nextPrologueStep(step, { choice });
  return n === 'city' ? near : [...near, ...nextShots(n, choice)];
}

/** how far along his chosen path this beat is, 0..1, for the thin line on top */
function progressOf(step: PrologueStepId, choice: ObChoice): number {
  const path = walkPrologue(choice);
  const beats = path.length - 1;   // the last entry is 'city', the hand-off, not a beat
  const i = path.indexOf(step);
  return i < 0 ? 0 : (i + 1) / beats;
}

export function Prologue({ onDone }: { onDone: (choice: ObChoice) => void }) {
  const [step, setStep] = useState<PrologueStepId>(PROLOGUE_START);
  const [choice, setChoice] = useState<ObChoice>('bench');
  const [answered, setAnswered] = useState(false);

  useEffect(() => { obMark('ob_prologue'); }, []);
  useEffect(() => {
    preloadShots(warmShots(step, choice));
    setAnswered(false);
    if (step === 'goal5') obMark('ob_goal5');
    if (step === 'call') obMark('ob_call');
  }, [step]);

  function go(input?: { choice?: ObChoice; skip?: boolean }) {
    if (input?.skip) obMark('ob_skip');
    const n = nextPrologueStep(step, input);
    if (n === 'city') { onDone(input?.choice ?? choice); return; }
    setStep(n);
  }

  function pick(c: ObChoice) {
    setChoice(c);
    obMark(c === 'bottle' ? 'ob_choice_bottle' : 'ob_choice_bench');
    go({ choice: c });
  }

  function answer() {
    if (step === 'fired') obMark('ob_fired');
    setAnswered(true);
  }

  const shot = PROLOGUE_STEPS[step].shots[0] as ShotId;
  const skipBtn = (
    <>
      <div className="ob-progress" aria-hidden="true"><i style={{ width: `${Math.round(progressOf(step, choice) * 100)}%` }} /></div>
      <button className="ob-skip" onClick={() => go({ skip: true })} aria-label="דלג על הפרולוג">
        דלג <Icon name="chevron" size={13} />
      </button>
    </>
  );

  // ---- the choice: two buttons, no tap-anywhere here (plan section 2.2) ----
  if (step === 'choice') {
    return (
      <ShotFrame shot={shot} className="ob-full">
        {skipBtn}
        <div className="ob-cap">בקבוק עף מהיציע ונוחת לידך.</div>
        <div className="ob-choices">
          <button className="ob-choice-btn" onClick={() => pick('bench')}>לחזור לשבת על הספסל</button>
          <button className="ob-choice-btn" onClick={() => pick('bottle')}>לבעוט בבקבוק שעף למגרש</button>
        </div>
      </ShotFrame>
    );
  }

  // ---- the two phone calls: ringing, tap/answer, then tap to move on (plan section 2.3/2.4) ----
  if (step === 'fired' || step === 'morning') {
    const caller = step === 'fired' ? 'הבעלים' : 'מספר לא מוכר';
    return (
      <ShotFrame shot={shot} className="ob-full" playVideo={step === 'fired' && answered}>
        {skipBtn}
        <button className="ob-tap" aria-label={answered ? 'הקש להמשך' : 'הקש לענות'} onClick={() => (answered ? go() : answer())} />
        <div className="ob-phone">
          <span className="ob-ring"><Icon name="mic" size={22} color="var(--gold)" /></span>
          <div className="ob-caller">{answered ? caller : `שיחה נכנסת · ${caller}`}</div>
          {!answered && <button className="ob-answer" onClick={answer}>לענות</button>}
          {answered && step === 'fired' && (
            <div className="ob-msg">
              אל תחזור לחדר ההלבשה. אתה מפוטר.
              <br />
              {choice === 'bottle' ? 'ועוד אדום, בטלוויזיה.' : 'ישבת שם כמו בובה.'}
            </div>
          )}
          {answered && <div className="ob-tapHint" style={{ marginTop: 16 }}>הקש להמשך</div>}
        </div>
      </ShotFrame>
    );
  }

  // ---- every other beat: tap anywhere to advance (plan section 7) ----
  const score = step === 'stadium' ? "0 : 4" : step === 'goal5' ? "0 : 5" : null;
  return (
    <ShotFrame shot={shot} className="ob-full" shake={step === 'goal5'} flash={step === 'goal5'}>
      {skipBtn}
      <button className="ob-tap" aria-label="הקש להמשך" onClick={() => go()} />
      {step === 'stadium' && <div className="ob-eyebrow">אתה המאמן של {TEAM}</div>}
      {score && (
        <div className="ob-score">
          <b>{score}</b>
          <span>89′</span>
        </div>
      )}
      {step === 'call' ? (
        <div className="ob-cap" style={{ textAlign: 'start' }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--gold)', marginBottom: 7 }}>הבעלים החדש</div>
          {CAPTIONS.call}
        </div>
      ) : (
        CAPTIONS[step] && <div className="ob-cap">{CAPTIONS[step]}</div>
      )}
      <div className="ob-tapHint">הקש להמשך</div>
    </ShotFrame>
  );
}
