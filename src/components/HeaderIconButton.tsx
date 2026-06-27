import { motion } from "framer-motion";
import type { ComponentType } from "react";
import { DetoxInfoIcon, ThemeColorWheelIcon } from "./icons/DetoxIcons";

type HeaderIconVariant = "theme" | "about";

interface DetoxIconComponentProps {
  size?: number;
  className?: string;
}

interface HeaderIconButtonProps {
  variant: HeaderIconVariant;
  onClick: () => void;
  className?: string;
  compact?: boolean;
}

const CONFIG: Record<
  HeaderIconVariant,
  {
    Icon: ComponentType<DetoxIconComponentProps>;
    title: string;
    label: string;
    iconClass?: string;
    wiggle: number;
  }
> = {
  theme: {
    Icon: ThemeColorWheelIcon,
    title: "Color themes",
    label: "Color themes",
    wiggle: -8,
  },
  about: {
    Icon: DetoxInfoIcon,
    title: "About Detox",
    label: "About Detox",
    wiggle: 6,
  },
};

export function HeaderIconButton({
  variant,
  onClick,
  className = "",
  compact = false,
}: HeaderIconButtonProps) {
  const { Icon, title, label, iconClass, wiggle } = CONFIG[variant];
  const iconSize = compact ? 18 : 24;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={label}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      className={`inline-flex shrink-0 items-center justify-center ${
        compact ? "h-7 w-7" : "h-8 w-8"
      } ${iconClass ?? ""} ${className}`}
    >
      <motion.span
        className="inline-flex"
        whileHover={{ rotate: wiggle }}
        transition={{ type: "spring", stiffness: 400, damping: 14 }}
      >
        <Icon size={iconSize} />
      </motion.span>
    </motion.button>
  );
}

export function ThemeButton(props: Omit<HeaderIconButtonProps, "variant">) {
  return <HeaderIconButton variant="theme" {...props} />;
}

export function AboutButton(props: Omit<HeaderIconButtonProps, "variant">) {
  return <HeaderIconButton variant="about" {...props} />;
}

export function HeaderIconDock({
  onThemeClick,
  onAboutClick,
  compact = false,
  className = "",
}: {
  onThemeClick: () => void;
  onAboutClick: () => void;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex shrink-0 items-center gap-0 ${className}`}>
      <ThemeButton compact={compact} onClick={onThemeClick} />
      <AboutButton compact={compact} onClick={onAboutClick} />
    </div>
  );
}
