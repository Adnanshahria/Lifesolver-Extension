import { useState, useCallback } from 'react';

export function useFriction() {
  const [pornBlockerActive, setPornBlockerActive] = useState(false);
  const [focusCredits, setFocusCredits] = useState(0);
  const [visualFriction, setVisualFriction] = useState(false);
  const [payToPlay, setPayToPlay] = useState(false);
  const [doomBumper, setDoomBumper] = useState(true);
  const [heavyScroll, setHeavyScroll] = useState(true);
  const [cognitiveBypass, setCognitiveBypass] = useState(true);
  const [temporalFriction, setTemporalFriction] = useState(true);
  const [feedHide, setFeedHide] = useState(false);

  const loadFrictionState = useCallback(() => {
    chrome.storage.local
      .get([
        'ls_porn_blocker_active',
        'ls_focus_credits',
        'ls_friction_visual',
        'ls_friction_pay',
        'ls_friction_bumper',
        'ls_friction_scroll',
        'ls_friction_cognitive',
        'ls_friction_temporal',
        'ls_friction_feedhide',
      ])
      .then((data) => {
        setPornBlockerActive(!!data.ls_porn_blocker_active);
        setFocusCredits((data.ls_focus_credits as number) || 0);
        setVisualFriction(!!data.ls_friction_visual);
        setPayToPlay(!!data.ls_friction_pay);
        setDoomBumper(data.ls_friction_bumper !== false);
        setHeavyScroll(data.ls_friction_scroll !== false);
        setCognitiveBypass(data.ls_friction_cognitive !== false);
        setTemporalFriction(data.ls_friction_temporal !== false);
        setFeedHide(!!data.ls_friction_feedhide);
      });
  }, []);

  const updateFriction = (key: string, val: boolean, setter: any) => {
    setter(val);
    chrome.storage.local.set({ [key]: val });
    chrome.runtime.sendMessage({ type: 'LS_FRICTION_UPDATE' });
  };

  const handleTogglePornBlocker = () => {
    const nextState = !pornBlockerActive;
    setPornBlockerActive(nextState);
    chrome.storage.local.set({ ls_porn_blocker_active: nextState });
    chrome.runtime.sendMessage({ type: 'LS_PORN_BLOCKER_UPDATE', active: nextState });
  };

  return {
    pornBlockerActive,
    focusCredits,
    setFocusCredits,
    visualFriction,
    setVisualFriction,
    payToPlay,
    setPayToPlay,
    doomBumper,
    setDoomBumper,
    heavyScroll,
    setHeavyScroll,
    cognitiveBypass,
    setCognitiveBypass,
    temporalFriction,
    setTemporalFriction,
    feedHide,
    setFeedHide,
    updateFriction,
    handleTogglePornBlocker,
    loadFrictionState,
  };
}
