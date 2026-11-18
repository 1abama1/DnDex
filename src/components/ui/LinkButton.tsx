import { Link, type LinkProps } from 'react-router-dom';
import { buttonStyles, type ButtonVariant, type ButtonSize } from './button-styles';
export function LinkButton({
  variant,
  size,
  className,
  ...props
}: LinkProps & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link {...props} className={buttonStyles(variant, size, className)} />;
}
