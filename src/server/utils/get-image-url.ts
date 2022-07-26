export const getImageUrl = (
  serverType: string,
  baseUrl: string,
  imageId: string,
  token?: string
) => {
  if (serverType === 'jellyfin') {
    return (
      `${baseUrl}/Items` +
      `/${imageId}` +
      `/Images/Primary` +
      '?fillHeight=200' +
      `&fillWidth=200` +
      '&quality=90'
    );
  }

  return '';
};
