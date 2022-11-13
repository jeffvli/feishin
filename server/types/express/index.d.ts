declare namespace Express {
  export interface Request {
    authUser: {
      createdAt: Date;
      deviceId: string;
      enabled: boolean;
      flatServerFolderPermissions: string[];
      flatServerPermissions: string[];
      id: string;
      isAdmin: boolean;
      isSuperAdmin: boolean;
      serverFolderPermissions: {
        createdAt: Date;
        id: string;
        serverFolderId: string;
        updatedAt: Date;
        userId: string;
      }[];
      serverId: string;
      serverPermissions: {
        createdAt: Date;
        id: string;
        serverId: string;
        type: any;
        updatedAt: Date;
        userId: string;
      }[];
      updatedAt: Date;
      username: string;
    };
  }
}
