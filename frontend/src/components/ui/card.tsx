import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-xl border border-gray-100 bg-white shadow-sm", className)}
    {...props}
  />
))
Card.displayName = "Card"

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  action?: React.ReactNode
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, action, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-between px-6 py-4 border-b border-gray-100", className)}
      {...props}
    >
      {(title || subtitle) ? (
        <div className="space-y-0.5">
          {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      ) : children}
      {action && <div>{action}</div>}
    </div>
  )
)
CardHeader.displayName = "CardHeader"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center px-6 py-4 border-t border-gray-100", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardContent, CardFooter }
