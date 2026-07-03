export interface LoaderProgress {
  current: number;
  total?: number | null;
  unit?: "files" | "folders";
}

export interface LoaderProps {
  show?: boolean;
  label?: string;
  heading?: string;
  title?: string;
  timeRemaining?: string;
  mode?: "spinner" | "progress";
  progress?: LoaderProgress;
  size?: "sm" | "md" | "lg";
  color?: "default" | "light";
  className?: string;
}

const sizeClasses: Record<NonNullable<LoaderProps["size"]>, string> = {
  sm: "size-4 border-2",
  md: "size-6 border-2",
  lg: "size-10 border-[3px]",
};

const colorClasses: Record<NonNullable<LoaderProps["color"]>, string> = {
  default: "border-blue-200 border-t-blue-600",
  light: "border-white/30 border-t-white",
};

const formatCount = (value: number) => value.toLocaleString();

export const getProgressPercent = (
  current: number,
  total?: number | null,
): number | null => {
  if (!total || total <= 0) {
    return null;
  }

  return Math.min(100, Math.round((current / total) * 100));
};

export const buildProgressTitle = (
  progress: LoaderProgress,
  t: (key: string, options?: Record<string, string | number>) => string,
): string => {
  const percent = getProgressPercent(progress.current, progress.total);

  if (percent === null) {
    return t("loader.progress.inProgress");
  }

  return t("loader.progress.percentCompleted", { percent });
};

export const buildProgressPhaseLabel = (
  phase: "discovering" | "hashing" | undefined,
  t: (key: string) => string,
): string | undefined => {
  if (phase === "discovering") {
    return t("loader.progress.phaseDiscovering");
  }

  if (phase === "hashing") {
    return t("loader.progress.phaseHashing");
  }

  return undefined;
};

export const buildProgressLabel = (
  progress: LoaderProgress,
  t: (key: string, options?: Record<string, string | number>) => string,
): string => {
  const { current, total, unit = "files" } = progress;
  const formattedCurrent = formatCount(current);
  const formattedTotal = total ? formatCount(total) : null;

  if (unit === "folders") {
    if (formattedTotal) {
      return t("loader.progress.folders", {
        current: formattedCurrent,
        total: formattedTotal,
      });
    }

    return t("loader.progress.foldersDiscovering", {
      current: formattedCurrent,
    });
  }

  if (formattedTotal) {
    return t("loader.progress.files", {
      current: formattedCurrent,
      total: formattedTotal,
    });
  }

  return t("loader.progress.filesDiscovering", {
    current: formattedCurrent,
  });
};

const Spinner = ({
  size = "md",
  color = "default",
}: {
  size?: LoaderProps["size"];
  color?: LoaderProps["color"];
}) => (
  <span
    className={`inline-block animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}`}
  />
);

const ProgressPanel = ({
  current,
  total,
  heading,
  title,
  statusMessage,
  timeRemaining,
}: {
  current: number;
  total?: number | null;
  heading?: string;
  title?: string;
  statusMessage?: string;
  timeRemaining?: string;
}) => {
  const percent = getProgressPercent(current, total);
  const displayTitle =
    title ??
    (percent !== null ? `${percent}% completed` : "In progress");

  return (
    <div className="flex w-full flex-col gap-5">
      {heading && (
        <p className="text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {heading}
        </p>
      )}

      <div className="flex items-end justify-between gap-6">
        <p className="text-left font-['Sora'] text-3xl font-semibold leading-none tracking-tight text-slate-900 sm:text-4xl">
          {displayTitle}
        </p>

        {timeRemaining && (
          <p className="shrink-0 pb-0.5 text-sm text-slate-400">
            {timeRemaining}
          </p>
        )}
      </div>

      <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full bg-linear-to-r from-blue-500 to-violet-400 transition-all duration-500 ease-out ${
            percent === null ? "w-2/5 animate-pulse" : ""
          }`}
          style={percent !== null ? { width: `${percent}%` } : undefined}
          role="progressbar"
          aria-valuenow={percent ?? current}
          aria-valuemin={0}
          aria-valuemax={total ?? 100}
        />
      </div>

      {statusMessage && (
        <p className="text-left text-sm text-slate-400">{statusMessage}</p>
      )}
    </div>
  );
};

const Loader = ({
  show = true,
  label,
  heading,
  title,
  timeRemaining,
  mode = "spinner",
  progress,
  size = "md",
  color = "default",
  className = "",
}: LoaderProps) => {
  if (!show) {
    return null;
  }

  const isProgressMode = mode === "progress" && progress;

  if (isProgressMode) {
    return (
      <div
        className={`mx-auto w-full max-w-3xl ${className}`}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <ProgressPanel
          current={progress.current}
          total={progress.total}
          heading={heading}
          title={title}
          statusMessage={label}
          timeRemaining={timeRemaining}
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner size={size} color={color} />
      {label && <span className="text-sm text-slate-600">{label}</span>}
    </div>
  );
};

export default Loader;
