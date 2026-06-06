'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import Link from 'next/link';

interface SearchResult {
  id: string;
  name: string;
  category: string;
  price: number;
  image?: string;
}

const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    name: 'Cashmere Sweater',
    category: 'Clothing',
    price: 249.99,
  },
  {
    id: '2',
    name: 'Silk Blouse',
    category: 'Clothing',
    price: 129.99,
  },
  {
    id: '3',
    name: 'Wellness Retreat Set',
    category: 'Wellness',
    price: 59.99,
  },
  {
    id: '4',
    name: 'Designer Sunglasses',
    category: 'Accessories',
    price: 199.99,
  },
  {
    id: '5',
    name: 'Luxury Face Cream',
    category: 'Beauty',
    price: 79.99,
  },
];

export function SearchBar({ className }: { className?: string }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = (value: string) => {
    setQuery(value);

    if (value.trim()) {
      const filtered = mockSearchResults.filter(
        (item) =>
          item.name.toLowerCase().includes(value.toLowerCase()) ||
          item.category.toLowerCase().includes(value.toLowerCase())
      );
      setResults(filtered);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative w-full max-w-md', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          className="w-full pl-10 pr-10 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50">
          <div className="max-h-96 overflow-y-auto">
            {results.map((result) => (
              <Link
                key={result.id}
                href={`/products/${result.id}`}
                onClick={() => handleClear()}
              >
                <div className="px-4 py-3 hover:bg-secondary transition flex justify-between items-center border-b border-border last:border-b-0">
                  <div>
                    <p className="font-semibold text-foreground">{result.name}</p>
                    <p className="text-xs text-muted-foreground">{result.category}</p>
                  </div>
                  <p className="font-semibold">${result.price.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>

          {results.length > 0 && (
            <Link href={`/shop?q=${query}`}>
              <div className="px-4 py-3 text-center text-sm font-semibold text-primary hover:bg-secondary transition border-t border-border">
                View all results for "{query}"
              </div>
            </Link>
          )}
        </div>
      )}

      {isOpen && query && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg p-4 text-center text-muted-foreground z-50">
          No products found for &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}
