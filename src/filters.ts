interface Filters {
  include: string[];
  exclude: string[];
  highlight: string[];
}

export function saveFilters(filters: Filters) {
  return chrome.storage.sync.set({
    filters,
  });
}

export async function getFilters(): Promise<Filters> {
  const filters = await chrome.storage.sync.get("filters");
  return filters.filters || { include: [], exclude: [], highlight: [] };
}

export async function isIncluded(str?: string): Promise<boolean> {
  if (!str) return false;
  const filters = await getFilters();
  const isInclude = filters.include.some((includeStr) =>
    new RegExp(includeStr, "ig").test(str),
  );

  return (
    isInclude &&
    !filters.exclude.some((excludeStr) =>
      new RegExp(excludeStr, "ig").test(str),
    )
  );
}

export async function isHighlighted(str?: string): Promise<boolean> {
  if (!str) return false;
  const filters = await getFilters();

  return filters.highlight.some((includeStr) =>
    new RegExp(includeStr, "ig").test(str),
  );
}
