import { motion } from 'motion/react';

import { Flex, FlexProps } from '/@/shared/components/flex/flex';
import { Group, GroupProps } from '/@/shared/components/group/group';
import { Stack, StackProps } from '/@/shared/components/stack/stack';

export const MotionFlex = motion.create<FlexProps>(Flex, { forwardMotionProps: true });

export const MotionGroup = motion.create<GroupProps>(Group, { forwardMotionProps: true });

export const MotionStack = motion.create<StackProps>(Stack, { forwardMotionProps: true });

export const MotionDiv = motion.div;
