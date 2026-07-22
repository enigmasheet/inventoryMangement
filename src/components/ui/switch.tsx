import { Switch as SwitchBase } from "@base-ui/react/switch"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const switchVariants = cva(
  "group inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-clip-padding transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[checked]:bg-accent data-[unchecked]:bg-muted",
  {
    variants: {
      size: {
        default: "h-6 w-11",
        sm: "h-5 w-9",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const thumbVariants = cva(
  "pointer-events-none block rounded-full bg-background shadow-sm border transition-transform",
  {
    variants: {
      size: {
        default: "size-5 data-[checked]:translate-x-5 data-[unchecked]:translate-x-0.5",
        sm: "size-4 data-[checked]:translate-x-4 data-[unchecked]:translate-x-0.5",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

function Switch({
  className,
  size,
  ...props
}: SwitchBase.Root.Props & VariantProps<typeof switchVariants>) {
  return (
    <SwitchBase.Root
      data-slot="switch"
      className={cn(switchVariants({ size, className }))}
      {...props}
    >
      <SwitchBase.Thumb
        data-slot="switch-thumb"
        className={cn(thumbVariants({ size }))}
      />
    </SwitchBase.Root>
  )
}

export { Switch }
