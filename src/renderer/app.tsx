import { ReactNode, useEffect } from 'react';
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { MantineProvider } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import isElectron from 'is-electron';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { useDefaultSettings } from './features/settings';
import { AppRouter } from './router/AppRouter';
import './styles/global.scss';

const SelectRouter = ({ children }: { children: ReactNode }) => {
  if (isElectron()) {
    return <HashRouter>{children}</HashRouter>;
  }

  return <BrowserRouter>{children}</BrowserRouter>;
};

export const App = () => {
  const [theme] = useLocalStorage({
    defaultValue: 'dark',
    key: 'theme',
  });

  useDefaultSettings();

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 100,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 500,
        tolerance: 10,
      },
    })
  );

  return (
    <MantineProvider
      theme={{
        colorScheme: 'dark',
        defaultRadius: 'xs',
        focusRing: 'auto',
        fontSizes: {
          lg: 16,
          md: 14,
          sm: 12,
          xl: 18,
          xs: 10,
        },

        other: {},
        spacing: {
          xs: 2,
        },
      }}
    >
      <DndContext
        sensors={sensors}
        onDragEnd={() => console.log('drag end')}
        onDragStart={() => console.log('drag start')}
      >
        <SelectRouter>
          <AppRouter />
        </SelectRouter>
      </DndContext>
    </MantineProvider>
  );
};
