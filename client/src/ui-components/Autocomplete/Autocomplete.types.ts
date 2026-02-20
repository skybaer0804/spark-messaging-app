import { JSX } from 'preact';

export interface AutocompleteOption<T = any> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface AutocompleteProps<T = any> extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onChange' | 'onInput'> {
  options: AutocompleteOption<T>[];
  value?: T | T[];
  onChange?: (value: T | T[] | null) => void;
  onInputChange?: (inputValue: string) => void;
  multiple?: boolean;
  getOptionLabel?: (option: AutocompleteOption<T>) => string;
  renderOption?: (option: AutocompleteOption<T>, state: { selected: boolean; inputValue: string }) => preact.ComponentChildren;
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
  renderValue?: (value: T | T[], getItemProps: (index: number) => JSX.HTMLAttributes<HTMLDivElement>) => preact.ComponentChildren;
}
