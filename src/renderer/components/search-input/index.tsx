import { ChangeEvent, KeyboardEvent } from 'react';
import { TextInputProps } from '@mantine/core';
import { useFocusWithin, useHotkeys, useMergedRef } from '@mantine/hooks';
import { RiSearchLine } from 'react-icons/ri';
import { TextInput } from '/@/renderer/components/input';

interface SearchInputProps extends TextInputProps {
  initialWidth?: number;
  openedWidth?: number;
  value?: string;
}

export const SearchInput = ({
  initialWidth,
  onChange,
  openedWidth,
  ...props
}: SearchInputProps) => {
  const { ref, focused } = useFocusWithin();
  const mergedRef = useMergedRef<HTMLInputElement>(ref);

  const isOpened = focused || ref.current?.value;

  useHotkeys([
    [
      'ctrl+F',
      () => {
        ref.current.select();
      },
    ],
  ]);

  const handleEscape = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.code === 'Escape') {
      onChange?.({ target: { value: '' } } as ChangeEvent<HTMLInputElement>);
      ref.current.value = '';
      ref.current.blur();
    }
  };

  return (
    <TextInput
      ref={mergedRef}
      {...props}
      icon={<RiSearchLine size={15} />}
      styles={{
        input: {
          backgroundColor: isOpened ? 'inherit' : 'transparent !important',
          border: 'none !important',
          padding: isOpened ? '10px' : 0,
        },
      }}
      width={isOpened ? openedWidth || 200 : initialWidth || 50}
      onChange={onChange}
      onKeyDown={handleEscape}
    />
  );
};
