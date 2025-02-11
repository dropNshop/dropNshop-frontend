import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchProducts } from '../services/api';
import ProductsTable from '../components/ProductsTable';
import toast from 'react-hot-toast';
import Loading from '../components/common/Loading';

// ============ Constants ============
const FILTER_OPTIONS = {
  ALL: 'all',
  IN_STOCK: 'in_stock',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock'
};

// ============ Component ============
export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState(FILTER_OPTIONS.ALL);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchProducts();
      setProducts(response.data);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to load products';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Filter and search logic
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      switch (filterStatus) {
        case FILTER_OPTIONS.IN_STOCK:
          return product.stock_quantity > 10;
        case FILTER_OPTIONS.LOW_STOCK:
          return product.stock_quantity > 0 && product.stock_quantity <= 10;
        case FILTER_OPTIONS.OUT_OF_STOCK:
          return product.stock_quantity === 0;
        default:
          return true;
      }
    }).sort((a, b) => {
      if (sortConfig.key === 'price') {
        return sortConfig.direction === 'asc' 
          ? parseFloat(a.price) - parseFloat(b.price)
          : parseFloat(b.price) - parseFloat(a.price);
      }
      
      if (sortConfig.key === 'stock_quantity') {
        return sortConfig.direction === 'asc'
          ? a.stock_quantity - b.stock_quantity
          : b.stock_quantity - a.stock_quantity;
      }

      return sortConfig.direction === 'asc'
        ? a[sortConfig.key].localeCompare(b[sortConfig.key])
        : b[sortConfig.key].localeCompare(a[sortConfig.key]);
    });
  }, [products, searchQuery, filterStatus, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (loading && !products.length) {
    return <Loading />;
  }

  if (error && !products.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Error Loading Products</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={loadProducts}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <button
            onClick={loadProducts}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, description, or barcode..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pl-10"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value={FILTER_OPTIONS.ALL}>All Products</option>
              <option value={FILTER_OPTIONS.IN_STOCK}>In Stock</option>
              <option value={FILTER_OPTIONS.LOW_STOCK}>Low Stock</option>
              <option value={FILTER_OPTIONS.OUT_OF_STOCK}>Out of Stock</option>
            </select>

            <select
              value={`${sortConfig.key}-${sortConfig.direction}`}
              onChange={(e) => {
                const [key, direction] = e.target.value.split('-');
                setSortConfig({ key, direction });
              }}
              className="rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="price-asc">Price (Low-High)</option>
              <option value="price-desc">Price (High-Low)</option>
              <option value="stock_quantity-asc">Stock (Low-High)</option>
              <option value="stock_quantity-desc">Stock (High-Low)</option>
            </select>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-500">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ProductsTable 
          products={filteredProducts} 
          onProductUpdate={loadProducts}
          onSort={handleSort}
          sortConfig={sortConfig}
        />
      </div>
    </div>
  );
} 