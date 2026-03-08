import { CheckCircle2, AlertCircle, Info } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { Toast } from "./types";

const toneStyles = {
  success: {
    icon: CheckCircle2,
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-50",
    iconClassName: "text-emerald-300",
  },
  error: {
    icon: AlertCircle,
    className: "border-rose-500/20 bg-rose-500/10 text-rose-50",
    iconClassName: "text-rose-300",
  },
  info: {
    icon: Info,
    className: "border-sky-500/20 bg-sky-500/10 text-sky-50",
    iconClassName: "text-sky-300",
  },
} as const;

type ToastStackProps = {
  toasts: Toast[];
};

export function ToastStack({ toasts }: ToastStackProps) {
  if (!toasts.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map((toast) => {
        const tone = toneStyles[toast.tone];
        const Icon = tone.icon;

        return (
          <Card
            key={toast.id}
            className={cn(
              "pointer-events-auto rounded-2xl border p-4 shadow-2xl shadow-black/20 backdrop-blur",
              tone.className,
            )}
          >
            <div className="flex items-start gap-3">
              <Icon className={cn("mt-0.5 size-4 shrink-0", tone.iconClassName)} />
              <div className="space-y-1">
                <p className="text-sm font-medium">{toast.title}</p>
                {toast.description ? (
                  <p className="text-xs text-current/75">{toast.description}</p>
                ) : null}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
