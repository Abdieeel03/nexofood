import React from "react";
import { Icon } from "@/components/ui/Icon";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center w-full bg-white border border-outline-variant rounded-xl px-4 py-2.5 transition-all focus-within:border-primary-container focus-within:ring-4 focus-within:ring-primary-container/15">
      <Icon name="search" size={20} className="text-on-surface-variant mr-3 shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Busca restaurantes, platos o categorías..."
        className="flex-1 min-w-0 bg-transparent outline-none text-sm font-medium text-on-surface placeholder:text-on-surface-variant"
      />
    </div>
  );
};