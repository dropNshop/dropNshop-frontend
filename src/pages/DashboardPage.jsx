import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, BarChart, Bar
} from 'recharts';
import toast from 'react-hot-toast';
// import { fetchMLDashboard, fetchMLStats, predictPrice, trainModel } from '../services/api';
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

// ============ Manual Data ============
const MANUAL_CATEGORY_SALES = [
  { name: 'Dairy', value: 380000 },
  { name: 'Fruits', value: 320000 },
  { name: 'Groceries', value: 450000 },
  { name: 'Pharmacy', value: 420000 },
  { name: 'Vegetables', value: 280000 }
];

const MANUAL_TOP_PRODUCTS = [
  { product: 'Basmati Rice (5kg)', sales: 287500, quantity: 250, price: 1150 },
  { product: 'Cooking Oil (5L)', sales: 261000, quantity: 180, price: 1450 },
  { product: 'Tea (950g)', sales: 230400, quantity: 320, price: 720 },
  { product: 'Flour (10kg)', sales: 238000, quantity: 280, price: 850 },
  { product: 'Pulses Mix (1kg)', sales: 114800, quantity: 410, price: 280 },
  { product: 'Sugar (1kg)', sales: 87000, quantity: 580, price: 150 },
  { product: 'Milk (1L)', sales: 153000, quantity: 850, price: 180 },
  { product: 'Spices Pack (200g)', sales: 67200, quantity: 420, price: 160 },
  { product: 'Eggs (dozen)', sales: 117000, quantity: 650, price: 180 },
  { product: 'Bread (large)', sales: 86400, quantity: 720, price: 120 },
  { product: 'Yogurt (1kg)', sales: 60800, quantity: 380, price: 160 },
  { product: 'Salt (1kg)', sales: 40800, quantity: 480, price: 85 },
  { product: 'Detergent (1kg)', sales: 55000, quantity: 250, price: 220 }
];

// ============ Data Processing Functions ============
const processMonthlyData = () => {
  return [
    { date: '1', sales: 1850000 },  // January
    { date: '2', sales: 1680000 },  // February
    { date: '3', sales: 1920000 },  // March
    { date: '4', sales: 1750000 },  // April
    { date: '5', sales: 2150000 },  // May
    { date: '6', sales: 1890000 },  // June
    { date: '7', sales: 2250000 },  // July (Peak season)
    { date: '8', sales: 1980000 },  // August
    { date: '9', sales: 1850000 },  // September
    { date: '10', sales: 1720000 }, // October
    { date: '11', sales: 1680000 }, // November
    { date: '12', sales: 2180000 }  // December (Holiday season)
  ];
};

const processCategorySales = () => {
  return MANUAL_CATEGORY_SALES;
};

const processTopProducts = () => {
  return MANUAL_TOP_PRODUCTS;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES.GROCERIES);
  const [forecastData, setForecastData] = useState([]);
  const [viewMode, setViewMode] = useState('6months');
  const [selectedBrand, setSelectedBrand] = useState('all');

  const fetchAllData = async () => {
    try {
      setLoading(true);
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

  // const handleTrainModel = async () => {
  //   try {
  //     const result = await trainModel();
  //     if (result.status === 'success') {
  //       toast.success('Model trained successfully!');
  //       // Refresh dashboard data after training
  //       await fetchAllData();
  //     } else {
  //       toast.error('Model training failed');
  //     }
  //   } catch (error) {
  //     toast.error('Failed to train model');
  //     console.error(error);
  //   }
  // };

  // const handlePrediction = async () => {
  //   try {
  //     const result = await predictPrice(predictionForm);
  //     setPrediction(result);
  //     toast.success('Price prediction generated successfully!');
  //   } catch (error) {
  //     toast.error('Failed to generate prediction');
  //     console.error(error);
  //   }
  // };

  if (loading) return <Loading />;

  // Transform monthly sales data for the chart
  const monthlySalesData = processMonthlyData();

  // Transform category sales for the pie chart
  const categorySalesData = processCategorySales();

  // // Get available categories and products
  // const availableCategories = MANUAL_CATEGORY_SALES.map(cat => cat.name);
  // const availableProducts = MANUAL_TOP_PRODUCTS.map(prod => prod.product);

  // Get top products data
  const topProductsData = processTopProducts();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
      {/* Dashboard Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-2 text-gray-600">Real-time insights and predictions for your business</p>
        </div>
        <button
          onClick={fetchAllData}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>
      </div>

      {/* Stats Summary Cards */}
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
                Rs. 21,900,000
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
              <p className="text-2xl font-bold text-white">360</p>
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
              <p className={`text-sm font-medium ${COLORS.success.text}`}>Average Order</p>
              <p className="text-2xl font-bold text-white">Rs. 2,283</p>
              <p className={`text-xs ${COLORS.success.textLight} mt-1`}>Per order value</p>
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
              <p className="text-2xl font-bold text-white">15.8%</p>
              <p className={`text-xs ${COLORS.purple.textLight} mt-1`}>Average monthly growth rate</p>
            </div>
          </div>
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
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Sales
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topProductsData.map(({ product, sales, quantity, price }) => (
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
                      <div className="text-sm text-gray-900">
                        {formatCurrency(price)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(sales)}
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