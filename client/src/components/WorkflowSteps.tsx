import { CheckCircle2, Circle, Lock } from "lucide-react";

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  status: "completed" | "active" | "locked";
  roiNote?: string;
  duration?: string;
}

interface WorkflowStepsProps {
  steps: WorkflowStep[];
  onStepClick?: (stepId: string) => void;
  orientation?: "horizontal" | "vertical";
}

export default function WorkflowSteps({
  steps,
  onStepClick,
  orientation = "vertical",
}: WorkflowStepsProps) {
  if (orientation === "horizontal") {
    return (
      <div className="relative flex items-start justify-between gap-2">
        <div className="absolute top-5 left-8 right-8 h-0.5 bg-slate-700" />
        {steps.map((step, i) => (
          <div
            key={step.id}
            className={`relative flex flex-col items-center gap-2 flex-1 cursor-pointer group`}
            onClick={() => onStepClick?.(step.id)}
          >
            <div
              className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                step.status === "completed"
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : step.status === "active"
                  ? "bg-indigo-500 border-indigo-500 text-white"
                  : "bg-slate-900 border-slate-600 text-slate-500"
              }`}
            >
              {step.status === "completed" ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : step.status === "locked" ? (
                <Lock className="w-4 h-4" />
              ) : (
                <span className="text-xs font-bold">{i + 1}</span>
              )}
            </div>
            <div className="text-center">
              <div
                className={`text-xs font-semibold ${
                  step.status === "completed"
                    ? "text-emerald-400"
                    : step.status === "active"
                    ? "text-indigo-300"
                    : "text-slate-500"
                }`}
              >
                {step.label}
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">{step.description}</div>
              {step.roiNote && (
                <div className="text-[9px] text-amber-400 mt-0.5">{step.roiNote}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {steps.map((step, i) => (
        <div
          key={step.id}
          className={`flex gap-3 cursor-pointer group`}
          onClick={() => onStepClick?.(step.id)}
        >
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-all ${
                step.status === "completed"
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : step.status === "active"
                  ? "bg-indigo-500 border-indigo-500 text-white"
                  : "bg-slate-900 border-slate-700 text-slate-500"
              }`}
            >
              {step.status === "completed" ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : step.status === "locked" ? (
                <Lock className="w-3 h-3" />
              ) : (
                <span className="text-xs font-bold">{i + 1}</span>
              )}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-0.5 flex-1 my-1 ${
                  step.status === "completed" ? "bg-emerald-500/40" : "bg-slate-700"
                }`}
                style={{ minHeight: 16 }}
              />
            )}
          </div>
          <div className={`pb-3 ${i === steps.length - 1 ? "pb-0" : ""}`}>
            <div
              className={`text-sm font-semibold ${
                step.status === "completed"
                  ? "text-emerald-300"
                  : step.status === "active"
                  ? "text-indigo-200"
                  : "text-slate-500"
              }`}
            >
              {step.label}
              {step.duration && (
                <span className="ml-2 text-[10px] text-slate-500 font-normal">{step.duration}</span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{step.description}</div>
            {step.roiNote && (
              <div className="text-xs text-amber-400 mt-0.5">{step.roiNote}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
