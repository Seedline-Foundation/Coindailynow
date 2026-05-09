'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Rocket,
  Star,
  DollarSign,
  ShoppingCart,
  BarChart3,
  ArrowUpRight,
  Copy,
  MoreVertical,
  Image as ImageIcon,
  FileText,
  Video,
  BookOpen,
  Wrench,
  GraduationCap,
  ChevronDown,
  X,
  Upload,
  CheckCircle,
  AlertCircle,
  Globe,
  Tag,
} from 'lucide-react';

// ===========================================================================
// TYPES
// ===========================================================================

type ProductType = 'course' | 'ebook' | 'template' | 'tool' | 'report' | 'digital_asset';
type ProductStatus = 'active' | 'draft' | 'paused' | 'under_review';

interface SellerProduct {
  id: string;
  name: string;
  description: string;
  type: ProductType;
  price: number;
  comparePrice?: number;
  category: string;
  status: ProductStatus;
  sales: number;
  revenue: number;
  views: number;
  rating: number;
  reviews: number;
  isBoosted: boolean;
  boostExpiry?: string;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
  isListedOnMarketplace: boolean;
  downloadCount: number;
  tags: string[];
}

// ===========================================================================
// MOCK DATA
// ===========================================================================

const mockProducts: SellerProduct[] = [
  {
    id: 'sp1', name: 'DeFi Masterclass for Africa', description: 'Complete course on DeFi strategies tailored for African markets. 12 modules with video lessons, quizzes, and practical labs.',
    type: 'course', price: 79, comparePrice: 129, category: 'Courses', status: 'active', sales: 124, revenue: 9796, views: 8420,
    rating: 4.9, reviews: 87, isBoosted: true, boostExpiry: '2026-03-15', createdAt: '2025-09-15', updatedAt: '2026-02-28',
    isListedOnMarketplace: true, downloadCount: 124, tags: ['defi', 'africa', 'course', 'beginner'],
  },
  {
    id: 'sp2', name: 'Nigeria Market Report Q1 2026', description: 'In-depth analysis of Nigerian crypto market trends, P2P volumes, regulatory updates, and institutional adoption.',
    type: 'report', price: 49.99, category: 'Reports', status: 'active', sales: 89, revenue: 4449, views: 5210,
    rating: 4.8, reviews: 42, isBoosted: false, createdAt: '2026-01-05', updatedAt: '2026-02-20',
    isListedOnMarketplace: true, downloadCount: 89, tags: ['nigeria', 'market-report', 'q1-2026'],
  },
  {
    id: 'sp3', name: 'P2P Trading Blueprint', description: 'Step-by-step ebook guide for profitable P2P trading on African exchanges. Includes arbitrage strategies.',
    type: 'ebook', price: 24.99, category: 'Digital Tools', status: 'active', sales: 67, revenue: 1674, views: 3890,
    rating: 4.6, reviews: 31, isBoosted: true, boostExpiry: '2026-03-10', createdAt: '2025-11-20', updatedAt: '2026-02-15',
    isListedOnMarketplace: true, downloadCount: 67, tags: ['p2p', 'trading', 'arbitrage'],
  },
  {
    id: 'sp4', name: 'Crypto Tax Calculator Nigeria & Ghana', description: 'Spreadsheet tool for calculating crypto taxes in Nigeria and Ghana. FIRS/GRA compliant.',
    type: 'tool', price: 9.99, category: 'Digital Tools', status: 'active', sales: 52, revenue: 519, views: 2340,
    rating: 4.5, reviews: 18, isBoosted: false, createdAt: '2025-10-01', updatedAt: '2026-01-30',
    isListedOnMarketplace: true, downloadCount: 52, tags: ['tax', 'nigeria', 'ghana', 'tool'],
  },
  {
    id: 'sp5', name: 'Portfolio Tracker Template', description: 'Notion + Google Sheets template for tracking your African crypto portfolio across exchanges.',
    type: 'template', price: 7.99, category: 'Digital Tools', status: 'active', sales: 41, revenue: 327, views: 1780,
    rating: 4.7, reviews: 11, isBoosted: true, boostExpiry: '2026-03-20', createdAt: '2025-12-10', updatedAt: '2026-02-10',
    isListedOnMarketplace: true, downloadCount: 41, tags: ['portfolio', 'tracker', 'template'],
  },
  {
    id: 'sp6', name: 'Memecoin Alpha Signal Pack', description: 'Weekly alpha signals and memecoin surge detection notifications delivered to your email.',
    type: 'digital_asset', price: 4.99, category: 'Subscriptions', status: 'paused', sales: 28, revenue: 140, views: 920,
    rating: 4.2, reviews: 8, isBoosted: false, createdAt: '2026-01-15', updatedAt: '2026-02-25',
    isListedOnMarketplace: false, downloadCount: 28, tags: ['memecoin', 'signals', 'alpha'],
  },
  {
    id: 'sp7', name: 'CBDC Impact Analysis: e-Naira vs e-Cedi', description: 'Deep research report comparing Nigeria\'s e-Naira and Ghana\'s e-Cedi CBDC implementations.',
    type: 'report', price: 34.99, category: 'Reports', status: 'draft', sales: 0, revenue: 0, views: 0,
    rating: 0, reviews: 0, isBoosted: false, createdAt: '2026-02-28', updatedAt: '2026-02-28',
    isListedOnMarketplace: false, downloadCount: 0, tags: ['cbdc', 'enaira', 'ecedi', 'research'],
  },
  {
    id: 'sp8', name: 'Staking Strategies for African Tokens', description: 'Video course explaining staking strategies for tokens popular on African exchanges.',
    type: 'course', price: 39, category: 'Courses', status: 'under_review', sales: 0, revenue: 0, views: 45,
    rating: 0, reviews: 0, isBoosted: false, createdAt: '2026-02-26', updatedAt: '2026-02-27',
    isListedOnMarketplace: false, downloadCount: 0, tags: ['staking', 'course', 'african-tokens'],
  },
];

const typeConfig: Record<ProductType, { icon: React.ReactNode; label: string; color: string }> = {
  course: { icon: <GraduationCap className="w-4 h-4" />, label: 'Course', color: 'text-blue-400 bg-blue-500/10' },
  ebook: { icon: <BookOpen className="w-4 h-4" />, label: 'Ebook', color: 'text-green-400 bg-green-500/10' },
  template: { icon: <FileText className="w-4 h-4" />, label: 'Template', color: 'text-purple-400 bg-purple-500/10' },
  tool: { icon: <Wrench className="w-4 h-4" />, label: 'Tool', color: 'text-orange-400 bg-orange-500/10' },
  report: { icon: <BarChart3 className="w-4 h-4" />, label: 'Report', color: 'text-cyan-400 bg-cyan-500/10' },
  digital_asset: { icon: <Package className="w-4 h-4" />, label: 'Digital Asset', color: 'text-pink-400 bg-pink-500/10' },
};

const statusConfig: Record<ProductStatus, { label: string; color: string; dot: string }> = {
  active: { label: 'Active', color: 'text-green-400', dot: 'bg-green-400' },
  draft: { label: 'Draft', color: 'text-gray-400', dot: 'bg-gray-400' },
  paused: { label: 'Paused', color: 'text-yellow-400', dot: 'bg-yellow-400' },
  under_review: { label: 'Under Review', color: 'text-blue-400', dot: 'bg-blue-400' },
};

const categories = ['All', 'Courses', 'Reports', 'Digital Tools', 'Subscriptions'];

// ===========================================================================
// PRODUCT FORM MODAL
// ===========================================================================

interface ProductFormProps {
  product?: SellerProduct | null;
  onClose: () => void;
  onSave: (data: any) => void;
}

function ProductFormModal({ product, onClose, onSave }: ProductFormProps) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    type: product?.type || 'course' as ProductType,
    price: product?.price?.toString() || '',
    comparePrice: product?.comparePrice?.toString() || '',
    category: product?.category || 'Courses',
    tags: product?.tags?.join(', ') || '',
    isListedOnMarketplace: product?.isListedOnMarketplace ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      onSave({
        ...form,
        price: parseFloat(form.price),
        comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : undefined,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      setSaving(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto" onClick={onClose}>
      <div className="bg-dark-900 border border-dark-700 rounded-2xl max-w-2xl w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-dark-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{isEdit ? 'Edit Product' : 'Create New Product'}</h2>
          <button onClick={onClose} className="p-2 text-dark-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Product Name *</label>
            <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g., DeFi Masterclass for Africa"
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Description *</label>
            <textarea required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4} placeholder="Describe your product..."
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>

          {/* Type & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Product Type *</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ProductType }))}
                className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm">
                <option value="course">Course</option>
                <option value="ebook">Ebook</option>
                <option value="report">Report</option>
                <option value="template">Template</option>
                <option value="tool">Tool</option>
                <option value="digital_asset">Digital Asset</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Category *</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm">
                <option value="Courses">Courses</option>
                <option value="Reports">Reports</option>
                <option value="Digital Tools">Digital Tools</option>
                <option value="Subscriptions">Subscriptions</option>
                <option value="API Access">API Access</option>
              </select>
            </div>
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Price (JOY Tokens) *</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input type="number" step="0.01" min="0" required value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Compare Price (optional)</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input type="number" step="0.01" min="0" value={form.comparePrice}
                  onChange={e => setForm(f => ({ ...f, comparePrice: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm" />
              </div>
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Product Thumbnail</label>
            <div className="border-2 border-dashed border-dark-600 rounded-xl p-8 text-center hover:border-primary-500/50 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-dark-400 mx-auto mb-2" />
              <p className="text-sm text-dark-400">Drop image or click to upload</p>
              <p className="text-xs text-dark-500 mt-1">PNG, JPG up to 5MB. Recommended: 1200x630</p>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Product Files</label>
            <div className="border-2 border-dashed border-dark-600 rounded-xl p-6 text-center hover:border-primary-500/50 transition-colors cursor-pointer">
              <Package className="w-8 h-8 text-dark-400 mx-auto mb-2" />
              <p className="text-sm text-dark-400">Upload your digital product files</p>
              <p className="text-xs text-dark-500 mt-1">PDF, ZIP, MP4, or any digital format up to 500MB</p>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Tags</label>
            <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="defi, africa, course (comma separated)"
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm" />
          </div>

          {/* Marketplace Listing */}
          <div className="bg-dark-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-primary-400" />
              <div>
                <p className="text-sm font-medium text-white">List on CoinDaily Marketplace</p>
                <p className="text-xs text-dark-400">Make this product visible to all marketplace visitors (free)</p>
              </div>
            </div>
            <button type="button" onClick={() => setForm(f => ({ ...f, isListedOnMarketplace: !f.isListedOnMarketplace }))}
              className={`w-12 h-6 rounded-full transition-colors relative ${form.isListedOnMarketplace ? 'bg-primary-500' : 'bg-dark-600'}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${form.isListedOnMarketplace ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-dark-700">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-dark-800 text-dark-300 rounded-lg font-medium text-sm hover:bg-dark-700">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 bg-primary-500 text-dark-950 rounded-lg font-bold text-sm hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><CheckCircle className="w-4 h-4" /> {isEdit ? 'Update Product' : 'Create Product'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RefreshCw(props: { className?: string }) {
  return (
    <svg className={props.className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" />
    </svg>
  );
}

// ===========================================================================
// MAIN COMPONENT
// ===========================================================================

export default function SellerProductsPage() {
  const [products, setProducts] = useState<SellerProduct[]>(mockProducts);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<SellerProduct | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = [...products];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.tags.some(t => t.includes(q)));
    }
    if (filterStatus !== 'all') result = result.filter(p => p.status === filterStatus);
    if (filterCategory !== 'All') result = result.filter(p => p.category === filterCategory);
    return result;
  }, [products, search, filterStatus, filterCategory]);

  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
  const totalSales = products.reduce((sum, p) => sum + p.sales, 0);
  const activeCount = products.filter(p => p.status === 'active').length;

  const handleSaveProduct = (data: any) => {
    if (editProduct) {
      setProducts(prev => prev.map(p => p.id === editProduct.id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p));
    } else {
      const newProduct: SellerProduct = {
        id: `sp${Date.now()}`,
        ...data,
        status: 'draft',
        sales: 0,
        revenue: 0,
        views: 0,
        rating: 0,
        reviews: 0,
        isBoosted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        downloadCount: 0,
      };
      setProducts(prev => [newProduct, ...prev]);
    }
    setShowForm(false);
    setEditProduct(null);
  };

  const toggleStatus = (id: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const next = p.status === 'active' ? 'paused' : 'active';
      return { ...p, status: next as ProductStatus };
    }));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Package className="w-7 h-7 text-primary-500" /> My Products
          </h1>
          <p className="text-dark-400 mt-1">{products.length} products · {activeCount} active · {totalSales} total sales · ${totalRevenue.toLocaleString()} revenue</p>
        </div>
        <button onClick={() => { setEditProduct(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-dark-950 font-bold rounded-lg text-sm transition-colors">
          <Plus className="w-4 h-4" /> New Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm" />
        </div>
        <div className="flex gap-1.5">
          {['all', 'active', 'draft', 'paused', 'under_review'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === s ? 'bg-primary-500 text-dark-950' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'}`}>
              {s === 'all' ? 'All' : s === 'under_review' ? 'Review' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-1.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-xs">
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(product => {
          const tc = typeConfig[product.type];
          const sc = statusConfig[product.status];
          return (
            <div key={product.id} className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden hover:border-dark-500 transition-colors group">
              {/* Thumbnail placeholder */}
              <div className="h-36 bg-gradient-to-br from-dark-800 to-dark-700 flex items-center justify-center relative">
                <div className={`p-3 rounded-full ${tc.color}`}>{tc.icon}</div>
                {product.isBoosted && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <Rocket className="w-3 h-3" /> Boosted
                  </span>
                )}
                {!product.isListedOnMarketplace && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-dark-600 text-dark-300 text-xs rounded-full flex items-center gap-1">
                    <EyeOff className="w-3 h-3" /> Unlisted
                  </span>
                )}
                <div className="absolute bottom-2 left-2 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                  <span className={`text-xs font-medium ${sc.color}`}>{sc.label}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${tc.color}`}>{tc.label}</span>
                      <span className="text-xs text-dark-400">{product.category}</span>
                    </div>
                  </div>
                  <div className="relative">
                    <button onClick={() => setActionMenu(actionMenu === product.id ? null : product.id)}
                      className="p-1.5 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {actionMenu === product.id && (
                      <div className="absolute right-0 top-8 z-20 w-40 bg-dark-800 border border-dark-600 rounded-xl shadow-xl py-1">
                        <button onClick={() => { setEditProduct(product); setShowForm(true); setActionMenu(null); }}
                          className="w-full px-3 py-2 text-left text-sm text-white hover:bg-dark-700 flex items-center gap-2">
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={() => { toggleStatus(product.id); setActionMenu(null); }}
                          className="w-full px-3 py-2 text-left text-sm text-white hover:bg-dark-700 flex items-center gap-2">
                          {product.status === 'active' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          {product.status === 'active' ? 'Pause' : 'Activate'}
                        </button>
                        <Link href="/user/marketplace/boost" onClick={() => setActionMenu(null)}
                          className="w-full px-3 py-2 text-left text-sm text-orange-400 hover:bg-dark-700 flex items-center gap-2">
                          <Rocket className="w-3.5 h-3.5" /> Boost
                        </Link>
                        <button onClick={() => { deleteProduct(product.id); setActionMenu(null); }}
                          className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-dark-700 flex items-center gap-2">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-dark-400 mt-2 line-clamp-2">{product.description}</p>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 mt-3 py-3 border-t border-dark-700">
                  <div className="text-center">
                    <p className="text-xs font-bold text-white">{product.sales}</p>
                    <p className="text-xs text-dark-500">Sales</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-green-400">${product.revenue.toLocaleString()}</p>
                    <p className="text-xs text-dark-500">Revenue</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-white">{product.views.toLocaleString()}</p>
                    <p className="text-xs text-dark-500">Views</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-yellow-400">{product.rating > 0 ? `${product.rating}★` : '—'}</p>
                    <p className="text-xs text-dark-500">Rating</p>
                  </div>
                </div>

                {/* Price & Actions */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-700">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-primary-400">{product.price} JOY</span>
                    {product.comparePrice && <span className="text-xs text-dark-500 line-through">{product.comparePrice} JOY</span>}
                  </div>
                  <button onClick={() => { setEditProduct(product); setShowForm(true); }}
                    className="px-3 py-1.5 bg-dark-800 text-dark-300 rounded-lg text-xs font-medium hover:bg-dark-700 flex items-center gap-1">
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                </div>

                {/* Tags */}
                {product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {product.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 bg-dark-800 text-dark-400 rounded text-xs">#{tag}</span>
                    ))}
                    {product.tags.length > 3 && <span className="text-xs text-dark-500">+{product.tags.length - 3}</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Add New Card */}
        <button onClick={() => { setEditProduct(null); setShowForm(true); }}
          className="border-2 border-dashed border-dark-600 rounded-xl h-64 flex flex-col items-center justify-center gap-3 hover:border-primary-500/50 transition-colors group">
          <div className="w-14 h-14 rounded-full bg-dark-800 flex items-center justify-center group-hover:bg-primary-500/10">
            <Plus className="w-7 h-7 text-dark-400 group-hover:text-primary-400" />
          </div>
          <p className="text-sm font-medium text-dark-400 group-hover:text-primary-400">Create New Product</p>
        </button>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-dark-500 mx-auto mb-3" />
          <p className="text-dark-400 font-medium">No products match your filters</p>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <ProductFormModal
          product={editProduct}
          onClose={() => { setShowForm(false); setEditProduct(null); }}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
}
