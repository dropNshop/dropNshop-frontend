import axios from 'axios';

const api = axios.create({
  baseURL: 'https://dropnshop-backend.onrender.com',
});

const mlApi = axios.create({
  baseURL: 'https://ml-flask-fri4.onrender.com',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const loginAdmin = async (credentials) => {
  const response = await api.post('/api/login', credentials);
  return response.data;
};

export const fetchReport = async () => {
  const response = await api.get('/api/admin/report');
  return response.data;
};

export const fetchOrders = async () => {
  try {
    const response = await api.get('/api/admin/orders');
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

export const fetchCategories = async () => {
  const response = await api.get('/api/categories');
  return response.data;
};

export const addProduct = async (productData) => {
  try {
    const response = await api.post('/api/admin/products', productData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};

export const fetchProducts = async () => {
  const response = await api.get('/api/products');
  return response.data;
};

export const updateProduct = async (id, productData) => {
  const response = await api.put(`/api/products/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/api/products/${id}`);
  return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
  const response = await api.put(`/api/orders/${orderId}/status`, { status });
  return response.data;
};

// ML API endpoints
export const trainModel = async () => {
  const response = await mlApi.get('/api/train');
  return response.data;
};

export const predictPrice = async (data) => {
  const response = await mlApi.post('/api/predict', data);
  return response.data;
};

export const fetchMLDashboard = async () => {
  const response = await mlApi.get('/api/dashboard');
  return response.data;
};

export const fetchMLStats = async () => {
  const response = await mlApi.get('/api/stats');
  return response.data;
};

export default api; 