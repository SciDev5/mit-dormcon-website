import { createContext, type Dispatch, type SetStateAction } from "react";

const allDorms = "All Dorms";

export enum TimeFilter {
    AllEvents = "All Events",
    Ongoing = "Now",
    Upcoming = "Upcoming",
    OngoingUpcoming = "Now + Upcoming",
}

const everything = "Everything";

/**
 * Filter options for the T-REX app
 */
export interface FilterSettings {
    dormFilter?: string;
    groupFilter?: string;
    timeFilter?: TimeFilter;
    tagFilter?: string;
    bookmarksOnly?: boolean;
    searchValue?: string;
}

/**
 * Unset settings for the Event Filter.
 * Use this object to reference unset options for the filter.
 */
export const unsetFilter: FilterSettings = {
    dormFilter: allDorms,
    groupFilter: "All Groups",
    timeFilter: TimeFilter.AllEvents,
    tagFilter: everything,
    bookmarksOnly: false,
    searchValue: "",
};

export const FilterContext = createContext<{
    filter: FilterSettings;
    setFilter: Dispatch<SetStateAction<FilterSettings>>;
}>({} as { filter: FilterSettings; setFilter: Dispatch<SetStateAction<FilterSettings>> });

export const timeFilterMap: Record<string, TimeFilter> = {
    all: TimeFilter.AllEvents,
    ongoing: TimeFilter.Ongoing,
    not_ended: TimeFilter.OngoingUpcoming,
    upcoming: TimeFilter.Upcoming,
};