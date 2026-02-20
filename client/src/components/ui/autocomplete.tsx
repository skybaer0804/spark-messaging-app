import * as React from "react"
import { createPortal } from "preact/compat"
import { Check, X, ChevronLeft, Search as SearchIcon } from "lucide-preact"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/core/context/ThemeProvider"
import { IconButton } from "./icon-button"
import { Typography } from "./typography"

export interface AutocompleteOption<T = any> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface AutocompleteProps<T = any> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'onInput'> {
  options: AutocompleteOption<T>[];
  value?: T | T[];
  onChange?: (value: T | T[] | null) => void;
  onInputChange?: (inputValue: string) => void;
  multiple?: boolean;
  getOptionLabel?: (option: AutocompleteOption<T>) => string;
  renderOption?: (option: AutocompleteOption<T>, state: { selected: boolean; inputValue: string }) => React.ReactNode;
  filterOptions?: (options: AutocompleteOption<T>[], inputValue: string) => AutocompleteOption<T>[];
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: boolean;
  isValid?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  openOnFocus?: boolean;
  autoHighlight?: boolean;
  clearOnEscape?: boolean;
  disableClearable?: boolean;
  limitTags?: number;
  renderValue?: (value: T | T[], getItemProps: (index: number) => React.HTMLAttributes<HTMLDivElement>) => React.ReactNode;
}

export function Autocomplete<T = any>({
  options,
  value,
  onChange,
  onInputChange,
  multiple = false,
  label,
  placeholder,
  error = false,
  helperText,
  disabled = false,
  className,
  renderOption,
  getOptionLabel = (opt) => opt.label,
  filterOptions,
  openOnFocus = true,
  renderValue,
  limitTags,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isValid,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fullWidth,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  autoHighlight,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  clearOnEscape,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  disableClearable,
  ...props
}: AutocompleteProps<T>) {
  const { theme } = useTheme()
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const [isMobile, setIsMobile] = React.useState(typeof window !== 'undefined' && window.innerWidth <= 768)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const selectedValues = React.useMemo(() => {
    if (value === undefined || value === null) return []
    return Array.isArray(value) ? value : [value]
  }, [value])

  const currentDisplayLabel = React.useMemo(() => {
    if (multiple) return ""
    if (selectedValues.length === 0) return ""
    return getOptionLabel({ label: '', value: selectedValues[0] })
  }, [multiple, selectedValues, getOptionLabel])

  const filteredOptions = React.useMemo(() => {
    if (filterOptions) {
      return filterOptions(options, inputValue)
    }
    if (!inputValue.trim()) return options
    const lowerInput = inputValue.toLowerCase()
    return options.filter((opt) => opt.label.toLowerCase().includes(lowerInput))
  }, [options, inputValue, filterOptions])

  const isSelected = (optionValue: T) => {
    return selectedValues.some((v) => {
      if (typeof v === 'object' && v !== null && typeof optionValue === 'object' && optionValue !== null) {
        return JSON.stringify(v) === JSON.stringify(optionValue)
      }
      return v === optionValue
    })
  }

  const handleSelect = (option: AutocompleteOption<T>) => {
    if (multiple) {
      const alreadySelected = isSelected(option.value)
      const newValues = alreadySelected
        ? selectedValues.filter((v) => {
            if (typeof v === 'object' && v !== null && typeof option.value === 'object' && option.value !== null) {
              return JSON.stringify(v) !== JSON.stringify(option.value)
            }
            return v !== option.value
          })
        : [...selectedValues, option.value]
      onChange?.(newValues as T[])
      setInputValue("")
      onInputChange?.("")
    } else {
      onChange?.(option.value)
      setInputValue("")
      onInputChange?.("")
      setOpen(false)
    }
  }

  const handleUnselect = (optionValue: T) => {
    const newValues = selectedValues.filter((v) => {
      if (typeof v === 'object' && v !== null && typeof optionValue === 'object' && optionValue !== null) {
        return JSON.stringify(v) !== JSON.stringify(optionValue)
      }
      return v !== optionValue
    })
    onChange?.(newValues as T[])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false)
    }
    if (e.key === "Backspace" && inputValue === "" && multiple && selectedValues.length > 0) {
      handleUnselect(selectedValues[selectedValues.length - 1])
    }
  }

  const renderOptionList = () => (
    <Command className="w-full h-full" shouldFilter={false}>
      <CommandList className={cn("max-h-[300px]", isMobile && "max-h-full flex-1")}>
        <CommandEmpty>결과가 없습니다.</CommandEmpty>
        <CommandGroup>
          {filteredOptions.map((option, idx) => {
            const selected = isSelected(option.value)
            return (
              <CommandItem
                key={idx}
                onSelect={() => handleSelect(option)}
                disabled={option.disabled}
                className="flex items-center"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selected ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex-1">
                  {renderOption ? (renderOption(option, { selected, inputValue }) as React.ReactNode) : getOptionLabel(option)}
                </div>
              </CommandItem>
            )
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  )

  const getItemProps = (index: number) => ({
    'data-item-index': index,
    tabIndex: -1,
  });

  const displayedSelectedValues = limitTags ? selectedValues.slice(0, limitTags) : selectedValues;
  const hiddenCount = limitTags ? selectedValues.length - limitTags : 0;

  return (
    <div className={cn("grid w-full gap-1.5", className)} data-theme={theme}>
      {label && <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div 
            className={cn(
              "flex min-h-10 w-full flex-wrap gap-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-destructive focus-within:ring-destructive"
            )}
            onClick={() => {
              if (!disabled) {
                inputRef.current?.focus()
                setOpen(true)
              }
            }}
          >
            {multiple && (
              renderValue ? (
                (renderValue(selectedValues as T[], getItemProps) as React.ReactNode)
              ) : (
                <>
                  {displayedSelectedValues.map((val, idx) => {
                    const option = options.find(opt => {
                      if (typeof val === 'object' && val !== null && typeof opt.value === 'object' && opt.value !== null) {
                        return JSON.stringify(val) === JSON.stringify(opt.value)
                      }
                      return val === opt.value
                    })
                    return (
                      <Badge key={idx} variant="secondary" className="gap-1 px-1 py-0 h-6">
                        {option ? getOptionLabel(option) : String(val)}
                        {!disabled && (
                          <button
                            className="ml-0.5 rounded-full outline-none hover:bg-muted focus:ring-1 focus:ring-ring"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                            }}
                            onClick={() => handleUnselect(val)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    )
                  })}
                  {hiddenCount > 0 && (
                    <Badge variant="secondary" className="h-6">
                      +{hiddenCount}
                    </Badge>
                  )}
                </>
              )
            )}
            <input
              ref={inputRef}
              className="flex-1 min-w-[50px] bg-transparent outline-none placeholder:text-muted-foreground"
              placeholder={selectedValues.length === 0 ? placeholder : ""}
              value={multiple ? inputValue : (open ? inputValue : (inputValue || currentDisplayLabel))}
              onFocus={() => {
                if (openOnFocus && !disabled) setOpen(true)
              }}
              onInput={(e) => {
                const val = e.currentTarget.value
                setInputValue(val)
                onInputChange?.(val)
                setOpen(true)
              }}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              {...(props as any)}
            />
          </div>
        </PopoverAnchor>
        {!isMobile && (
          <PopoverContent 
            className="w-[var(--radix-popover-trigger-width)] p-0 z-[9999]" 
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {renderOptionList()}
          </PopoverContent>
        )}
      </Popover>
      {isMobile && open && createPortal(
        <div 
          className="fixed inset-0 z-[10000] flex flex-col bg-background animate-in fade-in slide-in-from-bottom-4"
          data-theme={theme}
        >
          <header className="flex items-center p-2 border-b">
            <IconButton onClick={() => setOpen(false)} size="small">
              <ChevronLeft size={24} />
            </IconButton>
            <Typography variant="h3" className="ml-2 flex-1">
              {label || "검색"}
            </Typography>
          </header>
          <div className="p-3 border-b">
            <div className="flex items-center border rounded-md px-3 bg-muted/50">
              <SearchIcon size={18} className="text-muted-foreground mr-2" />
              <input
                className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                placeholder={placeholder || "검색어 입력"}
                value={inputValue}
                onInput={(e) => {
                  const val = e.currentTarget.value
                  setInputValue(val)
                  onInputChange?.(val)
                }}
                autoFocus
              />
              {inputValue && (
                <IconButton 
                  onClick={() => {
                    setInputValue("")
                    onInputChange?.("")
                  }}
                  size="small"
                >
                  <X size={16} />
                </IconButton>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {renderOptionList()}
          </div>
        </div>,
        document.body
      )}
      {helperText && (
        <p className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>
          {helperText}
        </p>
      )}
    </div>
  )
}
