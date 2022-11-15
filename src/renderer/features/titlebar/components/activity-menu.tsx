import { useEffect, useState } from 'react';
import { Group } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import { FiActivity } from 'react-icons/fi';
import { RiRefreshLine } from 'react-icons/ri';
import styled from 'styled-components';
import { socket } from '@/renderer/api';
import { queryKeys } from '@/renderer/api/query-keys';
import { Button, Popover, Text } from '@/renderer/components';
import { useTaskList } from '@/renderer/features/tasks';
import { useAuthStore } from '@/renderer/store';
import { rotating } from '@/renderer/styles';

const StyledActivitySvg = styled(RiRefreshLine)`
  ${rotating}
  animation: rotating 1s linear infinite;
`;

export const ActivityMenu = () => {
  const queryClient = useQueryClient();
  const serverId = useAuthStore((state) => state.currentServer?.id) || '';
  const [isTaskRunning, setIsTaskRunning] = useState(false);
  const { data: tasks, refetch } = useTaskList({
    onSuccess: (data) => {
      if (data.data.length === 0) {
        queryClient.invalidateQueries(queryKeys.server.root(serverId));
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
          <Button px={5} size="xs" variant="subtle">
            {isTaskRunning ? (
              <StyledActivitySvg color="var(--primary-color)" size={15} />
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
