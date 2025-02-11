import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import UpdateProductModal from './UpdateProductModal';
import { deleteProduct } from '../services/api';
import toast from 'react-hot-toast';

// ============ Constants ============
const TABLE_HEADERS = [
  { key: 'image', label: 'Image', sortable: false },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'category', label: 'Category', sortable: true },
  { key: 'price', label: 'Price', sortable: true },
  { key: 'stock', label: 'Stock', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false }
];

// ============ Component ============
export default function ProductsTable({ products, onProductUpdate, onSort, sortConfig }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [deletingProductIds, setDeletingProductIds] = useState(new Set());

  const handleUpdateClick = useCallback((product) => {
    setSelectedProduct(product);
    setIsUpdateModalOpen(true);
  }, []);

  const handleUpdateSuccess = useCallback(() => {
    setIsUpdateModalOpen(false);
    setSelectedProduct(null);
    onProductUpdate();
  }, [onProductUpdate]);

  const handleDeleteClick = useCallback(async (product) => {
    if (!window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      return;
    }

    setDeletingProductIds(prev => new Set([...prev, product.id]));
    
    try {
      await deleteProduct(product.id);
      toast.success('Product deleted successfully');
      onProductUpdate();
    } catch (error) {
      toast.error(error.message || 'Failed to delete product');
    } finally {
      setDeletingProductIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }
  }, [onProductUpdate]);

  const renderSortIcon = useCallback((header) => {
    if (!header.sortable) return null;
    
    const isActive = sortConfig.key === header.key;
    const direction = isActive ? sortConfig.direction : null;

    return (
      <span className="ml-2 inline-flex flex-col">
        <svg 
          className={`w-2 h-2 ${isActive && direction === 'asc' ? 'text-indigo-600' : 'text-gray-400'}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
        <svg 
          className={`w-2 h-2 ${isActive && direction === 'desc' ? 'text-indigo-600' : 'text-gray-400'}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    );
  }, [sortConfig]);

  return (
    <>
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {TABLE_HEADERS.map(header => (
                  <th
                    key={header.key}
                    onClick={() => header.sortable && onSort(header.key)}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      header.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      {header.label}
                      {renderSortIcon(header)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-10 w-10 rounded-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/40?text=NA';
                        }}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-xs">No img</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    {product.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs" title={product.description}>
                        {product.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Rs. {parseFloat(product.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.stock_quantity > 10 ? 'bg-green-100 text-green-800' : 
                      product.stock_quantity > 0 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {product.stock_quantity} {product.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleUpdateClick(product)}
                      className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md hover:bg-indigo-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(product)}
                      disabled={deletingProductIds.has(product.id)}
                      className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      {deletingProductIds.has(product.id) ? (
                        <span className="inline-flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Deleting...
                        </span>
                      ) : (
                        'Delete'
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isUpdateModalOpen && selectedProduct && (
        <UpdateProductModal
          product={selectedProduct}
          onClose={() => setIsUpdateModalOpen(false)}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </>
  );
}

ProductsTable.propTypes = {
  products: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      category_id: PropTypes.number.isRequired,
      price: PropTypes.string.isRequired,
      stock_quantity: PropTypes.number.isRequired,
      unit: PropTypes.string,
      image_url: PropTypes.string,
    })
  ).isRequired,
  onProductUpdate: PropTypes.func.isRequired,
  onSort: PropTypes.func.isRequired,
  sortConfig: PropTypes.shape({
    key: PropTypes.string.isRequired,
    direction: PropTypes.oneOf(['asc', 'desc']).isRequired,
  }).isRequired,
}; 