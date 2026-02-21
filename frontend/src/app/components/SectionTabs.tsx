"use client";

import { Section } from "@/lib/types";

interface SectionTabsProps {
    sections: Section[];
    activeSection: string | null;
    onSectionChange: (slug: string | null) => void;
}

export default function SectionTabs({
    sections,
    activeSection,
    onSectionChange,
}: SectionTabsProps) {
    return (
        <div className="mb-6">
            {/* Mobile: horizontal scroll */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide sm:flex-wrap sm:overflow-visible">
                {/* All sections tab */}
                <button
                    onClick={() => onSectionChange(null)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${activeSection === null
                            ? "bg-violet-600 text-white shadow-md shadow-violet-500/25"
                            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        }`}
                >
                    Tutti
                </button>

                {sections.map((section) => (
                    <button
                        key={section.id}
                        onClick={() => onSectionChange(section.slug)}
                        className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${activeSection === section.slug
                                ? "bg-violet-600 text-white shadow-md shadow-violet-500/25"
                                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                            }`}
                    >
                        {section.name}
                        {section.listing_count > 0 && (
                            <span
                                className={`ml-2 rounded-full px-2 py-0.5 text-xs ${activeSection === section.slug
                                        ? "bg-violet-500 text-white"
                                        : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                                    }`}
                            >
                                {section.listing_count}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
