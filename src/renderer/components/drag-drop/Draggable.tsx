import { useDraggable } from '@dnd-kit/core';

export const Draggable = ({ element, id, children, key }: any) => {
  const Element = element || 'div';
  const { attributes, listeners, setNodeRef } = useDraggable({
    id,
  });

  return (
    <Element key={key} ref={setNodeRef} {...listeners} {...attributes}>
      {children}
    </Element>
  );
};
