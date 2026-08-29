'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  allOptionLabel?: string;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  allowSearch?: boolean;
  required?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Escribe para buscar...',
  allOptionLabel,
  className = '',
  icon: Icon,
  disabled = false,
  allowSearch = true,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && allowSearch) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen, allowSearch]);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (opt.sublabel && opt.sublabel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(allOptionLabel ? 'ALL' : '');
  };

  const displayLabel =
    value === 'ALL' && allOptionLabel
      ? allOptionLabel
      : selectedOption
      ? selectedOption.label
      : placeholder;

  const SelectedIcon = selectedOption?.icon || Icon;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full h-10 px-3.5 rounded-xl border bg-white text-slate-900 text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs transition-all cursor-pointer ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {SelectedIcon && <SelectedIcon className="w-4 h-4 text-blue-600 shrink-0" />}
          <span className={`truncate text-left font-bold ${!selectedOption && value !== 'ALL' ? 'text-slate-400 font-normal' : 'text-slate-800'}`}>
            {displayLabel}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {value && value !== 'ALL' && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer transition"
              title="Limpiar selección"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100 min-w-[220px]">
          {allowSearch && (
            <div className="p-2 border-b border-slate-100 bg-slate-50/60">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full h-9 pl-9 pr-8 text-xs bg-white border border-blue-400/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 placeholder:text-slate-400 shadow-2xs"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto p-1.5 divide-y divide-slate-50">
            {allOptionLabel && (
              <div
                onClick={() => handleSelect('ALL')}
                className={`px-3 py-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition ${
                  value === 'ALL'
                    ? 'bg-blue-50 text-blue-800 font-bold'
                    : 'text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <span>{allOptionLabel}</span>
                {value === 'ALL' && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </div>
            )}

            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No se encontraron resultados para &quot;{searchTerm}&quot;
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                const OptIcon = opt.icon;

                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`px-3 py-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {OptIcon && <OptIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />}
                      <div className="truncate">
                        <p className={`truncate ${isSelected ? 'text-blue-900 font-bold' : 'text-slate-800'}`}>{opt.label}</p>
                        {opt.sublabel && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{opt.sublabel}</p>
                        )}
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
