import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 disabled:pointer-events-none disabled:opacity-50",
          {
            'bg-blue-600 text-white shadow hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700': variant === 'default',
            'bg-red-500 text-white shadow-sm hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700': variant === 'destructive',
            'border border-gray-200 bg-white shadow-sm hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-gray-100 dark:text-gray-100': variant === 'outline',
            'bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700': variant === 'secondary',
            'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100 dark:text-gray-100': variant === 'ghost',
            'text-blue-600 underline-offset-4 hover:underline dark:text-blue-400': variant === 'link',
            'h-9 px-4 py-2': size === 'default',
            'h-8 rounded-md px-3 text-xs': size === 'sm',
            'h-10 rounded-md px-8': size === 'lg',
            'h-9 w-9': size === 'icon',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
