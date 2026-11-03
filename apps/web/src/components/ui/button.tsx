import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';

const buttonStyles = cva('button', {
  variants: { variant: { primary: 'button--primary', quiet: 'button--quiet' } },
  defaultVariants: { variant: 'primary' },
});

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonStyles> & { asChild?: boolean };

export function Button({ asChild = false, className, variant, ...props }: ButtonProps) {
  const Component = asChild ? Slot : 'button';
  return <Component className={buttonStyles({ className, variant })} {...props} />;
}
