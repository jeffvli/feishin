import { PaginationItems } from '../types/types';

const getPaginationUrl = (
  url: string,
  skip: number,
  take: number,
  action: 'next' | 'prev'
) => {
  if (action === 'next') {
    return url.replace(/skip=(\d+)/gm, `skip=${skip + take}`);
  }

  return url.replace(/skip=(\d+)/gm, `skip=${skip - take}`);
};

export const getSuccessResponse = (options: {
  data: any;
  paginationItems?: PaginationItems;
  statusCode: number;
}) => {
  const { statusCode, data, paginationItems } = options;

  let pagination;

  if (paginationItems) {
    const { skip, totalEntries, take, url } = paginationItems;

    const hasPrevPage = skip - take >= 0;
    const hasNextPage = skip + take <= totalEntries;

    pagination = {
      nextPage: hasNextPage ? getPaginationUrl(url, skip, take, 'next') : null,
      prevPage: hasPrevPage ? getPaginationUrl(url, skip, take, 'prev') : null,
      skip,
      totalEntries,
    };
  }

  return {
    data,
    pagination,
    response: 'Success',
    statusCode,
  };
};
