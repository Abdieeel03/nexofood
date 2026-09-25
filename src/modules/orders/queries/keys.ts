export const saasOrdersKeys = {
  all: ["saas-orders"] as const,
  lists: () => [...saasOrdersKeys.all, "list"] as const,
  list: (filters?: { channel?: string }) =>
    [...saasOrdersKeys.lists(), filters] as const,
  details: () => [...saasOrdersKeys.all, "detail"] as const,
  detail: (id: string) => [...saasOrdersKeys.details(), id] as const,
};
