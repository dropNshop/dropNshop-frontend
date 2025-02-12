import axios from 'axios';
import toast from 'react-hot-toast';

// ============ Constants ============
const API_BASE_URL = 'https://dropnshop-backend.onrender.com';
// const API_BASE_URL = 'http://localhost:3100';
const ML_API_BASE_URL = 'https://ml-flask-fri4.onrender.com';

// ============ API Instances ============
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 seconds
  headers: {
    'Content-Type': 'application/json',
  }
});

const mlApi = axios.create({
  baseURL: ML_API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  }
});

// ============ Request Interceptors ============
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// ============ Response Interceptors ============
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Response error:', error);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    }
    
    const errorMessage = error.response?.data?.message || 'An error occurred. Please try again.';
    toast.error(errorMessage);
    
    return Promise.reject(error);
  }
);

mlApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('ML API error:', error);
    const errorMessage = error.response?.data?.message || 'ML service is currently unavailable.';
    toast.error(errorMessage);
    return Promise.reject(error);
  }
);

// ============ Auth Endpoints ============
export const loginAdmin = async (credentials) => {
  try {
    const response = await api.post('/api/login', credentials);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

// ============ Report Endpoints ============
export const fetchReport = async () => {
  try {
    const response = await api.get('/api/admin/report');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch report');
  }
};

// ============ Order Endpoints ============
export const fetchOrders = async () => {
  try {
    const response = await api.get('/api/admin/orders');
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch orders');
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await api.put(`/api/orders/${orderId}/status`, { status });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update order status');
  }
};

// ============ Category Endpoints ============
export const fetchCategories = async () => {
  try {
    const response = await api.get('/api/categories');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch categories');
  }
};

export const addCategory = async (categoryData) => {
  try {
    const response = await api.post('/api/admin/categories', categoryData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to add category');
  }
};

export const updateCategory = async (id, categoryData) => {
  try {
    const response = await api.put(`/api/admin/categories/${id}`, categoryData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update category');
  }
};

export const deleteCategory = async (id) => {
  try {
    const response = await api.delete(`/api/admin/categories/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete category');
  }
};

// ============ Product Endpoints ============
export const fetchProducts = async () => {
  try {
    const response = await api.get('/api/products');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch products');
  }
};

export const fetchProductById = async (id) => {
  try {
    const response = await api.get(`/api/products/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch product');
  }
};

export const addProduct = async (productData) => {
  try {
    const response = await api.post('/api/admin/products', productData);
    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to add product');
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const response = await api.put(`/api/products/${id}`, productData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update product');
  }
};

export const deleteProduct = async (id) => {
  try {
    const response = await api.delete(`/api/products/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete product');
  }
};

// ============ ML API Endpoints ============
export const trainModel = async () => {
  try {
    const response = await mlApi.get('/api/train');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to train model');
  }
};

export const predictPrice = async (data) => {
  try {
    const response = await mlApi.post('/api/predict', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to predict price');
  }
};

export const fetchMLDashboard = async () => {
  try {
    const response = await mlApi.get('/api/dashboard');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch ML dashboard');
  }
};

export const fetchMLStats = async () => {
  try {
    const response = await mlApi.get('/api/stats');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch ML stats');
  }
};

export default api; 