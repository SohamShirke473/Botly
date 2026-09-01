import { useCallback, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { WidgetConfig } from "types"

interface WidgetConfigFormProps {
  value: WidgetConfig
  onChange: (config: WidgetConfig) => void
}

const PRESET_COLORS = [
  "#171717",
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#ec4899",
  "#06b6d4",
  "#6366f1",
]

export function WidgetConfigForm({ value, onChange }: WidgetConfigFormProps) {
  const [colorOpen, setColorOpen] = useState(false)

  const updateTheme = useCallback(
    (patch: Partial<WidgetConfig["theme"]>) => {
      onChange({ ...value, theme: { ...value.theme, ...patch } })
    },
    [value, onChange]
  )

  return (
    <div className="space-y-5">
      {/* Theme */}
      <div className="space-y-3">
        <h4 className="text-muted-foreground/70 text-xs font-semibold tracking-wider uppercase">
          Theme
        </h4>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Color Picker */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Primary Color</Label>
            <div className="flex items-center gap-2">
              <Popover open={colorOpen} onOpenChange={setColorOpen}>
                <PopoverTrigger
                  render={
                    <button
                      type="button"
                      className="border-input ring-foreground/10 focus-visible:border-ring focus-visible:ring-ring/50 size-8 shrink-0 rounded-lg border ring-1 transition-transform hover:scale-105 focus-visible:ring-3 focus-visible:outline-none"
                      style={{ backgroundColor: value.theme.primaryColor }}
                      aria-label="Pick primary color"
                    />
                  }
                />
                <PopoverContent className="w-64 p-3" align="start">
                  <div className="space-y-3">
                    <Label className="text-xs font-medium">Color</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`focus-visible:border-ring focus-visible:ring-ring/50 size-7 rounded-md border-2 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:outline-none ${
                            value.theme.primaryColor === color
                              ? "border-foreground ring-foreground/20 ring-1"
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => updateTheme({ primaryColor: color })}
                          aria-label={`Select ${color}`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={value.theme.primaryColor}
                        onChange={(e) =>
                          updateTheme({ primaryColor: e.target.value })
                        }
                        className="h-8 w-14 cursor-pointer p-0.5"
                      />
                      <Input
                        value={value.theme.primaryColor}
                        onChange={(e) =>
                          updateTheme({ primaryColor: e.target.value })
                        }
                        className="h-8 flex-1 font-mono text-xs"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground font-mono text-xs">
                {value.theme.primaryColor}
              </span>
            </div>
          </div>

          {/* Position */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Position</Label>
            <RadioGroup
              value={value.theme.position}
              onValueChange={(v) =>
                updateTheme({
                  position: v as WidgetConfig["theme"]["position"],
                })
              }
              className="flex gap-1"
            >
              <label className="border-input hover:bg-muted has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5 has-[[data-checked]]:text-primary flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors">
                <RadioGroupItem value="bottom-right" />
                Bottom Right
              </label>
              <label className="border-input hover:bg-muted has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5 has-[[data-checked]]:text-primary flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors">
                <RadioGroupItem value="bottom-left" />
                Bottom Left
              </label>
            </RadioGroup>
          </div>
        </div>

        {/* Bubble Icon */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Bubble Icon</Label>
          <Select
            value={value.theme.bubbleIcon}
            onValueChange={(v) =>
              updateTheme({
                bubbleIcon: v as WidgetConfig["theme"]["bubbleIcon"],
              })
            }
          >
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chat">Chat Bubble</SelectItem>
              <SelectItem value="message">Message</SelectItem>
              <SelectItem value="sparkle">Sparkle</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-3">
        <h4 className="text-muted-foreground/70 text-xs font-semibold tracking-wider uppercase">
          Messages
        </h4>

        <div className="space-y-1.5">
          <Label htmlFor="greeting" className="text-xs font-medium">
            Greeting
          </Label>
          <Input
            id="greeting"
            value={value.greeting}
            onChange={(e) => onChange({ ...value, greeting: e.target.value })}
            className="h-8 text-sm"
            maxLength={200}
          />
          <p className="text-muted-foreground text-[11px]">
            Shown when a visitor opens the widget.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="placeholder" className="text-xs font-medium">
            Input Placeholder
          </Label>
          <Input
            id="placeholder"
            value={value.placeholder}
            onChange={(e) =>
              onChange({ ...value, placeholder: e.target.value })
            }
            className="h-8 text-sm"
            maxLength={100}
          />
        </div>
      </div>

      {/* Branding */}
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label className="text-xs font-medium">Show Branding</Label>
          <p className="text-muted-foreground text-[11px]">
            Display "Powered by Botly" in the widget.
          </p>
        </div>
        <Switch
          checked={value.showBranding}
          onCheckedChange={(checked) =>
            onChange({ ...value, showBranding: checked })
          }
        />
      </div>
    </div>
  )
}
