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
  const [checkoutGate, setCheckoutGate] = useState(true);
  const [focusGate, setFocusGate] = useState(true);
  const [autoPopup, setAutoPopup] = useState(true);
  const [feedHide, setFeedHide] = useState(false);
  const [feedHidePlatforms, setFeedHidePlatforms] = useState<Record<string, boolean>>({
    facebook: true,
    youtube: true,
    twitter: true,
    instagram: true,
    reddit: true,
  });

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
        'ls_friction_checkout_gate',
        'ls_friction_focus_gate',
        'ls_friction_auto_popup',
        'ls_friction_feedhide',
        'ls_friction_feedhide_platforms',
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
        setCheckoutGate(data.ls_friction_checkout_gate !== false);
        setFocusGate(data.ls_friction_focus_gate !== false);
        setAutoPopup(data.ls_friction_auto_popup !== false);
        setFeedHide(!!data.ls_friction_feedhide);
        if (data.ls_friction_feedhide_platforms) {
          setFeedHidePlatforms(data.ls_friction_feedhide_platforms as Record<string, boolean>);
        }
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
    checkoutGate,
    setCheckoutGate,
    focusGate,
    setFocusGate,
    autoPopup,
    setAutoPopup,
    feedHide,
    setFeedHide,
    feedHidePlatforms,
    setFeedHidePlatforms,
    updateFriction,
    handleTogglePornBlocker,
    loadFrictionState,
  };
}
