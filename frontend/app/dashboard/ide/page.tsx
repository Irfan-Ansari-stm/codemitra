import { Metadata } from 'next';
import OnlineIde from '@/components/ide/OnlineIde';

export const metadata: Metadata = {
  title: 'Online IDE | CodeMitra',
  description: 'Multi-language WebAssembly and Cloud code execution workspace.',
};

export default function DashboardIdePage() {
  return (
    <div className="h-full w-full p-1 sm:p-2">
      <OnlineIde />
    </div>
  );
}
