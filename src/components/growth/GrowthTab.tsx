import { Zap } from 'lucide-react';
import type { useFriction } from '../../hooks/useFriction';

type FrictionHook = ReturnType<typeof useFriction>;

interface GrowthTabProps {
  friction: FrictionHook;
}

export function GrowthTab({ friction }: GrowthTabProps) {
  const items = [
    {
      id: 'feed',
      title: 'Feed Hide (Eradicator)',
      desc: 'Hides the central home feed on Facebook, YouTube, and X to prevent mindless scrolling.',
      icon: '🙈',
      state: friction.feedHide,
      setter: friction.setFeedHide,
      key: 'ls_friction_feedhide',
    },
    {
      id: 'visual',
      title: 'Visual Friction (Dopamine Drain)',
      desc: 'Gradually turns social media sites grayscale over 5 minutes to reduce dopamine.',
      icon: '👁️',
      state: friction.visualFriction,
      setter: friction.setVisualFriction,
      key: 'ls_friction_visual',
    },
    {
      id: 'pay',
      title: 'Task-Driven Friction (Pay-to-Play)',
      desc: 'Costs 1 Focus Credit per minute to browse social sites. Earn credits by completing tasks.',
      icon: '💎',
      state: friction.payToPlay,
      setter: friction.setPayToPlay,
      key: 'ls_friction_pay',
    },
    {
      id: 'bumper',
      title: 'Doom-Scroll Bumper',
      desc: 'Freezes the page every 4 screen heights to break mindless scrolling loops.',
      icon: '🚧',
      state: friction.doomBumper,
      setter: friction.setDoomBumper,
      key: 'ls_friction_bumper',
    },
    {
      id: 'scroll',
      title: 'Heavy Scroll',
      desc: 'Makes scrolling physically harder and 60% slower on addictive sites.',
      icon: '⚓',
      state: friction.heavyScroll,
      setter: friction.setHeavyScroll,
      key: 'ls_friction_scroll',
    },
    {
      id: 'cognitive',
      title: 'Cognitive Bypass',
      desc: 'Requires typing a full sentence to temporarily unlock blocked adult content.',
      icon: '🧠',
      state: friction.cognitiveBypass,
      setter: friction.setCognitiveBypass,
      key: 'ls_friction_cognitive',
    },
    {
      id: 'temporal',
      title: 'Temporal Friction',
      desc: 'Adds a mandatory 10-second wait to Focus Gate buttons before proceeding.',
      icon: '⏳',
      state: friction.temporalFriction,
      setter: friction.setTemporalFriction,
      key: 'ls_friction_temporal',
    },
  ];

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/20">
            <Zap size={20} className="text-rose-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white/90">Growth Hacker</h2>
            <p className="text-[10px] text-white/40">Advanced Intentional Friction</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-amber-400">{friction.focusCredits}</div>
          <div className="text-[9px] text-white/40 uppercase tracking-wide">Focus Credits</div>
          <button
            onClick={() => {
              const newCredits = friction.focusCredits + 15;
              friction.setFocusCredits(newCredits);
              chrome.storage.local.set({ ls_focus_credits: newCredits });
            }}
            className="mt-1 text-[8px] font-bold border border-amber-500/30 text-amber-500 px-2 py-0.5 rounded-full hover:bg-amber-500/10 transition-colors"
          >
            Demo: Earn +15
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl flex items-center justify-between">
            <div className="flex gap-3 items-center pr-4">
              <div className="text-xl">{item.icon}</div>
              <div>
                <h3 className="text-[11px] font-semibold text-white/90">{item.title}</h3>
                <p className="mt-0.5 text-[9px] text-white/40 leading-relaxed">{item.desc}</p>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center shrink-0">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={item.state}
                onChange={(e) => friction.updateFriction(item.key, e.target.checked, item.setter)}
              />
              <div className="peer h-5 w-9 rounded-full bg-white/10 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white/70 after:transition-all after:content-[''] peer-checked:bg-rose-500 peer-checked:after:translate-x-full peer-checked:after:bg-white peer-focus:outline-none"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
