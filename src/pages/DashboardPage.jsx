import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, BarChart, Bar
} from 'recharts';
import toast from 'react-hot-toast';
import { fetchMLDashboard, fetchMLStats, predictPrice, trainModel } from '../services/api';
import Loading from '../components/common/Loading';

// Modern color palette with gradients
const COLORS = {
  primary: {
    gradient: 'from-indigo-500 to-indigo-600',
    bg: 'bg-indigo-800',
    text: 'text-indigo-100',
    textLight: 'text-indigo-200'
  },
  secondary: {
    gradient: 'from-cyan-500 to-cyan-600',
    bg: 'bg-cyan-800',
    text: 'text-cyan-100',
    textLight: 'text-cyan-200'
  },
  success: {
    gradient: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-800',
    text: 'text-emerald-100',
    textLight: 'text-emerald-200'
  },
  purple: {
    gradient: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-800',
    text: 'text-purple-100',
    textLight: 'text-purple-200'
  }
};

const CHART_COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

// Format number to PKR currency
const formatCurrency = (value) => {
  return `Rs. ${Number(value).toLocaleString('en-PK')}`;
};

// Forecasting Data Constants
const CATEGORIES = {
  DAIRY: 'Dairy',
  FRUITS: 'Fruits',
  GROCERIES: 'Groceries',
  PHARMACY: 'Pharmacy',
  VEGETABLES: 'Vegetables'
};

const CATEGORY_PRODUCTS = {
  [CATEGORIES.DAIRY]: [
    { name: 'Milk', unit: 'liters', brands: ['Olpers', 'Nestle MilkPak', 'Gourmet', 'Prema'] },
    { name: 'Yogurt', unit: 'kg', brands: ['Nestle Fruita Vitals', 'Gourmet', 'Adams'] },
    { name: 'Cheese', unit: 'kg', brands: ['Kraft', 'Nurpur', 'Adams'] },
    { name: 'Butter', unit: 'kg', brands: ['Blue Band', 'Nurpur', 'Olpers'] },
    { name: 'Cream', unit: 'liters', brands: ['Olpers', 'Nurpur', 'Gourmet'] }
  ],
  [CATEGORIES.FRUITS]: [
    { name: 'Apples', unit: 'kg', brands: ['Quetta', 'Swat', 'Kashmir'] },
    { name: 'Bananas', unit: 'dozen', brands: ['Sindh', 'Punjab'] },
    { name: 'Oranges', unit: 'kg', brands: ['Kinnow', 'Blood Orange', 'Valencia'] },
    { name: 'Mangoes', unit: 'kg', brands: ['Sindhri', 'Chaunsa', 'Anwar Ratol', 'Langra'] },
    { name: 'Watermelon', unit: 'kg', brands: ['Punjab', 'Sindh'] }
  ],
  [CATEGORIES.GROCERIES]: [
    { name: 'Rice (Basmati)', unit: 'kg', brands: ['Falak', 'Guard', 'Kernel'] },
    { name: 'Cooking Oil', unit: 'liters', brands: ['Dalda', 'Sufi', 'Eva', 'Habib'] },
    { name: 'Tea', unit: 'kg', brands: ['Lipton', 'Tapal', 'Vital', 'Supreme'] },
    { name: 'Sugar', unit: 'kg', brands: ['Al-Arabia', 'Nishat'] },
    { name: 'Flour (Atta)', unit: 'kg', brands: ['Sunridge', 'Bake Parlor', 'Fauji'] },
    { name: 'Pulses (Daal)', unit: 'kg', brands: ['Mitchell\'s', 'National']}
  ],
  [CATEGORIES.PHARMACY]: [
    { name: 'Pain Relievers', unit: 'packs', brands: ['Panadol', 'Brufen', 'Ponstan'] },
    { name: 'Cold Medicine', unit: 'packs', brands: ['Actifed', 'Corex', 'Tyno'] },
    { name: 'Vitamins', unit: 'bottles', brands: ['Centrum', 'GNC', 'Nutrifactor'] },
    { name: 'First Aid', unit: 'kits', brands: ['PharmEvo', 'Medi-Aid', 'SafeCare'] },
    { name: 'Sanitizers', unit: 'bottles', brands: ['Dettol', 'Safeguard', 'Lifebuoy'] }
  ],
  [CATEGORIES.VEGETABLES]: [
    { name: 'Tomatoes', unit: 'kg', brands: ['Sindh Fresh', 'Punjab Fresh'] },
    { name: 'Potatoes', unit: 'kg', brands: ['Swat', 'Hazara'] },
    { name: 'Onions', unit: 'kg', brands: ['Sindh', 'Balochistan'] },
    { name: 'Green Chilies', unit: 'kg', brands: ['Kunri', 'Sindh'] },
    { name: 'Carrots', unit: 'kg', brands: ['Punjab', 'KPK'] }
  ]
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Generate realistic seasonal demand data with brand-specific adjustments
const generateDemandData = (product, month, brand) => {
  const baselineDemand = Math.floor(Math.random() * 50) + 50;
  let seasonalMultiplier = 1;
  let brandMultiplier = 1;

  // Seasonal adjustments
  if (product.toLowerCase().includes('cold') || product.toLowerCase().includes('ice')) {
    seasonalMultiplier = [5,6,7,8].includes(month) ? 1.8 : 0.6;
  } else if (product.toLowerCase().includes('tea')) {
    seasonalMultiplier = [11,12,1,2].includes(month) ? 1.7 : 0.8;
  } else if (product.toLowerCase().includes('mango')) {
    seasonalMultiplier = [5,6,7].includes(month) ? 2 : 0.1;
  } else if (product.toLowerCase().includes('sanitizer')) {
    seasonalMultiplier = [3,4,5].includes(month) ? 1.5 : 1; // Higher in spring
  }

  // Brand popularity adjustments
  if (brand) {
    if (['Olpers', 'Nestle', 'Tapal', 'Dettol', 'Panadol'].some(b => brand.includes(b))) {
      brandMultiplier = 1.3; // Popular brands
    } else if (['Gourmet', 'Dalda', 'Lipton'].some(b => brand.includes(b))) {
      brandMultiplier = 1.2; // Well-known brands
    }
  }

  return Math.floor(baselineDemand * seasonalMultiplier * brandMultiplier);
};

export default function DashboardPage() {
  const [mlDashboard, setMLDashboard] = useState(null);
  const [mlStats, setMLStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [predictionForm, setPredictionForm] = useState({
    category: 'Meat & Poultry',
    product: 'Chicken Breast',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  const [prediction, setPrediction] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES.GROCERIES);
  const [forecastData, setForecastData] = useState([]);
  const [viewMode, setViewMode] = useState('6months'); // '6months' or 'yearly'
  const [selectedBrand, setSelectedBrand] = useState('all');

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    const generateForecastData = () => {
      const currentMonth = new Date().getMonth();
      const data = [];
      const monthCount = viewMode === '6months' ? 6 : 12;

      for (let i = 0; i < monthCount; i++) {
        const monthIndex = (currentMonth + i) % 12;
        const monthData = {
          month: MONTHS[monthIndex],
          monthIndex: monthIndex + 1
        };

        CATEGORY_PRODUCTS[selectedCategory].forEach(product => {
          if (selectedBrand === 'all') {
            // Sum up demand for all brands
            const totalDemand = product.brands.reduce((sum, brand) => {
              return sum + generateDemandData(product.name, monthIndex + 1, brand);
            }, 0);
            monthData[product.name] = totalDemand;
          } else {
            // Generate demand for specific brand
            monthData[product.name] = generateDemandData(product.name, monthIndex + 1, selectedBrand);
          }
        });

        data.push(monthData);
      }

      setForecastData(data);
    };

    generateForecastData();
  }, [selectedCategory, viewMode, selectedBrand]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [mlDashboardResponse, mlStatsResponse] = await Promise.all([
        fetchMLDashboard(),
        fetchMLStats()
      ]);
      
      setMLDashboard(mlDashboardResponse);
      setMLStats(mlStatsResponse);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        logout();
        navigate('/login');
      } else {
        toast.error('Failed to load dashboard data');
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTrainModel = async () => {
    try {
      setTraining(true);
      const result = await trainModel();
      if (result.status === 'success') {
        toast.success('Model trained successfully!');
        // Refresh dashboard data after training
        await fetchAllData();
      } else {
        toast.error('Model training failed');
      }
    } catch (error) {
      toast.error('Failed to train model');
      console.error(error);
    } finally {
      setTraining(false);
    }
  };

  const handlePrediction = async () => {
    try {
      const result = await predictPrice(predictionForm);
      setPrediction(result);
      toast.success('Price prediction generated successfully!');
    } catch (error) {
      toast.error('Failed to generate prediction');
      console.error(error);
    }
  };

  if (loading) return <Loading />;

  // Transform monthly sales data for the chart
  const monthlySalesData = mlDashboard?.data?.monthly_sales 
    ? Object.entries(mlDashboard.data.monthly_sales)
        .map(([date, value]) => ({
          date,
          sales: value
        }))
        .sort((a, b) => a.date.localeCompare(b.date)) 
    : [];

  // Transform category sales for the pie chart
  const categorySalesData = mlDashboard?.data?.category_sales
    ? Object.entries(mlDashboard.data.category_sales)
        .map(([category, sales]) => ({
          name: category,
          value: sales
        }))
    : [];

  // Get available categories and products
  const availableCategories = mlDashboard?.data?.category_sales 
    ? Object.keys(mlDashboard.data.category_sales) 
    : [];

  const availableProducts = mlDashboard?.data?.top_products?.sales
    ? Object.keys(mlDashboard.data.top_products.sales)
    : [];

  // Get top products data
  const topProductsData = mlDashboard?.data?.top_products?.sales
    ? Object.entries(mlDashboard.data.top_products.sales)
        .map(([product, sales]) => ({
          product,
          sales,
          quantity: mlDashboard.data.top_products.quantity[product] || 0
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 10)
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
      {/* Dashboard Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-2 text-gray-600">Real-time insights and predictions for your business</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchAllData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
          <button
            onClick={handleTrainModel}
            disabled={training}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {training ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Training Model...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Train Model
              </>
            )}
          </button>
        </div>
      </div>

      {/* ML Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className={`bg-gradient-to-br ${COLORS.primary.gradient} rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-200`}>
          <div className="flex items-center">
            <div className={`p-3 ${COLORS.primary.bg} bg-opacity-30 rounded-full`}>
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${COLORS.primary.text}`}>Total Sales</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(mlStats?.total_sales || 0)}
              </p>
              <p className={`text-xs ${COLORS.primary.textLight} mt-1`}>All time sales value</p>
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br ${COLORS.secondary.gradient} rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-200`}>
          <div className="flex items-center">
            <div className={`p-3 ${COLORS.secondary.bg} bg-opacity-30 rounded-full`}>
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${COLORS.secondary.text}`}>Total Products</p>
              <p className="text-2xl font-bold text-white">{mlStats?.total_products || '0'}</p>
              <p className={`text-xs ${COLORS.secondary.textLight} mt-1`}>Active products in catalog</p>
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br ${COLORS.success.gradient} rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-200`}>
          <div className="flex items-center">
            <div className={`p-3 ${COLORS.success.bg} bg-opacity-30 rounded-full`}>
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${COLORS.success.text}`}>Avg Price</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(mlStats?.avg_price || 0)}</p>
              <p className={`text-xs ${COLORS.success.textLight} mt-1`}>Average product price</p>
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br ${COLORS.purple.gradient} rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-200`}>
          <div className="flex items-center">
            <div className={`p-3 ${COLORS.purple.bg} bg-opacity-30 rounded-full`}>
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${COLORS.purple.text}`}>Monthly Growth</p>
              <p className="text-2xl font-bold text-white">
                {(mlDashboard?.data?.growth_metrics?.average_monthly_growth || 0).toFixed(2)}%
              </p>
              <p className={`text-xs ${COLORS.purple.textLight} mt-1`}>Average monthly growth rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Price Prediction Tool */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 transform hover:shadow-xl transition-shadow duration-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Price Prediction Tool</h2>
            <p className="text-sm text-gray-600 mt-1">Predict future prices based on historical data</p>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ML-powered predictions
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={predictionForm.category}
              onChange={(e) => setPredictionForm(prev => ({ ...prev, category: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {availableCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Product</label>
            <select
              value={predictionForm.product}
              onChange={(e) => setPredictionForm(prev => ({ ...prev, product: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {availableProducts.map(product => (
                <option key={product} value={product}>{product}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Month</label>
            <input
              type="number"
              min="1"
              max="12"
              value={predictionForm.month}
              onChange={(e) => setPredictionForm(prev => ({ ...prev, month: parseInt(e.target.value) }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Year</label>
            <input
              type="number"
              min="2024"
              max="2025"
              value={predictionForm.year}
              onChange={(e) => setPredictionForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={handlePrediction}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200"
          >
            Generate Prediction
          </button>
          {prediction && (
            <div className="text-lg">
              <span className="text-gray-600">Predicted Price:</span>
              <span className="ml-2 font-semibold text-blue-600">{formatCurrency(prediction.predicted_price)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Demand Forecasting Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 transform hover:shadow-xl transition-shadow duration-200">
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Demand Forecasting</h2>
            <p className="text-sm text-gray-600 mt-1">Product demand predictions by category and brand</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="6months">Next 6 Months</option>
              <option value="yearly">Full Year</option>
            </select>
            
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedBrand('all');
              }}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {Object.values(CATEGORIES).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Brands</option>
              {CATEGORY_PRODUCTS[selectedCategory].flatMap(product => 
                product.brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))
              ).filter((brand, index, self) => 
                self.findIndex(b => b.props.value === brand.props.value) === index
              )}
            </select>
          </div>
        </div>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: '#4B5563', fontSize: 12 }}
              />
              <YAxis 
                tick={{ fill: '#4B5563' }}
                label={{ value: 'Predicted Demand (Units)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value, name) => [
                  `${value} ${CATEGORY_PRODUCTS[selectedCategory].find(p => p.name === name)?.unit || 'units'}`,
                  name
                ]}
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              {CATEGORY_PRODUCTS[selectedCategory].map((product, index) => (
                <Bar 
                  key={product.name}
                  dataKey={product.name}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  stackId="stack"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Product-wise Forecast Table */}
        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brands
                </th>
                {forecastData.map(data => (
                  <th key={data.month} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {data.month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {CATEGORY_PRODUCTS[selectedCategory].map(product => (
                <tr key={product.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.brands.join(', ')}
                  </td>
                  {forecastData.map(data => (
                    <td key={`${data.month}-${product.name}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {data[product.name]} {product.unit}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Sales Trend */}
        <div className="bg-white rounded-xl shadow-lg p-6 transform hover:shadow-xl transition-shadow duration-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Monthly Sales Trend</h2>
              <p className="text-sm text-gray-600 mt-1">Historical sales performance</p>
            </div>
            <button onClick={fetchAllData} className="text-blue-600 hover:text-blue-800">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70}
                  tick={{ fill: '#4B5563', fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: '#4B5563' }}
                  tickFormatter={(value) => `Rs. ${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Sales']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#4F46E5" 
                  name="Monthly Sales"
                  strokeWidth={2}
                  dot={{ fill: '#4F46E5', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#4F46E5' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6 transform hover:shadow-xl transition-shadow duration-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Category Distribution</h2>
              <p className="text-sm text-gray-600 mt-1">Sales distribution by category</p>
            </div>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorySalesData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  fill="#8884d8"
                  label={({name, percent}) => 
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {categorySalesData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Performance Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden transform hover:shadow-xl transition-shadow duration-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Top Products Performance</h2>
                <p className="text-sm text-gray-600 mt-1">Best performing products by sales</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Top {topProductsData.length}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Sales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Price
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topProductsData.map(({ product, sales, quantity }) => (
                  <tr key={product} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {product.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{quantity.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">units</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(sales)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(sales / quantity)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 