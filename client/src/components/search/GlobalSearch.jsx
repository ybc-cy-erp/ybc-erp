import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import counterpartyService from '../../services/counterpartyService';
import itemService from '../../services/itemService';
import './GlobalSearch.css';

export default function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        const [counterparties, items] = await Promise.all([
          counterpartyService.getAll({ search: query }),
          itemService.getAll({ search: query }),
        ]);

        const mapped = [
          ...counterparties.slice(0, 5).map((c) => ({
            id: c.id,
            type: 'counterparty',
            title: c.name,
            subtitle: c.email || c.phone || 'Контрагент',
            path: `/counterparties`,
          })),
          ...items.slice(0, 5).map((i) => ({
            id: i.id,
            type: 'item',
            title: i.name,
            subtitle: i.code || 'Товар/Послуга',
            path: `/items`,
          })),
        ];

        setResults(mapped);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  const handleSelect = (result) => {
    navigate(result.path);
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="global-search-overlay" onClick={onClose}>
      <div className="global-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="global-search-input-wrapper">
          <span className="global-search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Пошук контрагентів, товарів..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="global-search-input"
          />
          {loading && <span className="global-search-loading">⏳</span>}
        </div>

        {results.length > 0 && (
          <div className="global-search-results">
            {results.map((result, index) => (
              <div
                key={`${result.type}-${result.id}`}
                className={`global-search-result-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="result-icon">
                  {result.type === 'counterparty' ? '👤' : '📦'}
                </div>
                <div className="result-content">
                  <div className="result-title">{result.title}</div>
                  <div className="result-subtitle">{result.subtitle}</div>
                </div>
                <div className="result-type-badge">{result.type === 'counterparty' ? 'Контрагент' : 'Товар'}</div>
              </div>
            ))}
          </div>
        )}

        {query && results.length === 0 && !loading && (
          <div className="global-search-empty">Нічого не знайдено</div>
        )}

        <div className="global-search-footer">
          <kbd>↑↓</kbd> навігація · <kbd>Enter</kbd> відкрити · <kbd>Esc</kbd> закрити
        </div>
      </div>
    </div>
  );
}
