import { ShotFrame } from '../../onboard/ShotFrame.tsx';

/**
 * ONBOARD_V2, plan T4 (section 2.6): the one beat between picking a city
 * and quickStart — two players from the old dressing room followed him
 * down, shot s12-loyal. Pure tap-through, the same shape as every other
 * prologue beat, kept out of Prologue.tsx/prologueFlow.ts because it comes
 * after the city is already chosen rather than as part of the prologue's
 * own state machine (which ends at 'city').
 */
export function ObArriveScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <ShotFrame shot="s12-loyal" className="ob-full">
      <button className="ob-tap" aria-label="הקש להמשך" onClick={onContinue} />
      <div className="ob-cap">שניים מהחדר בלאומית לא נשארו שם בלעדיך.</div>
      <div className="ob-tapHint">הקש להמשך</div>
    </ShotFrame>
  );
}
