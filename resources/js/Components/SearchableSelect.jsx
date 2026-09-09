import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import InputError from './InputError';

export default function SearchableSelect({
    items = [],
    value = '',
    onChange,
    placeholder = 'ابحث...',
    searchKeys = ['name'],
    displayFormat = (item) => item.name,
    valueKey = 'id',
    className = '',
    error = '',
    disabled = false,
    renderOption = null,
    inputRef = null,
    onInputChange = null,
    onKeyDown = null,
}) {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    
    const wrapperRef = useRef(null);
    const listRef = useRef(null);

    // Sync external value to internal search display
    useEffect(() => {
        if (value !== undefined && value !== null && value !== '') {
            const selectedItem = items.find(item => item[valueKey] == value);
            if (selectedItem) {
                setSearch(displayFormat(selectedItem));
            } else {
                setSearch(String(value));
            }
        } else {
            setSearch('');
        }
    }, [value, items, valueKey]);

    // Reset active index when search or open state changes
    useEffect(() => {
        setActiveIndex(-1);
    }, [search, isOpen]);

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter items based on search term
    const filteredItems = items.filter(item => {
        if (!search) return true;
        
        // If the search string matches the currently selected display exactly, show all items 
        // to allow selecting a different one when they just click to open.
        const selectedItem = items.find(i => i[valueKey] == value);
        if (selectedItem && search === displayFormat(selectedItem)) {
            return true;
        }

        const searchTerm = search.toLowerCase();
        return searchKeys.some(key => {
            const val = item[key];
            return val && val.toString().toLowerCase().includes(searchTerm);
        });
    });

    // Scroll active item into view
    useEffect(() => {
        if (isOpen && activeIndex >= 0 && listRef.current) {
            const activeEl = listRef.current.children[activeIndex];
            if (activeEl) {
                activeEl.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [activeIndex, isOpen]);

    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setIsOpen(true);
                return;
            }
            if (onKeyDown) {
                onKeyDown(e);
            }
            return;
        }

        if (filteredItems.length === 0) {
            if (onKeyDown) onKeyDown(e);
            return;
        }
        
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex(prev => prev < filteredItems.length - 1 ? prev + 1 : 0);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex(prev => prev > 0 ? prev - 1 : filteredItems.length - 1);
        } else if (e.key === "Enter") {
            if (activeIndex >= 0 && activeIndex < filteredItems.length) {
                e.preventDefault();
                handleSelect(filteredItems[activeIndex]);
            } else if (onKeyDown) {
                onKeyDown(e);
            }
        } else if (e.key === "Escape") {
            e.preventDefault();
            setIsOpen(false);
        } else if (onKeyDown) {
            onKeyDown(e);
        }
    };

    const handleSelect = (item) => {
        setSearch(displayFormat(item));
        setIsOpen(false);
        if (onChange) {
            onChange(item);
        }
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-2.5 pointer-events-none z-10">
                    <Search className="h-3.5 w-3.5 text-text-muted" />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    className={`block w-full ps-8 pe-3 border border-border bg-surface text-text rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-xs transition-colors ${error ? 'border-danger focus:border-danger focus:ring-danger' : ''} ${className}`}
                    placeholder={placeholder}
                    value={search}
                    onChange={(e) => {
                        const newVal = e.target.value;
                        setSearch(newVal);
                        if (!isOpen) setIsOpen(true);
                        if (onInputChange) {
                            onInputChange(newVal);
                        }
                        if (newVal === '' && onChange) {
                            onChange(null);
                        }
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    dir="auto"
                />
            </div>
            
            {isOpen && !disabled && (
                <div 
                    ref={listRef}
                    className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-surface border border-border rounded-md shadow-lg"
                >
                    {filteredItems.length > 0 ? (
                        filteredItems.map((item, index) => (
                            <div
                                key={item[valueKey] ?? index}
                                className={`px-3 py-2 cursor-pointer transition-colors text-xs border-b border-border last:border-0 ${
                                    activeIndex === index 
                                        ? 'bg-primary text-white' 
                                        : 'text-text hover:bg-primary/10'
                                }`}
                                onMouseDown={(e) => {
                                    // prevent input blur
                                    e.preventDefault();
                                    handleSelect(item);
                                }}
                                onMouseEnter={() => setActiveIndex(index)}
                            >
                                {renderOption ? renderOption(item, activeIndex === index) : displayFormat(item)}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-3 text-xs text-text-muted text-center">
                            لا توجد نتائج
                        </div>
                    )}
                </div>
            )}
            {error && <InputError message={error} className="mt-1" />}
        </div>
    );
}
