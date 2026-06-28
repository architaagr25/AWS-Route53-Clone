/**
 * AWS-styled button with the console's three main variants.
 * - primary:   orange call-to-action (Create, Save)
 * - secondary: white bordered (Cancel, secondary actions)
 * - danger:    red (Delete confirmation)
 */
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-aws-orange text-aws-squid hover:bg-aws-orange-dark border border-transparent",
  secondary:
    "bg-aws-surface text-aws-text border border-aws-border hover:bg-aws-bg",
  danger: "bg-aws-error text-white hover:opacity-90 border border-transparent",
};

export default function Button({
  variant = "secondary",
  className = "",
  ...props
}: Props) {
  return (
    <button
      className={`rounded px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
