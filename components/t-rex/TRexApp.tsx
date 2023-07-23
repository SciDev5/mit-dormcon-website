/// <reference types="gtag.js" />
import React, { useContext, useEffect, useState } from "react";
import { EventFilter } from "./EventFilter";
import Link from "@docusaurus/Link";
import { BookmarkDropdownItem } from "./Bookmarks";
import Fuse from "fuse.js";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import duration from "dayjs/plugin/duration";
import clsx from "clsx";
import {
    FilterContext,
    FilterSettings,
    TimeFilter,
    unsetFilter,
} from "./filter";

declare const gtag: Gtag.Gtag;

dayjs.extend(relativeTime);
dayjs.extend(duration);

type TRexAppProps = {
    data?: TRexAPIResponse;
    fuse?: Fuse<TRexEvent>;
};

export function TRexApp(props: TRexAppProps) {
    if (!props.data)
        return (
            <div>
                <p>Loading...</p>
                <p>
                    <b>Stuck on this page?</b> Make sure you're connected to a
                    network and have JavaScript enabled.
                </p>
            </div>
        );
    const [events, setEvents] = useState(props.data.events);
    const [savedEvents, setSavedEvents] = useState<string[]>([]);
    const [showRelativeTime, setShowRelativeTime] = useState(true);
    const [filter, setFilter] = useState<FilterSettings>({
        ...unsetFilter,
        timeFilter: TimeFilter.OngoingUpcoming,
    });

    useEffect(() => {
        const savedStorage = localStorage.getItem("savedEvents");
        if (savedStorage) setSavedEvents(JSON.parse(savedStorage));
    }, []);
    useEffect(() => {
        localStorage.setItem("savedEvents", JSON.stringify(savedEvents));
    }, [savedEvents]);

    return (
        <FilterContext.Provider value={{ filter, setFilter }}>
            <div className="margin-vert--md">
                <p className="margin-bottom--sm">
                    <Link to="/rex/toolbox">🧰</Link>&emsp;
                    <Link to="/rex/help">❓</Link>&emsp;
                    <b>{events.length}</b>/{props.data.events.length} events,
                    published {new Date(props.data.published).toLocaleString()}
                </p>
                <EventFilter
                    fuse={props.fuse}
                    events={props.data.events}
                    setEvents={setEvents}
                    dorms={props.data.dorms}
                    tags={props.data.tags}
                    saved={savedEvents}
                    showRelativeTime={showRelativeTime}
                    setRelativeTime={setShowRelativeTime}
                />
                <EventLayout
                    events={events}
                    saved={savedEvents}
                    setSaved={setSavedEvents}
                    colors={props.data.colors}
                    showRelativeTime={showRelativeTime}
                />
            </div>
        </FilterContext.Provider>
    );
}

type EventLayoutProps = {
    events: TRexEvent[];
    saved: string[];
    setSaved: (saved: string[]) => void;
    colors: TRexAPIColors;
    showRelativeTime: boolean;
};

function EventLayout(props: EventLayoutProps) {
    const unsaveFunc = (n: string) =>
        props.setSaved(props.saved.filter((name) => name !== n));
    const saveFunc = (n: string) =>
        !props.saved.includes(n) && props.setSaved(props.saved.concat([n]));

    return (
        <div className="container margin-top--sm">
            {props.events.length ? (
                <div className="row">
                    {props.events.map((e, idx) => (
                        <div key={idx} className="col col--4">
                            <EventCard
                                event={e}
                                isSaved={props.saved.includes(e.name)}
                                unsave={unsaveFunc}
                                save={saveFunc}
                                colors={props.colors}
                                showRelativeTime={props.showRelativeTime}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="alert alert--secondary" role="alert">
                    💀 <b>No events match this filter.</b> Try adjusting the
                    filters above to see more events.
                </div>
            )}
        </div>
    );
}

type EventCardProps = {
    event: TRexEvent;
    isSaved: boolean;
    unsave: (name: string) => void;
    save: (name: string) => void;
    colors: TRexAPIColors;
    showRelativeTime: boolean;
};

function EventCard(props: EventCardProps) {
    const [dateStrings, setDateStrings] = useState<DateDisplayInfo>({
        duration: "",
        timeContext: "",
        timeContextExact: "",
    });
    const { filter, setFilter } = useContext(FilterContext);

    useEffect(() => {
        setDateStrings(eventDateDisplay(props.event.start, props.event.end));
        const intervalId = setInterval(
            () =>
                setDateStrings(
                    eventDateDisplay(props.event.start, props.event.end),
                ),
            60 * 1000,
        );
        return () => clearInterval(intervalId);
    }, [props]);

    return (
        <div className="card margin-vert--sm">
            <div
                className="card__header"
                style={{ display: "flex", justifyContent: "space-between" }}
            >
                <div>
                    <h4 className="margin-vert--none margin-right--sm">
                        {props.isSaved && "⭐️ "}
                        {props.event.name}
                    </h4>
                    <div>
                        {props.event.tags.map((tag, idx) => (
                            <ColoredBadge
                                key={idx}
                                className="badge badge--secondary margin-right--sm"
                                color={props.colors.tags.get(tag)}
                                onClick={() =>
                                    setFilter({ ...filter, tagFilter: tag })
                                }
                            >
                                {tag}
                            </ColoredBadge>
                        ))}
                    </div>
                </div>
                <div className="dropdown dropdown--right dropdown--hoverable">
                    <button className="button button--primary button--outline button--sm">
                        ▼
                    </button>
                    <ul className="dropdown__menu">
                        <GCalButton event={props.event} />
                        <BookmarkDropdownItem
                            name={props.event.name}
                            save={props.save}
                            unsave={props.unsave}
                            isSaved={props.isSaved}
                        />
                    </ul>
                </div>
            </div>
            <div className="card__body">
                <ExpandableText
                    text={props.event.description}
                    className="margin-bottom--sm"
                />
                <DateDisplay
                    dateStrings={dateStrings}
                    showRelativeTime={props.showRelativeTime}
                />
            </div>
            <div
                className="card__footer"
                style={{ display: "flex", flexWrap: "wrap" }}
            >
                <ColoredBadge
                    className="badge badge--primary margin-right--md"
                    color={props.colors.dorms.get(props.event.dorm)}
                    onClick={() =>
                        setFilter({ ...filter, dormFilter: props.event.dorm })
                    }
                >
                    {props.event.dorm}
                </ColoredBadge>
                <div
                    style={{ color: "var(--ifm-color-secondary-darkest)" }}
                    className="margin-right--sm"
                >
                    🕒 {dateStrings.duration}
                </div>
                <div style={{ color: "var(--ifm-color-secondary-darkest)" }}>
                    📍{" "}
                    <Link
                        to={`https://mobi.mit.edu/default/map/search?filter=${encodeURIComponent(
                            props.event.location,
                        )}`}
                    >
                        {props.event.location}
                    </Link>
                </div>
            </div>
        </div>
    );
}

function DateDisplay(props: {
    dateStrings: DateDisplayInfo;
    showRelativeTime: boolean;
}) {
    const { showRelativeTime } = props;
    return (
        <p>
            {showRelativeTime ? "⏱" : "⏰"}
            &ensp;
            <span style={{ fontStyle: "italic" }}>
                {showRelativeTime
                    ? props.dateStrings.timeContext
                    : props.dateStrings.timeContextExact}
            </span>
        </p>
    );
}

function ColoredBadge(props: {
    color?: string;
    className: string;
    onClick?: React.MouseEventHandler;
    children: React.ReactNode;
}) {
    let textColor: string;

    if (props.color !== undefined) {
        const r = parseInt(props.color.substring(1, 3), 16);
        const g = parseInt(props.color.substring(3, 5), 16);
        const b = parseInt(props.color.substring(5), 16);
        textColor = r * 0.299 + g * 0.587 + b * 0.114 > 186 ? "#000" : "#fff";
    }

    return (
        <div
            className={props.className}
            style={{
                backgroundColor: props.color,
                borderColor: props.color,
                color: textColor,
                // Set cursor to pointer only when tag is clickable
                cursor: props.onClick && "pointer",
            }}
            onClick={props.onClick}
        >
            {props.children}
        </div>
    );
}

function ExpandableText(props: {
    text: string;
    expandAmount?: number;
    className: string;
}) {
    const [expanded, setExpanded] = useState(false);
    let truncated = props.text;
    const expandAmount = props.expandAmount || 140;
    let truncatePoint = 0;
    if (props.text.length > expandAmount) {
        truncatePoint = props.text.lastIndexOf(" ", 140);
        truncated = props.text.substring(0, truncatePoint);
    }
    return (
        <p className={props.className}>
            {truncated}
            {props.text.length > expandAmount && (
                <span>
                    {expanded && props.text.substring(truncatePoint)}{" "}
                    <a
                        onClick={(e) => {
                            e.preventDefault();
                            setExpanded(!expanded);
                        }}
                        href="#"
                        style={{ fontStyle: "italic" }}
                    >
                        {expanded ? "show less" : "show more"}
                    </a>
                </span>
            )}
        </p>
    );
}

type DateDisplayInfo = {
    duration: string;
    /** A relative time representation of the event's start/end */
    timeContext: string;
    /** An exact time representation of the event's start/end */
    timeContextExact: string;
};

function eventDateDisplay(start: Date, end: Date): DateDisplayInfo {
    const duration = dayjs.duration(dayjs(end).diff(start)).humanize();
    let timeContext = "";
    let timeUntil: Date;
    if (dayjs().isBefore(start)) {
        timeContext += "Starts ";
        timeUntil = start;
    } else if (dayjs().isBefore(end)) {
        timeContext += "Ends ";
        timeUntil = end;
    } else {
        timeContext += "Ended ";
        timeUntil = end;
    }
    const timeContextExact = timeContext + timeUntil.toLocaleString();
    timeContext += dayjs(timeUntil).fromNow();
    return {
        duration,
        timeContext,
        timeContextExact,
    };
}

function GCalButton(props: { event: TRexEvent }) {
    function logAnalytics() {
        if (typeof gtag !== "undefined") {
            gtag("event", "calendar", { event_label: props.event.name });
        }
    }
    const padNumber = (num: number) => num.toString().padStart(2, "0");
    const formatGCalDate = (date: Date) =>
        `${date.getUTCFullYear()}${padNumber(date.getUTCMonth() + 1)}` +
        `${padNumber(date.getUTCDate())}T${padNumber(
            date.getUTCHours(),
        )}${padNumber(date.getUTCMinutes())}` +
        `${padNumber(date.getUTCSeconds())}Z`;

    const buttonLink =
        `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${props.event.dorm}: ${props.event.name}` +
        `&dates=${formatGCalDate(props.event.start)}/${formatGCalDate(
            props.event.end,
        )}&ctz=America/New_York&details=${props.event.description}` +
        `&location=${props.event.location}`;
    return (
        <Link
            className="dropdown__link"
            to={encodeURI(buttonLink)}
            onClick={logAnalytics}
        >
            🗓 Add to Calendar
        </Link>
    );
}

export function TRexEntryButton() {
    return (
        <div className="margin-bottom--md" style={{ textAlign: "center" }}>
            <Link
                to="/rex/events"
                className={clsx("button button--primary button--lg")}
            >
                Check out our REX Events!
            </Link>
        </div>
    );
}
