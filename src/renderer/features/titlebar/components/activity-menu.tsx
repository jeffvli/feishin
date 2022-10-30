import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Group } from '@mantine/core';
import { FiActivity } from 'react-icons/fi';
import { RiRefreshLine } from 'react-icons/ri';
import { socket } from '@/renderer/api';
import { Button, Popover, Text } from '@/renderer/components';
import { useTaskList } from '@/renderer/features/tasks';
import { rotating } from '@/renderer/styles';

const StyledActivitySvg = styled(RiRefreshLine)`
  ${rotating}
  animation: rotating 1s linear infinite;
`;

export const ActivityMenu = () => {
  const [isTaskRunning, setIsTaskRunning] = useState(false);
  const { data: tasks, refetch } = useTaskList({
    onSuccess: (data) => {
      if (data.data.length === 0) {
        return setIsTaskRunning(false);
      }

      return setIsTaskRunning(true);
    },
    refetchInterval: isTaskRunning ? 5000 : undefined,
  });

  // const cancelTask = useCancelTask();
  // const cancelAllTasks = useCancelAllTasks();

  // const handleCancelTask = (taskId: string) => {
  //   cancelTask.mutate(
  //     { query: { taskId } },
  //     {
  //       onSuccess: () => {
  //         toast.info({ message: 'Task cancelled' });
  //       },
  //     }
  //   );
  // };

  // const handleCancelAllTasks = (taskId: string) => {
  //   cancelAllTasks.mutate(null, {
  //     onSuccess: () => {
  //       toast.info({ message: 'All tasks cancelled' });
  //     },
  //   });
  // };

  useEffect(() => {
    socket.on('task:started', () => {
      setTimeout(() => refetch(), 1000);
      setIsTaskRunning(true);
    });

    return () => {
      socket.off('task:started');
    };
  }, [refetch]);

  return (
    <>
      <Popover withArrow withinPortal>
        <Popover.Target>
          <Button
            px={5}
            size="xs"
            sx={{ color: 'var(--titlebar-fg)' }}
            variant="subtle"
          >
            {isTaskRunning ? (
              <StyledActivitySvg size={15} />
            ) : (
              <FiActivity size={15} />
            )}
          </Button>
        </Popover.Target>
        <Popover.Dropdown>
          {isTaskRunning ? (
            tasks?.data?.map((task) => (
              <Group key={task.id} position="apart">
                <Text>{task.note}</Text>
              </Group>
            ))
          ) : (
            <Text>No tasks running</Text>
          )}
        </Popover.Dropdown>
      </Popover>
    </>
  );
};
