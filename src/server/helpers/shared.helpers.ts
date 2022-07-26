const serverFolderFilter = (serverFolderIds: number[]) => {
  return serverFolderIds!.map((serverFolderId: number) => {
    return {
      serverFolders: { some: { id: { equals: Number(serverFolderId) } } },
    };
  });
};

export const sharedHelpers = {
  serverFolderFilter,
};
