import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { materialsApi } from '../api';
import { Search, Download, FileText, Sparkles, BookOpen, AlertCircle } from 'lucide-react';

const SearchNotesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  const sampleKeywords = ['Normalization', 'B-Tree', 'ACID properties', 'Deadlock', 'Transactions', 'SQL Joins'];

  const executeSearch = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setError('Please enter at least 2 characters to search');
      return;
    }
    setError('');
    setLoading(true);
    setHasSearched(true);
    setSearchParams({ q: searchTerm });

    try {
      const res = await materialsApi.search(searchTerm.trim());
      setResults(res.data.results || []);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Failed to execute search. Make sure materials are uploaded.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      executeSearch(initialQuery);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    executeSearch(query);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Search className="w-6 h-6 text-indigo-600" />
          <span>Note Topic Search</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Perform keyword search across extracted text from all uploaded course notes, PDFs, and slide decks.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search concepts e.g. 'Functional Dependencies', 'Two Phase Locking'..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="py-3 px-6 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {loading ? 'Searching notes...' : (
              <>
                <Search className="w-4 h-4" />
                <span>Search Notes</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Quick suggestions:</span>
          {sampleKeywords.map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() => {
                setQuery(kw);
                executeSearch(kw);
              }}
              className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
            >
              {kw}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Search Results Area */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Scanning indexed documents and matching text passages...
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-sm text-slate-800">No matching text found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            We couldn't find any uploaded notes containing the keyword <span className="font-bold">"{query}"</span>. Try a broader search term or browse study materials directly.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {hasSearched && (
            <div className="text-xs font-semibold text-slate-500">
              Found {results.length} relevant document{results.length === 1 ? '' : 's'} matching "{query}"
            </div>
          )}

          {results.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {item.file_type}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      File: {item.file_name}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 leading-snug">{item.title}</h3>
                </div>

                <a
                  href={materialsApi.downloadUrl(item.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Document</span>
                </a>
              </div>

              {/* Text Snippet with context */}
              {item.snippet ? (
                <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed font-mono">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-sans">
                    Extracted Text Snippet:
                  </div>
                  <span>{item.snippet}</span>
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-500 italic">Matching document found in curriculum index.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchNotesPage;
