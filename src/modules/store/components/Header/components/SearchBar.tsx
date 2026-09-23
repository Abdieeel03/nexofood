import React from "react";
import { Icon } from "@/components/ui/Icon";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center w-full bg-surface-container-low rounded-xl px-4 py-3 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-container">
      <input
        type="search"
        aria-label="Buscar restaurantes"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Busca restaurantes o categorías..."
        className="flex-1 min-w-0 bg-transparent outline-none text-sm font-medium text-on-surface placeholder:text-on-surface-variant"
      />
      <Icon name="search" size={22} className="ml-3 shrink-0 text-on-surface" />
    </div>
  );
};