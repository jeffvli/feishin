import type { IHeaderParams } from '@ag-grid-community/core';

import { Icon } from '/@/shared/components/icon/icon';

export interface ICustomHeaderParams extends IHeaderParams {
    menuIcon: string;
}

export const DurationHeader = () => {
    return (
        <Icon
            icon="duration"
            size="sm"
        />
    );
};
