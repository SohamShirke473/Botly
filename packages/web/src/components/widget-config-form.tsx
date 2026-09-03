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
import { MessageCircle, Bot, Sparkles } from "lucide-react"

interface WidgetConfigFormProps {
  value: WidgetConfig
  onChange: (config: WidgetConfig) => void
}

const PRESET_COLORS = [
  { label: "Carbon", hex: "#18181B" },
  { label: "Indigo", hex: "#4F46E5" },
  { label: "Blue", hex: "#2563EB" },
  { label: "Emerald", hex: "#059669" },
  { label: "Violet", hex: "#7C3AED" },
  { label: "Amber", hex: "#D97706" },
  { label: "Rose", hex: "#E11D48" },
  { label: "Cyan", hex: "#0891B2" },
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
      {/* Theme Section */}
      <div className="space-y-3">
        <h4 className="text-muted-foreground/80 text-[11px] font-semibold tracking-wider uppercase">
          Theme & Appearance
        </h4>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Color Picker */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              Primary Brand Color
            </Label>
            <div className="flex items-center gap-2">
              <Popover open={colorOpen} onOpenChange={setColorOpen}>
                <PopoverTrigger
                  render={
                    <button
                      type="button"
                      className="border-input ring-foreground/10 focus-visible:border-ring focus-visible:ring-ring/50 size-8 shrink-0 rounded-lg border ring-1 transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:outline-none cursor-pointer"
                      style={{ backgroundColor: value.theme.primaryColor }}
                      aria-label="Pick primary color"
                    />
                  }
                />
                <PopoverContent className="w-64 p-3" align="start">
                  <div className="space-y-3">
                    <Label className="text-xs font-medium">Palette Presets</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color.hex}
                          type="button"
                          className={`size-7 rounded-md border-2 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:outline-none cursor-pointer ${
                            value.theme.primaryColor.toLowerCase() ===
                            color.hex.toLowerCase()
                              ? "border-foreground ring-foreground/20 ring-2"
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: color.hex }}
                          onClick={() => updateTheme({ primaryColor: color.hex })}
                          title={color.label}
                          aria-label={`Select ${color.label}`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-border/60">
                      <Input
                        type="color"
                        value={value.theme.primaryColor}
                        onChange={(e) =>
                          updateTheme({ primaryColor: e.target.value })
                        }
                        className="h-7 w-10 cursor-pointer p-0.5"
                      />
                      <Input
                        value={value.theme.primaryColor}
                        onChange={(e) =>
                          updateTheme({ primaryColor: e.target.value })
                        }
                        className="h-7 flex-1 font-mono text-xs"
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
            <Label className="text-xs font-medium text-foreground">
              Screen Position
            </Label>
            <RadioGroup
              value={value.theme.position}
              onValueChange={(v) =>
                updateTheme({
                  position: v as WidgetConfig["theme"]["position"],
                })
              }
              className="flex gap-2"
            >
              <label className="border-border hover:bg-muted has-[[data-checked]]:border-foreground has-[[data-checked]]:bg-accent/40 flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors flex-1 justify-center">
                <RadioGroupItem value="bottom-right" />
                Bottom Right
              </label>
              <label className="border-border hover:bg-muted has-[[data-checked]]:border-foreground has-[[data-checked]]:bg-accent/40 flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors flex-1 justify-center">
                <RadioGroupItem value="bottom-left" />
                Bottom Left
              </label>
            </RadioGroup>
          </div>
        </div>

        {/* Bubble Icon */}
        <div className="space-y-1.5 max-w-xs">
          <Label className="text-xs font-medium text-foreground">
            Launcher Bubble Icon
          </Label>
          <Select
            value={value.theme.bubbleIcon}
            onValueChange={(v) =>
              updateTheme({
                bubbleIcon: v as WidgetConfig["theme"]["bubbleIcon"],
              })
            }
          >
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chat">
                <div className="flex items-center gap-2">
                  <MessageCircle className="size-3.5" />
                  <span>Chat Bubble</span>
                </div>
              </SelectItem>
              <SelectItem value="message">
                <div className="flex items-center gap-2">
                  <Bot className="size-3.5" />
                  <span>Bot Avatar</span>
                </div>
              </SelectItem>
              <SelectItem value="sparkle">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-3.5" />
                  <span>Sparkle AI</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages Section */}
      <div className="space-y-3 pt-2 border-t border-border/60">
        <h4 className="text-muted-foreground/80 text-[11px] font-semibold tracking-wider uppercase">
          Welcome & Copy
        </h4>

        <div className="space-y-1.5">
          <Label htmlFor="greeting" className="text-xs font-medium text-foreground">
            Greeting Message
          </Label>
          <Input
            id="greeting"
            value={value.greeting}
            onChange={(e) => onChange({ ...value, greeting: e.target.value })}
            className="h-8 text-xs bg-background"
            maxLength={200}
          />
          <p className="text-muted-foreground text-[11px]">
            Initial message shown to visitors when opening the chat window.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="placeholder" className="text-xs font-medium text-foreground">
            Input Placeholder
          </Label>
          <Input
            id="placeholder"
            value={value.placeholder}
            onChange={(e) =>
              onChange({ ...value, placeholder: e.target.value })
            }
            className="h-8 text-xs bg-background"
            maxLength={100}
          />
        </div>
      </div>

      {/* Branding Toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border/80 bg-muted/20 p-3">
        <div className="space-y-0.5">
          <Label className="text-xs font-medium text-foreground">
            Show Botly Branding
          </Label>
          <p className="text-muted-foreground text-[11px]">
            Display "Powered by Botly" badge at the bottom of the widget.
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
