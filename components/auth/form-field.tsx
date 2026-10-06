import { cn } from "cn"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"

type FormFieldProps = Omit<React.ComponentProps<"input">, "name"> & {
  name: string
  label: string
  /** Grey help text under the field, e.g. "At least 6 characters." */
  hint?: string
  /** Red error under the field; replaces the hint. */
  error?: string
  /** Renders the PasswordInput with its Show/Hide toggle. */
  password?: boolean
}

export function FormField({ name, label, hint, error, password, className, ...props }: FormFieldProps) {
  const id = props.id ?? name
  const noteId = `${id}-note`
  const note = error ?? hint
  const Control = password ? PasswordInput : Input

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="font-semibold">
        {label}
      </Label>
      <Control
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
        {...props}
      />
      {note && (
        <p id={noteId} className={cn("text-xs", error ? "text-danger" : "text-faint")}>
          {note}
        </p>
      )}
    </div>
  )
}
