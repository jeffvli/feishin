export type User = {
    type: 'user';
    displayName: string;
    images: [];
    uri: string;
    username: string;
};

export type UserAPI = {
    getUser: () => Promise<User>;
};
