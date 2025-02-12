import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { updateProduct, fetchCategories } from '../services/api';
import toast from 'react-hot-toast';
import { compressImage } from '../utils/imageUtils';

// ============ Constants ============
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
const INITIAL_FORM_ERRORS = {
  name: '',
  price: '',
  stock_quantity: '',
  category_id: ''
};

// ============ Component ============
export default function UpdateProductModal({ product, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [imagePreview, setImagePreview] = useState(product.image_url);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [formErrors, setFormErrors] = useState(INITIAL_FORM_ERRORS);
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || '',
    category_id: product.category_id,
    price: product.price,
    stock_quantity: product.stock_quantity,
    unit: product.unit || '',
    barcode: product.barcode || '',
    image_base64: ''
  });

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetchCategories();
      setCategories(response.data);
    } catch  {
      toast.error('Failed to load categories');
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const validateForm = useCallback(() => {
    const errors = { ...INITIAL_FORM_ERRORS };
    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    }

    if (!formData.category_id) {
      errors.category_id = 'Category is required';
      isValid = false;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      errors.price = 'Price must be a positive number';
      isValid = false;
    }

    const stock = parseInt(formData.stock_quantity);
    if (isNaN(stock) || stock < 0) {
      errors.stock_quantity = 'Stock must be a non-negative number';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  }, [formData]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [formErrors]);

  const handleImageChange = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Image size should be less than 10MB');
      return;
    }

    try {
      setImageProcessing(true);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      const toastId = toast.loading('Processing image...');
      const compressedBase64 = await compressImage(file);
      
      setFormData(prev => ({
        ...prev,
        image_base64: compressedBase64
      }));
      
      toast.success('Image processed successfully', { id: toastId });
    } catch (error) {
      toast.error('Error processing image', { id: 'imageProcess' });
      console.error('Image processing error:', error);
      e.target.value = '';
      setImagePreview(null);
    } finally {
      setImageProcessing(false);
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Updating product...');

    try {
      const updateData = {
        ...formData,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        category_id: parseInt(formData.category_id)
      };

      if (!formData.image_base64) {
        delete updateData.image_base64;
      }

      await updateProduct(product.id, updateData);
      toast.success('Product updated successfully', { id: toastId });
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Failed to update product', { id: toastId });
    } finally {
      setLoading(false);
    }
  }, [formData, product.id, onSuccess, validateForm]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Update Product
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        formErrors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      required
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        formErrors.category_id ? 'border-red-300' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.category_id && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.category_id}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">Rs.</span>
                        </div>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          className={`pl-12 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            formErrors.price ? 'border-red-300' : 'border-gray-300'
                          }`}
                          required
                        />
                      </div>
                      {formErrors.price && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.price}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Stock</label>
                      <input
                        type="number"
                        name="stock_quantity"
                        value={formData.stock_quantity}
                        onChange={handleInputChange}
                        min="0"
                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          formErrors.stock_quantity ? 'border-red-300' : 'border-gray-300'
                        }`}
                        required
                      />
                      {formErrors.stock_quantity && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.stock_quantity}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Unit</label>
                    <input
                      type="text"
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="e.g., pcs, kg, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Barcode</label>
                    <input
                      type="text"
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Image</label>
                    <div className="mt-1 flex items-center space-x-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={imageProcessing}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                      />
                      {imageProcessing && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      )}
                      {imagePreview && !imageProcessing && (
                        <div className="relative w-20 h-20">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-md"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/80?text=Error';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              setFormData(prev => ({ ...prev, image_base64: '' }));
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Recommended: JPEG or PNG, max 10MB. Images will be automatically compressed.
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || imageProcessing}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Updating...
                </>
              ) : (
                'Update Product'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

UpdateProductModal.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    category_id: PropTypes.number.isRequired,
    price: PropTypes.string.isRequired,
    stock_quantity: PropTypes.number.isRequired,
    unit: PropTypes.string,
    barcode: PropTypes.string,
    image_url: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
}; 