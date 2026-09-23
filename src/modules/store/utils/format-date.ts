const formatter = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" });

export const formatOrderDate = (iso: string) => formatter.format(new Date(iso));
