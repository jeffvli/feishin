const getJellyfinImageUrl = (baseUrl: string, item: any, size?: number) => {
  return (
    `${baseUrl}/Items` +
    `/${item.Id}` +
    `/Images/Primary${
      size ? `?width=${size}&height=${size}` : '?height=350'
    }&quality=90`
  );
};
