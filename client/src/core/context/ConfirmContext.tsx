import { createContext } from 'preact';
import { useContext, useState, useCallback } from 'preact/hooks';
import { Confirm, ConfirmOptions } from '../../ui-components/Confirm/Confirm';

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => void;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function ConfirmProvider({ children }: { children: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: '' });

  const confirm = useCallback((newOptions: ConfirmOptions) => {
    setOptions(newOptions);
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Confirm 
        isOpen={isOpen} 
        onClose={handleClose} 
        {...options} 
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return context;
}
