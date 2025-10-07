import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary-600 active:bg-primary-700',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80',
        outline:
          'border-2 border-border bg-transparent text-foreground hover:bg-secondary hover:border-primary active:bg-secondary-200',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary-200 active:bg-secondary-300',
        ghost: 'text-foreground hover:bg-secondary hover:text-foreground active:bg-secondary-200',
        link: 'text-primary underline-offset-4 hover:underline hover:text-primary-600 focus-visible:ring-0 focus-visible:ring-offset-0 active:text-primary-700',
      },
      size: {
        default: 'h-10 px-4 py-2 min-h-[44px] sm:min-h-[40px]',
        sm: 'h-9 rounded-md px-3 text-xs min-h-[44px] sm:min-h-[36px]',
        lg: 'h-12 rounded-lg px-6 text-base min-h-[48px] sm:min-h-[48px]',
        icon: 'h-10 w-10 min-h-[44px] min-w-[44px] sm:min-h-[40px] sm:min-w-[40px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button };
