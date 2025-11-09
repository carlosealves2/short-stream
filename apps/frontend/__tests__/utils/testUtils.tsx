import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AudioProvider } from '@/contexts/AudioContext';

interface WrapperProps {
  children: React.ReactNode;
}

function AllProviders({ children }: WrapperProps) {
  return <AudioProvider>{children}</AudioProvider>;
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render };
