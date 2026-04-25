import { useState, useEffect, useCallback } from 'react';
import { API } from '../lib/api';

export const DETOX_PRESETS = [
  { label: '30m', ms: 30 * 60 * 1000 },
  { label: '1h', ms: 60 * 60 * 1000 },
  { label: '2h', ms: 2 * 60 * 60 * 1000 },
  { label: '4h', ms: 4 * 60 * 60 * 1000 },
  { label: '8h', ms: 8 * 60 * 60 * 1000 },
];

export const BUILTIN_BLOCKED = [
  'youtube.com',
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'x.com',
  'tiktok.com',
  'reddit.com',
];

export function useDetox() {
  const [detoxActive, setDetoxActive] = useState(false);
  const [detoxEndTime, setDetoxEndTime] = useState<number | null>(null);
  const [detoxCustomSites, setDetoxCustomSites] = useState<string[]>([]);
  const [detoxTimeLeft, setDetoxTimeLeft] = useState('00:00:00');
  const [detoxProgress, setDetoxProgress] = useState(0);
  const [detoxDuration, setDetoxDuration] = useState<number | null>(null);
  const [detoxSelectedPreset, setDetoxSelectedPreset] = useState<string | null>(null);
  const [detoxCustomMinutes, setDetoxCustomMinutes] = useState('');
  const [detoxNewSite, setDetoxNewSite] = useState('');

  const [detoxOtpRequested, setDetoxOtpRequested] = useState(false);
  const [detoxOtp, setDetoxOtp] = useState('');
  const [detoxOtpError, setDetoxOtpError] = useState('');
  const [detoxOtpLoading, setDetoxOtpLoading] = useState(false);
  const [detoxMathProblem, setDetoxMathProblem] = useState({ a: 0, b: 0, op: '+' });
  const [detoxMathAnswer, setDetoxMathAnswer] = useState('');

  const loadDetoxState = useCallback(() => {
    chrome.storage.local
      .get(['ls_detox_active', 'ls_detox_end_time', 'ls_detox_custom_sites', 'ls_detox_duration'])
      .then((data) => {
        setDetoxActive(!!data.ls_detox_active);
        setDetoxEndTime((data.ls_detox_end_time as number) || null);
        setDetoxCustomSites((data.ls_detox_custom_sites as string[]) || []);
        if (data.ls_detox_duration) setDetoxDuration(data.ls_detox_duration as number);
      });
  }, []);

  useEffect(() => {
    loadDetoxState();
  }, [loadDetoxState]);

  // Countdown timer
  useEffect(() => {
    if (!detoxActive || !detoxEndTime) return;
    const tick = () => {
      const remaining = detoxEndTime - Date.now();
      if (remaining <= 0) {
        setDetoxTimeLeft('00:00:00');
        setDetoxProgress(100);
        setDetoxActive(false);
        setDetoxEndTime(null);
        return;
      }
      const totalSec = Math.ceil(remaining / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      setDetoxTimeLeft(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
      );
      if (detoxDuration) {
        const elapsed = detoxDuration - remaining;
        setDetoxProgress(Math.min(100, (elapsed / detoxDuration) * 100));
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [detoxActive, detoxEndTime, detoxDuration]);

  const handleStartDetox = () => {
    let durationMs =
      detoxSelectedPreset === 'custom'
        ? (parseInt(detoxCustomMinutes) || 0) * 60 * 1000
        : DETOX_PRESETS.find((p) => p.label === detoxSelectedPreset)?.ms || 0;
    if (durationMs <= 0) return;

    chrome.storage.local.set({ ls_detox_duration: durationMs });
    chrome.runtime.sendMessage(
      {
        type: 'LS_DETOX_START',
        duration: durationMs,
        customSites: detoxCustomSites,
      },
      (res: any) => {
        if (res?.success) {
          setDetoxActive(true);
          setDetoxEndTime(res.endTime);
          setDetoxDuration(durationMs);
          setDetoxOtpRequested(false);
          setDetoxOtp('');
          setDetoxOtpError('');
        }
      },
    );
  };

  const handleStopDetox = () => {
    chrome.runtime.sendMessage({ type: 'LS_DETOX_STOP' }, () => {
      setDetoxActive(false);
      setDetoxEndTime(null);
      setDetoxOtpRequested(false);
      setDetoxOtp('');
      setDetoxOtpError('');
    });
  };

  const handleRequestDetoxEnd = async () => {
    setDetoxOtpLoading(true);
    setDetoxOtpError('');
    const res = await API.requestDetoxOtp();
    if (res.success) {
      setDetoxOtpRequested(true);
      const ops = ['+', '-', '*'];
      const op = ops[Math.floor(Math.random() * ops.length)];
      const a = Math.floor(Math.random() * 20) + 10;
      const b = Math.floor(Math.random() * 20) + 5;
      setDetoxMathProblem({ a, b, op });
      setDetoxMathAnswer('');
    } else {
      setDetoxOtpError(res.error || 'Failed to send code');
    }
    setDetoxOtpLoading(false);
  };

  const handleVerifyDetoxEnd = async () => {
    if (detoxOtp.length < 6) {
      setDetoxOtpError('Please enter a 6-digit code');
      return;
    }
    const { a, b, op } = detoxMathProblem;
    let expected = 0;
    if (op === '+') expected = a + b;
    if (op === '-') expected = a - b;
    if (op === '*') expected = a * b;
    if (parseInt(detoxMathAnswer) !== expected) {
      setDetoxOtpError('Incorrect math answer!');
      return;
    }

    setDetoxOtpLoading(true);
    setDetoxOtpError('');
    const res = await API.verifyDetoxOtp(detoxOtp);
    if (res.success) {
      handleStopDetox();
    } else {
      setDetoxOtpError(res.error || 'Invalid code');
    }
    setDetoxOtpLoading(false);
  };

  const handleAddCustomSite = () => {
    const site = detoxNewSite
      .trim()
      .toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .replace(/\/.*$/, '');
    if (!site || detoxCustomSites.includes(site) || BUILTIN_BLOCKED.includes(site)) return;
    const updated = [...detoxCustomSites, site];
    setDetoxCustomSites(updated);
    setDetoxNewSite('');
    chrome.storage.local.set({ ls_detox_custom_sites: updated });
  };

  const handleRemoveCustomSite = (site: string) => {
    const updated = detoxCustomSites.filter((s) => s !== site);
    setDetoxCustomSites(updated);
    chrome.storage.local.set({ ls_detox_custom_sites: updated });
  };

  return {
    detoxActive,
    detoxEndTime,
    detoxCustomSites,
    detoxTimeLeft,
    detoxProgress,
    detoxDuration,
    detoxSelectedPreset,
    setDetoxSelectedPreset,
    detoxCustomMinutes,
    setDetoxCustomMinutes,
    detoxNewSite,
    setDetoxNewSite,
    detoxOtpRequested,
    setDetoxOtpRequested,
    detoxOtp,
    setDetoxOtp,
    detoxOtpError,
    setDetoxOtpError,
    detoxOtpLoading,
    detoxMathProblem,
    detoxMathAnswer,
    setDetoxMathAnswer,
    handleStartDetox,
    handleStopDetox,
    handleRequestDetoxEnd,
    handleVerifyDetoxEnd,
    handleAddCustomSite,
    handleRemoveCustomSite,
  };
}
