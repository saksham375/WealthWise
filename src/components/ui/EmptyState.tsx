import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="card p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-monochrome-100 flex items-center justify-center mx-auto mb-3">
        <Icon size={22} className="text-monochrome-400" />
      </div>
      <p className="text-sm font-semibold text-monochrome-900">{title}</p>
      {description && (
        <p className="text-xs text-monochrome-500 mt-1 max-w-xs mx-auto">{description}</p>
      )}
      {action && (
        <button
          className="btn-secondary mt-4"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
