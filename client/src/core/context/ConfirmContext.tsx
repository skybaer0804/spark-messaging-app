import { createContext } from 'preact';
import { useContext, useState, useCallback } from 'preact/hooks';
import { Confirm, ConfirmOptions } from '@/components/ui/confirm';

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => void;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function ConfirmProvider({ children }: { children: any }) {
  const [state, setState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
  }>({
    isOpen: false,
    options: { message: '' }
  });

  const confirm = useCallback((newOptions: ConfirmOptions) => {
    setState({
      isOpen: true,
      options: newOptions
    });
  }, []);

  const handleClose = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      <Confirm
        isOpen={state.isOpen}
        onClose={handleClose}
        {...state.options}
      />
      {children}
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
