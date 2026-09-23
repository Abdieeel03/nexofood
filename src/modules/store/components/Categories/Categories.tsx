import React from "react";
import { Icon } from "@/components/ui/Icon";
import { ALL_CATEGORY, CATEGORIES } from "./constants";

type CategoriesProps = {
  activeCategory: string; // "all" o el nombre de la categoría
  onChange: (category: string) => void;
};

export const Categories: React.FC<CategoriesProps> = ({ activeCategory, onChange }) => {
  return (
    <section className="bg-white rounded-2xl border border-border-subtle shadow-level-1 px-4 py-1">
      {/* py/px internos: dejan espacio para el anillo y el zoom sin que overflow los recorte */}
      <div className="flex items-start gap-3 overflow-x-auto hide-scrollbar py-3 px-1">
        {[ALL_CATEGORY, ...CATEGORIES].map((cat) => {
          const value = cat.id === "all" ? "all" : cat.name;
          const active = activeCategory === value;

          return (
            <button
              key={cat.id}
              onClick={() => onChange(value)}
              className="flex-1 min-w-[88px] flex flex-col items-center gap-2.5 group cursor-pointer"
            >
              <div
                className={`w-16 h-16 rounded-full bg-linear-to-br ${cat.gradient} text-white flex items-center justify-center shadow-md transition-all duration-300 ${
                  active
                    ? "ring-4 ring-offset-2 ring-primary scale-105 shadow-lg"
                    : "group-hover:scale-110 group-hover:shadow-lg"
                }`}
              >
                <Icon name={cat.icon} size={32} fill />
              </div>
              <span
                className={`text-xs font-bold transition-colors ${
                  active ? "text-primary" : "text-on-surface group-hover:text-primary"
                }`}
              >
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};