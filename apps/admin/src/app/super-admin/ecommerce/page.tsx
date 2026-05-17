'use client';

import { useState, useEffect } from 'react';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';
import { 
  ShoppingCart,
  Package,
  CreditCard,
  TrendingUp,
  DollarSign,
  Users,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Box,
  Truck,
  BarChart3,
  Tag,
  Percent,
  Gift
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  sales: number;
  status: 'active' | 'draft' | 'out-of-stock';
  image?: string;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
  };
  products: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentMethod: 'stripe' | 'mpesa' | 'paypal';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
}

interface EcommerceMetrics {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  avgOrderValue: number;
  avgOrderChange: number;
  conversionRate: number;
  conversionChange: number;
  totalProducts: number;
  activeProducts: number;
  outOfStock: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  paymentGateways: Array<{
    name: string;
    transactions: number;
    revenue: number;
    successRate: number;
  }>;
}

export default function EcommercePage() {
  const { user } = useSuperAdmin();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'analytics'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  
  const [metrics, setMetrics] = useState<EcommerceMetrics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Add Product modal state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'digital',
    stock: '',
    sku: '',
    downloadable: false,
  });
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setProductImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    loadEcommerceData();
  }, [timeRange]);

  const loadEcommerceData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/super-admin/ecommerce?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to load e-commerce data');

      const data = await response.json();
      setMetrics(data.metrics);
      setProducts(data.products);
      setOrders(data.orders);
    } catch (error) {
      console.error('Error loading e-commerce data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEcommerceData();
    setRefreshing(false);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      // Optimistically add to list
      const newProduct: Product = {
        id: `prod_${Date.now()}`,
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price) || 0,
        category: productForm.category,
        stock: parseInt(productForm.stock) || 0,
        sales: 0,
        status: 'draft',
        createdAt: new Date().toISOString().split('T')[0],
      };
      setProducts(prev => [newProduct, ...prev]);
      setShowAddProduct(false);
      setProductImagePreview(null);
      setProductForm({ name: '', description: '', price: '', category: 'digital', stock: '', sku: '', downloadable: false });
    } finally {
      setSavingProduct(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'paid':
      case 'delivered': return 'bg-green-900 text-green-300';
      case 'pending': return 'bg-yellow-900 text-yellow-300';
      case 'processing':
      case 'shipped': return 'bg-blue-900 text-blue-300';
      case 'cancelled':
      case 'failed': return 'bg-red-900 text-red-300';
      case 'refunded': return 'bg-purple-900 text-purple-300';
      case 'draft': return 'bg-gray-700 text-gray-300';
      case 'out-of-stock': return 'bg-red-900 text-red-300';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  const getPaymentIcon = (method: string) => {
    return <CreditCard className="w-4 h-4" />;
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || product.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-400">Loading e-commerce data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">E-commerce Management</h1>
            <p className="text-gray-400">Manage products, orders, and sales analytics</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowAddProduct(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        {(['overview', 'products', 'orders', 'analytics'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && metrics && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-8 h-8 text-green-500" />
                <span className={`flex items-center gap-1 text-sm ${metrics.revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  <TrendingUp className="w-4 h-4" />
                  {Math.abs(metrics.revenueChange)}%
                </span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">Total Revenue</h3>
              <p className="text-3xl font-bold text-white">${metrics.totalRevenue.toLocaleString()}</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <ShoppingCart className="w-8 h-8 text-blue-500" />
                <span className={`flex items-center gap-1 text-sm ${metrics.ordersChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  <TrendingUp className="w-4 h-4" />
                  {Math.abs(metrics.ordersChange)}%
                </span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">Total Orders</h3>
              <p className="text-3xl font-bold text-white">{metrics.totalOrders.toLocaleString()}</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="w-8 h-8 text-purple-500" />
                <span className={`flex items-center gap-1 text-sm ${metrics.avgOrderChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  <TrendingUp className="w-4 h-4" />
                  {Math.abs(metrics.avgOrderChange)}%
                </span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">Avg. Order Value</h3>
              <p className="text-3xl font-bold text-white">${metrics.avgOrderValue.toFixed(2)}</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <Percent className="w-8 h-8 text-yellow-500" />
                <span className={`flex items-center gap-1 text-sm ${metrics.conversionChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  <TrendingUp className="w-4 h-4" />
                  {Math.abs(metrics.conversionChange)}%
                </span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">Conversion Rate</h3>
              <p className="text-3xl font-bold text-white">{metrics.conversionRate.toFixed(2)}%</p>
            </div>
          </div>

          {/* Inventory & Orders Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">Inventory Status</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-300">Total Products</span>
                  </div>
                  <span className="text-white font-bold text-xl">{metrics.totalProducts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-300">Active Products</span>
                  </div>
                  <span className="text-white font-bold text-xl">{metrics.activeProducts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-gray-300">Out of Stock</span>
                  </div>
                  <span className="text-white font-bold text-xl">{metrics.outOfStock}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">Order Status</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <span className="text-gray-300">Pending Orders</span>
                  </div>
                  <span className="text-white font-bold text-xl">{metrics.pendingOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Box className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-300">Processing Orders</span>
                  </div>
                  <span className="text-white font-bold text-xl">{metrics.processingOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-green-500" />
                    <span className="text-gray-300">Shipped Orders</span>
                  </div>
                  <span className="text-white font-bold text-xl">{metrics.shippedOrders}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Top Selling Products</h2>
            <div className="space-y-3">
              {metrics.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-gray-500">#{index + 1}</span>
                    <div>
                      <p className="text-white font-medium">{product.name}</p>
                      <p className="text-sm text-gray-400">{product.sales} sales</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">${product.revenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Gateways */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Payment Gateway Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {metrics.paymentGateways.map((gateway, index) => (
                <div key={index} className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <CreditCard className="w-6 h-6 text-blue-500" />
                    <h3 className="text-white font-semibold">{gateway.name}</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Transactions</span>
                      <span className="text-white font-medium">{gateway.transactions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Revenue</span>
                      <span className="text-white font-medium">${gateway.revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Success Rate</span>
                      <span className="text-green-400 font-medium">{gateway.successRate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'active', 'draft', 'out-of-stock'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-3 rounded-lg transition-colors capitalize ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {status.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="h-48 bg-gray-700 flex items-center justify-center">
                  <Package className="w-16 h-16 text-gray-600" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-semibold">{product.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(product.status)}`}>
                      {product.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-white">${product.price}</span>
                    <span className="text-sm text-gray-400">{product.category}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-gray-400">Stock: <span className="text-white font-medium">{product.stock}</span></span>
                    <span className="text-gray-400">Sales: <span className="text-white font-medium">{product.sales}</span></span>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-3 rounded-lg transition-colors capitalize ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-semibold">Order #{order.orderNumber}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>Customer: {order.customer.name}</p>
                      <p>Email: {order.customer.email}</p>
                      <p>Date: {order.createdAt}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white mb-2">${order.total.toFixed(2)}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      {getPaymentIcon(order.paymentMethod)}
                      <span className="capitalize">{order.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-4 mb-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Products:</h4>
                  <div className="space-y-2">
                    {order.products.map((product, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">{product.name} x{product.quantity}</span>
                        <span className="text-white font-medium">${(product.price * product.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  {order.status === 'pending' && (
                    <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Process Order
                    </button>
                  )}
                  {(order.status === 'processing' || order.status === 'shipped') && (
                    <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm">
                      <Truck className="w-4 h-4" />
                      Update Shipping
                    </button>
                  )}
                  {order.paymentStatus === 'paid' && order.status !== 'refunded' && (
                    <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm">
                      <DollarSign className="w-4 h-4" />
                      Refund
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
          <BarChart3 className="w-16 h-16 mx-auto text-blue-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Advanced Analytics</h2>
          <p className="text-gray-400 mb-6">
            Detailed sales analytics, revenue trends, and customer insights coming soon.
          </p>
          <button
            onClick={() => setActiveTab('overview')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Back to Overview
          </button>
        </div>
      )}

      {/* ── Add Product Modal ── */}
      {showAddProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" />
                Add New Product
              </h2>
              <button
                onClick={() => setShowAddProduct(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-6 space-y-5">
              {/* Product Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Product Image</label>
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className="w-24 h-24 flex-shrink-0 bg-gray-700 border-2 border-dashed border-gray-600 rounded-xl overflow-hidden flex items-center justify-center">
                    {productImagePreview ? (
                      <img src={productImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-8 h-8 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition-colors">
                      <Download className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400">Click to upload image</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={handleImagePick}
                      />
                    </label>
                    <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB. Recommended: 800×800px</p>
                    {productImagePreview && (
                      <button
                        type="button"
                        onClick={() => setProductImagePreview(null)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remove image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Product Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. CoinDaily Premium Report"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Product description..."
                />
              </div>

              {/* Price + Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Price (USD) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={productForm.price}
                      onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))}
                      className="w-full pl-8 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Stock / Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.stock}
                    onChange={e => setProductForm(p => ({ ...p, stock: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. 100"
                  />
                </div>
              </div>

              {/* Category + SKU */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                  <select
                    value={productForm.category}
                    onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="digital">Digital / Download</option>
                    <option value="subscription">Subscription Plan</option>
                    <option value="report">Market Report</option>
                    <option value="course">Course / Training</option>
                    <option value="api">API Access</option>
                    <option value="merchandise">Merchandise</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">SKU</label>
                  <input
                    type="text"
                    value={productForm.sku}
                    onChange={e => setProductForm(p => ({ ...p, sku: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. RPT-2024-Q4"
                  />
                </div>
              </div>

              {/* Downloadable toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setProductForm(p => ({ ...p, downloadable: !p.downloadable }))}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                    productForm.downloadable ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${
                    productForm.downloadable ? 'translate-x-5.5' : 'translate-x-0.5'
                  }`} />
                </div>
                <span className="text-sm text-gray-300">Downloadable product (digital file delivery)</span>
              </label>

              {/* Accepted Payments note */}
              <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600 text-sm text-gray-400">
                <p className="font-medium text-gray-300 mb-1">Accepted Payments</p>
                <div className="flex gap-3">
                  <span className="px-2 py-0.5 bg-blue-900 text-blue-300 rounded text-xs">Stripe</span>
                  <span className="px-2 py-0.5 bg-green-900 text-green-300 rounded text-xs">M-Pesa</span>
                  <span className="px-2 py-0.5 bg-blue-800 text-blue-300 rounded text-xs">PayPal</span>
                  <span className="px-2 py-0.5 bg-yellow-900 text-yellow-300 rounded text-xs">Crypto</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProduct(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingProduct ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Product
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

