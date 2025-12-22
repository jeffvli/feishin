import {
    Breadcrumbs as MantineBreadcrumbs,
    BreadcrumbsProps as MantineBreadcrumbsProps,
} from '@mantine/core';

interface BreadcrumbProps extends MantineBreadcrumbsProps {}

export const Breadcrumb = ({ children, ...props }: BreadcrumbProps) => {
    return <MantineBreadcrumbs {...props}>{children}</MantineBreadcrumbs>;
};
