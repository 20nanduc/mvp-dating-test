import { Sparkles } from 'lucide-react';
import { BottomSheet } from '@/features/chats/room/components/BottomSheet';

interface Props { thought: string; onClose: () => void }

export function CurrentThoughtSheet({ thought, onClose }: Props) {
  return (
    <BottomSheet title="Currently exploring" onClose={onClose}>
      <div className="mb-4 rounded-2xl border border-[#eee2ff] bg-[linear-gradient(135deg,#fcf8ff,#f5ecff)] p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-extrabold tracking-wide text-[#8662ba]">
          <Sparkles size={15} /> THE THOUGHT
        </div>
        <p className="whitespace-pre-wrap break-words text-[16px] font-semibold leading-7 text-[#34264b]">{thought}</p>
      </div>
      <p className="mb-1 text-sm leading-6 text-[#8590a6]">This thought is the context for your current conversation.</p>
    </BottomSheet>
  );
}
