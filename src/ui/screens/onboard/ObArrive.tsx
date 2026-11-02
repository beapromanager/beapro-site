import { ShotFrame } from '../../onboard/ShotFrame.tsx';

/**
 * Since 2.11 (Itzik) the two from the לאומית do NOT come down with him here:
 * they stayed, and ask to follow only after match 1 (ObFriends.tsx). So the
 * caption says they stayed behind. The still (s12-loyal) is unchanged and
 * still shows two men with kit bags at the gate; the caption is written so
 * it never claims who they are.
 */
export const ARRIVE_CAPTION = 'החבר׳ה מהחדר בלאומית נשארו שם. פה אתה מתחיל מאפס.';

/**
 * ONBOARD_V2, plan T4 (section 2.6): the one beat between picking a city
 * and quickStart, shot s12-loyal. Pure tap-through, the same shape as every other
 * prologue beat, kept out of Prologue.tsx/prologueFlow.ts because it comes
 * after the city is already chosen rather than as part of the prologue's
 * own state machine (which ends at 'city').
 */
export function ObArriveScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <ShotFrame shot="s12-loyal" className="ob-full">
      <button className="ob-tap" aria-label="הקש להמשך" onClick={onContinue} />
      <div className="ob-cap">{ARRIVE_CAPTION}</div>
      <div className="ob-tapHint">הקש להמשך</div>
    </ShotFrame>
  );
}
