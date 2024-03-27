export type FilterParameter<T> = {
    property: keyof T;
    value: any;
    operator:
        | 'eq'
        | 'ne'
        | 'lt'
        | 'le'
        | 'gt'
        | 'ge'
        | 'contains'
        | 'startsWith'
        | 'bitMask';
};

export type SortParameter<T> = {
    property: keyof T;
    desc?: true;
};

export type QueryParameter<T> = {
    filters?: FilterParameter<T>[];
    sort?: SortParameter<T>[];
    start?: number;
    length?: number;
};
