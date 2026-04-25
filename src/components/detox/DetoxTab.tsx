import { DetoxSetup } from './DetoxSetup';
import { DetoxActive } from './DetoxActive';
import type { useDetox } from '../../hooks/useDetox';
import type { useFriction } from '../../hooks/useFriction';

type DetoxHook = ReturnType<typeof useDetox>;
type FrictionHook = ReturnType<typeof useFriction>;

interface DetoxTabProps {
  detox: DetoxHook;
  pornBlockerActive: FrictionHook['pornBlockerActive'];
  handleTogglePornBlocker: FrictionHook['handleTogglePornBlocker'];
}

export function DetoxTab({ detox, pornBlockerActive, handleTogglePornBlocker }: DetoxTabProps) {
  return (
    <div className="space-y-4 pb-4">
      {!detox.detoxActive ? (
        <DetoxSetup
          detoxSelectedPreset={detox.detoxSelectedPreset}
          setDetoxSelectedPreset={detox.setDetoxSelectedPreset}
          detoxCustomMinutes={detox.detoxCustomMinutes}
          setDetoxCustomMinutes={detox.setDetoxCustomMinutes}
          detoxCustomSites={detox.detoxCustomSites}
          detoxNewSite={detox.detoxNewSite}
          setDetoxNewSite={detox.setDetoxNewSite}
          onAddCustomSite={detox.handleAddCustomSite}
          onRemoveCustomSite={detox.handleRemoveCustomSite}
          onStartDetox={detox.handleStartDetox}
          pornBlockerActive={pornBlockerActive}
          onTogglePornBlocker={handleTogglePornBlocker}
        />
      ) : (
        <DetoxActive
          detoxTimeLeft={detox.detoxTimeLeft}
          detoxProgress={detox.detoxProgress}
          detoxCustomSites={detox.detoxCustomSites}
          detoxOtpRequested={detox.detoxOtpRequested}
          detoxOtpLoading={detox.detoxOtpLoading}
          detoxOtp={detox.detoxOtp}
          setDetoxOtp={detox.setDetoxOtp}
          detoxOtpError={detox.detoxOtpError}
          setDetoxOtpError={detox.setDetoxOtpError}
          detoxMathProblem={detox.detoxMathProblem}
          detoxMathAnswer={detox.detoxMathAnswer}
          setDetoxMathAnswer={detox.setDetoxMathAnswer}
          setDetoxOtpRequested={detox.setDetoxOtpRequested}
          onRequestEnd={detox.handleRequestDetoxEnd}
          onVerifyEnd={detox.handleVerifyDetoxEnd}
        />
      )}
    </div>
  );
}
