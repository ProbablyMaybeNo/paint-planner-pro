interface TerminalBoxProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  color?: "green" | "cyan" | "amber";
  compact?: boolean;
}

export default function TerminalBox({
  title,
  children,
  className = "",
  color = "green",
  compact = false,
}: TerminalBoxProps) {
  const borderClass = {
    green: "border-border hover:border-border-bright",
    cyan:  "border-cyan/30 hover:border-cyan/60",
    amber: "border-amber/30 hover:border-amber/60",
  }[color];

  const titleClass = {
    green: "text-green glow-green",
    cyan:  "text-cyan glow-cyan",
    amber: "text-amber glow-amber",
  }[color];

  const dimClass = {
    green: "text-green-dim",
    cyan:  "text-cyan-dim",
    amber: "text-amber-dim",
  }[color];

  return (
    <div className={`border ${borderClass} bg-surface transition-colors duration-200 ${className}`}>
      {title && (
        <div className={`px-3 py-1.5 border-b ${borderClass} flex items-center gap-2`}>
          <span className={`${titleClass} text-xs font-semibold tracking-widest`}>
            ┌─[ {title} ]
          </span>
          <span className={`flex-1 border-t ${borderClass} h-0 mt-px`} />
        </div>
      )}
      <div className={compact ? "p-2" : "p-4"}>{children}</div>
    </div>
  );
}
