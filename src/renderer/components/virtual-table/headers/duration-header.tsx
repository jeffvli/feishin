import type { IHeaderParams } from '@ag-grid-community/core';
import { FiClock } from 'react-icons/fi';

export interface ICustomHeaderParams extends IHeaderParams {
    menuIcon: string;
}

export const DurationHeader = () => {
    return <FiClock size={15} />;
};
