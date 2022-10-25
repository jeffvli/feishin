import { PaginationItems, SuccessResponse } from '../types/types';

export class ApiSuccess {
  data: any;
  statusCode: number;
  paginationItems?: PaginationItems;

  constructor(options: {
    data: any;
    paginationItems?: PaginationItems;
    statusCode: number;
  }) {
    this.data = options.data;
    this.statusCode = options.statusCode;
    this.paginationItems = options.paginationItems;
  }

  static ok({ data, paginationItems }: SuccessResponse) {
    return new ApiSuccess({
      data,
      paginationItems,
      statusCode: 200,
    });
  }

  static created({ data, paginationItems }: SuccessResponse) {
    return new ApiSuccess({ data, paginationItems, statusCode: 201 });
  }

  static accepted({ data, paginationItems }: SuccessResponse) {
    return new ApiSuccess({ data, paginationItems, statusCode: 202 });
  }

  static noContent({ data, paginationItems }: SuccessResponse) {
    return new ApiSuccess({ data, paginationItems, statusCode: 204 });
  }

  static resetContent({ data, paginationItems }: SuccessResponse) {
    return new ApiSuccess({ data, paginationItems, statusCode: 205 });
  }

  static partialContent({ data, paginationItems }: SuccessResponse) {
    return new ApiSuccess({ data, paginationItems, statusCode: 206 });
  }
}
