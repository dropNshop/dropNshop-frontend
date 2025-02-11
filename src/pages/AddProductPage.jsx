import { useNavigate } from 'react-router-dom';
import ProductForm from '../components/ProductForm';

// ============ Component ============
export default function AddProductPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Add New Product</h1>
          <p className="mt-1 text-sm text-gray-600">
            Fill in the details below to add a new product to your inventory.
          </p>
        </div>
        <button
          onClick={() => navigate('/products')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg 
            className="-ml-1 mr-2 h-5 w-5 text-gray-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          Back to Products
        </button>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
        <div className="px-4 py-6 sm:px-8 sm:py-8">
          <div className="max-w-3xl mx-auto">
            <ProductForm />
          </div>
        </div>
      </div>
    </div>
  );
} 