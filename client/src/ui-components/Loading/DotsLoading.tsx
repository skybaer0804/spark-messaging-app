import { Box } from '../Layout/Box';
import './DotsLoading.scss';

export interface DotsLoadingProps {
  className?: string;
  color?: string;
}

export const DotsLoading = ({ className = '', color }: DotsLoadingProps) => (
  <Box 
    className={`dots-loading ${className}`} 
    style={color ? { color } : undefined}
  >
    <span /><span /><span />
  </Box>
);
