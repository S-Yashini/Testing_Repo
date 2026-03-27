import { useState } from 'react';

interface SearchResult {
  sdsId: string;
  materialId: string;
  materialName: string;
  source: string;
}

interface MaterialSearchProps {
  onSelect: (result: SearchResult) => void;
  onClassify: (materialId: string) => void;
  existingRecords: SearchResult[];
}

const MaterialSearch = ({ onSelect, onClassify, existingRecords }: MaterialSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    
    if (!value.trim()) {
      setShowResults(false);
      setSearchResults([]);
      return;
    }

    // Filter results in real-time
    const results = existingRecords.filter(
      (record) =>
        record.materialId.toLowerCase().includes(value.toLowerCase()) ||
        record.materialName.toLowerCase().includes(value.toLowerCase())
    );
    setSearchResults(results);
    setShowResults(true);
  };

  const handleSelectResult = (result: SearchResult) => {
    onSelect(result);
    setShowResults(false);
    setSearchTerm('');
  };

  const handleClassify = () => {
    onClassify(searchTerm);
    setShowResults(false);
    setSearchTerm('');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg text-left font-semibold text-gray-900 mb-4">Search or Create New Material</h2>
      
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Enter Material ID or Name..."
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
        {searchTerm && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Search Results */}
      {showResults && (
        <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
          {searchResults.length > 0 ? (
            <div>
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-700">
                  Found {searchResults.length} existing material{searchResults.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {searchResults.map((result) => (
                  <div
                    key={result.sdsId}
                    onClick={() => handleSelectResult(result)}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 border-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{result.materialName}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Material ID: {result.materialId} | SDS ID: {result.sdsId} | Source: {result.source}
                        </p>
                      </div>
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="text-gray-400 text-4xl mb-3">🔍</div>
              <p className="text-gray-600 mb-4">
                No existing material found for "<span className="font-semibold">{searchTerm}</span>"
              </p>
              <button
                onClick={handleClassify}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors font-medium"
              >
                Classify New Material
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MaterialSearch;

