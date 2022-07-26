import { PaginationItems } from '../types/types';

const getPaginationUrl = (url: string, action: 'next' | 'prev') => {
  const currentPageRegex = url.match(/page=(\d+)/gm);

  if (currentPageRegex) {
    const currentPage = Number(currentPageRegex[0].split('=')[1]);
    const newPage = action === 'next' ? currentPage + 1 : currentPage - 1;
    const normalizedUrl = process.env.APP_BASE_URL?.replace(/\/$/, '');

    return `${normalizedUrl}${url.replace(/page=\d+/gm, `page=${newPage}`)}`;
  }

  return null;
};

export const getSuccessResponse = (options: {
  data: any;
  paginationItems?: PaginationItems;
  statusCode: number;
}) => {
  const { statusCode, data, paginationItems } = options;

  let pagination;

  if (paginationItems) {
    const { startIndex, totalEntries, limit, url, page } = paginationItems;
    const hasPrevPage = startIndex - limit >= 0;
    const hasNextPage = startIndex + limit <= totalEntries;

    pagination = {
      currentPage: page,
      nextPage: hasNextPage ? getPaginationUrl(url, 'next') : null,
      prevPage: hasPrevPage ? getPaginationUrl(url, 'prev') : null,
      startIndex,
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
