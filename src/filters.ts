interface Filters {
    include: string[];
    exclude: string[];
}

export function saveFilters(filters: Filters) {
    return chrome.storage.sync.set({
        filters,
    })
}

export async function getFilters(): Promise<Filters> {
    return (await chrome.storage.sync.get('filters')).filters as Filters
}

export async function isMatched(str?: string): Promise<boolean> {
    if (!str) return false;
    const filters = await getFilters();
    const isInclude = filters.include.some((includeStr) => new RegExp(includeStr, 'ig').test(str));
    return isInclude && !filters.exclude.every((excludeStr) => new RegExp(excludeStr, 'ig').test(str));
}