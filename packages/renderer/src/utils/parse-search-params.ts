export const parseSearchParams = (searchParams: Record<any, any>) => {
  return JSON.parse(JSON.stringify(searchParams));
};
