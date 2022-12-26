import isUndefined from 'lodash/isUndefined';
import omitBy from 'lodash/omitBy';

export const parseSearchParams = (searchParams: Record<any, any>) => {
  const params = new URLSearchParams();
  const paramsWithoutUndefined = omitBy(searchParams, isUndefined);

  Object.entries(paramsWithoutUndefined).forEach(([key, value]) => {
    if (!Array.isArray(value)) {
      params.append(key, value.toString());
    } else {
      value.forEach((value) => params.append(key, value.toString()));
    }
  });

  return params.toString();
};
