"use client";

import React, { useRef } from "react";

export interface SuperadminTabOption<T extends string = string> {
  id: T;
  label: string;
  count?: number;
}

export interface SuperadminTabsProps<T extends string = string> {
  ariaLabel: string;
  tabs: SuperadminTabOption<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
  getTabDomId: (id: T) => string;
  className?: string;
}

export function SuperadminTabs<T extends string = string>({
  ariaLabel,
  tabs,
  selectedId,
  onSelect,
  getTabDomId,
  className = "",
}: SuperadminTabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (tabs.length === 0) return;

    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % tabs.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();

    const nextTab = tabs[nextIndex];
    if (!nextTab) return;
    onSelect(nextTab.id);

    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>(
      'button[role="tab"]'
    );
    const targetButton = buttons?.[nextIndex];
    targetButton?.focus();
    targetButton?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      {...({ focusgroup: "tablist nomemory" } as Record<string, string>)}
      className={`flex items-center gap-1 overflow-x-auto hide-scrollbar border-b border-outline-variant/70 scroll-smooth ${className}`}
    >
      {tabs.map((tab, index) => {
        const isSelected = tab.id === selectedId;
        return (
          <button
            key={tab.id}
            id={getTabDomId(tab.id)}
            type="button"
            role="tab"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            {...(isSelected ? { focusgroupstart: "" } : {})}
            onClick={(event) => {
              onSelect(tab.id);
              event.currentTarget.scrollIntoView({
                block: "nearest",
                inline: "nearest",
              });
            }}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`sa-tab inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-primary ${
              isSelected
                ? "text-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                  isSelected
                    ? "bg-mint-subtle text-on-primary-fixed"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
