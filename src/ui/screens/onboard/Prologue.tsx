import { useEffect, useState } from 'react';
import { ShotFrame } from '../../onboard/ShotFrame.tsx';
import type { ShotId } from '../../onboard/shots.ts';
import { nextPrologueStep, PROLOGUE_START, PROLOGUE_STEPS } from '../../../game/prologueFlow.ts';
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
  'bench-shot': `דקה 89 ב${TEAM}. היציע כבר שותק.`,
  goal5: 'גול חמישי. נגמר.',
  down: 'אתה עומד בקו, לבד עם זה.',
  sit: 'אתה מסתובב ויושב על הספסל. בלי מילה.',
  'bottle-kick': 'אתה בועט אותו הצידה, לדשא הריק. רחוק מכולם.',
  'red-card': 'השופט מרים כרטיס אדום. מולך.',
  tunnel: 'אתה הולך למנהרה, לבד.',
  call: 'אני מאמין בך. פתחנו קבוצה חדשה בעיר. תעיף את העיר קדימה.',
};

export function Prologue({ onDone }: { onDone: (choice: ObChoice) => void }) {
  const [step, setStep] = useState<PrologueStepId>(PROLOGUE_START);
  const [choice, setChoice] = useState<ObChoice>('bench');
  const [answered, setAnswered] = useState(false);

  useEffect(() => { obMark('ob_prologue'); }, []);
  useEffect(() => {
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
    <button className="ob-skip" onClick={() => go({ skip: true })} aria-label="דלג על הפרולוג">
      דלג <Icon name="chevron" size={13} />
    </button>
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
      <ShotFrame shot={shot} className="ob-full">
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
