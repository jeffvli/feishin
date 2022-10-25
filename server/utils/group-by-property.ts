export const groupByProperty = (object: any, property: string) => {
  return object.reduce((groups: any, item: any) => {
    const group = groups[item[property]] || [];
    group.push(item);
    groups[item[property]] = group;
    return groups;
  }, {});
};
