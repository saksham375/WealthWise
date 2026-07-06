import { Loader2 } from "lucide-react";

export default function GroupLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-monochrome-400" size={24} />
    </div>
  );
}
