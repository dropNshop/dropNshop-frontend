import ProductForm from '../components/ProductForm';

export default function AddProductPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow px-8 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Add New Product</h1>
        <ProductForm />
      </div>
    </div>
  );
} 