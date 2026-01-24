'use client';

import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FireIcon,
  LinkIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  SpeakerWaveIcon,
} from '@heroicons/react/24/outline';

// Types
interface MarqueeItem {
  id: string;
  type: 'token' | 'news' | 'custom' | 'link';
  title: string;
  subtitle?: string;
  description?: string;
  linkUrl?: string;
  linkTarget: '_self' | '_blank';
  symbol?: string;
  price?: number;
  change24h?: number;
  changePercent24h?: number;
  marketCap?: number;
  volume24h?: number;
  isHot: boolean;
  textColor?: string;
  bgColor?: string;
  icon?: string;
  iconColor?: string;
  order: number;
  isVisible: boolean;
  clicks: number;
}

interface MarqueeItemFormData {
  type: 'token' | 'news' | 'custom' | 'link';
  title: string;
  subtitle?: string;
  description?: string;
  linkUrl?: string;
  linkTarget: '_self' | '_blank';
  symbol?: string;
  price?: number;
  change24h?: number;
  changePercent24h?: number;
  marketCap?: number;
  volume24h?: number;
  isHot: boolean;
  textColor?: string;
  bgColor?: string;
  icon?: string;
  iconColor?: string;
  isVisible: boolean;
}

interface MarqueeItemEditorProps {
  marqueeId: string;
  items: MarqueeItem[];
  onItemsChange: (items: MarqueeItem[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

const defaultItemForm: MarqueeItemFormData = {
  type: 'custom',
  title: '',
  subtitle: '',
  description: '',
  linkUrl: '',
  linkTarget: '_self',
  symbol: '',
  price: undefined,
  change24h: undefined,
  changePercent24h: undefined,
  marketCap: undefined,
  volume24h: undefined,
  isHot: false,
  textColor: '',
  bgColor: '',
  icon: '',
  iconColor: '',
  isVisible: true,
};

const MarqueeItemEditor: React.FC<MarqueeItemEditorProps> = ({
  marqueeId,
  items,
  onItemsChange,
  isOpen,
  onClose,
}) => {
  const [localItems, setLocalItems] = useState<MarqueeItem[]>(items);
  const [selectedItem, setSelectedItem] = useState<MarqueeItem | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] = useState<MarqueeItemFormData>(defaultItemForm);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Update local items when props change
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  // Load items from API
  const loadItems = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/marquees/${marqueeId}/items`);
      const result = await response.json();
      
      if (result.success) {
        setLocalItems(result.data);
        onItemsChange(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to load items');
      }
    } catch (err) {
      setError('Network error loading items');
    } finally {
      setIsLoading(false);
    }
  };

  // Save item
  const saveItem = async () => {
    try {
      setIsLoading(true);
      
      const url = selectedItem 
        ? `/api/admin/marquees/${marqueeId}/items/${selectedItem.id}`
        : `/api/admin/marquees/${marqueeId}/items`;
      
      const method = selectedItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...itemForm,
          order: selectedItem ? selectedItem.order : Math.max(...localItems.map(i => i.order), 0) + 1,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess(selectedItem ? 'Item updated successfully' : 'Item created successfully');
        setShowItemForm(false);
        setSelectedItem(null);
        resetItemForm();
        loadItems();
      } else {
        setError(result.error || 'Failed to save item');
      }
    } catch (err) {
      setError('Network error saving item');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete item
  const deleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/marquees/${marqueeId}/items/${itemId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess('Item deleted successfully');
        loadItems();
      } else {
        setError(result.error || 'Failed to delete item');
      }
    } catch (err) {
      setError('Network error deleting item');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle item visibility
  const toggleVisibility = async (itemId: string) => {
    try {
      const item = localItems.find(i => i.id === itemId);
      if (!item) return;
      
      const response = await fetch(`/api/admin/marquees/${marqueeId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          isVisible: !item.isVisible,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        loadItems();
      } else {
        setError(result.error || 'Failed to toggle visibility');
      }
    } catch (err) {
      setError('Network error toggling visibility');
    }
  };

  // Update item order
  const updateItemOrder = async (itemId: string, direction: 'up' | 'down') => {
    try {
      const item = localItems.find(i => i.id === itemId);
      if (!item) return;
      
      const newOrder = direction === 'up' ? item.order - 1 : item.order + 1;
      
      const response = await fetch(`/api/admin/marquees/${marqueeId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          order: Math.max(1, newOrder),
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        loadItems();
      } else {
        setError(result.error || 'Failed to update order');
      }
    } catch (err) {
      setError('Network error updating order');
    }
  };

  // Reset item form
  const resetItemForm = () => {
    setItemForm(defaultItemForm);
  };

  // Open form for new item
  const createNewItem = () => {
    setSelectedItem(null);
    resetItemForm();
    setShowItemForm(true);
  };

  // Open form for existing item
  const editItem = (item: MarqueeItem) => {
    setSelectedItem(item);
    setItemForm({
      type: item.type,
      title: item.title,
      subtitle: item.subtitle || '',
      description: item.description || '',
      linkUrl: item.linkUrl || '',
      linkTarget: item.linkTarget,
      symbol: item.symbol || '',
      price: item.price,
      change24h: item.change24h,
      changePercent24h: item.changePercent24h,
      marketCap: item.marketCap,
      volume24h: item.volume24h,
      isHot: item.isHot,
      textColor: item.textColor || '',
      bgColor: item.bgColor || '',
      icon: item.icon || '',
      iconColor: item.iconColor || '',
      isVisible: item.isVisible,
    });
    setShowItemForm(true);
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'token': return <CurrencyDollarIcon className="w-4 h-4" />;
      case 'news': return <SpeakerWaveIcon className="w-4 h-4" />;
      case 'link': return <LinkIcon className="w-4 h-4" />;
      default: return <DocumentTextIcon className="w-4 h-4" />;
    }
  };

  // Format price
  const formatPrice = (price: number): string => {
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    if (price < 100) return `$${price.toFixed(2)}`;
    return `$${price.toLocaleString()}`;
  };

  // Clear notifications
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">Manage Marquee Items</h2>
              <p className="text-gray-600">Add and organize content for your marquee</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={createNewItem}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="w-4 h-4" />
                Add Item
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl px-2"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Notifications */}
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm">
              {success}
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Items List */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Items ({localItems.length})</h3>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-600">Loading items...</p>
              </div>
            ) : localItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DocumentTextIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No items added yet</p>
                <button
                  onClick={createNewItem}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  Add your first item
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {localItems
                  .sort((a, b) => a.order - b.order)
                  .map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                      {/* Type Icon */}
                      <div className={`p-2 rounded ${
                        item.type === 'token' ? 'bg-yellow-100 text-yellow-600' :
                        item.type === 'news' ? 'bg-red-100 text-red-600' :
                        item.type === 'link' ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {getTypeIcon(item.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{item.title}</h4>
                          {item.isHot && <FireIcon className="w-4 h-4 text-orange-500" />}
                          {!item.isVisible && <EyeSlashIcon className="w-4 h-4 text-gray-400" />}
                        </div>
                        
                        <div className="text-sm text-gray-600 mt-1">
                          {item.subtitle && <span className="mr-4">{item.subtitle}</span>}
                          {item.type === 'token' && item.price && (
                            <span className="mr-4">Price: {formatPrice(item.price)}</span>
                          )}
                          {item.type === 'token' && item.changePercent24h !== undefined && (
                            <span className={item.changePercent24h >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {item.changePercent24h >= 0 ? '+' : ''}{item.changePercent24h.toFixed(2)}%
                            </span>
                          )}
                          {item.linkUrl && (
                            <span className="text-blue-600">→ {item.linkUrl}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <span>Order: {item.order}</span>
                          <span>Clicks: {item.clicks}</span>
                          <span>Type: {item.type}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleVisibility(item.id)}
                          className={`p-2 rounded ${
                            item.isVisible ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                          }`}
                          title={item.isVisible ? 'Visible' : 'Hidden'}
                        >
                          {item.isVisible ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                        </button>
                        
                        <button
                          onClick={() => updateItemOrder(item.id, 'up')}
                          className="p-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                          title="Move Up"
                          disabled={item.order === 1}
                        >
                          <ArrowUpIcon className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => updateItemOrder(item.id, 'down')}
                          className="p-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                          title="Move Down"
                        >
                          <ArrowDownIcon className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => editItem(item)}
                          className="p-2 rounded bg-blue-100 text-blue-600 hover:bg-blue-200"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-2 rounded bg-red-100 text-red-600 hover:bg-red-200"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Item Form Modal */}
          {showItemForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">
                      {selectedItem ? 'Edit Item' : 'Add New Item'}
                    </h3>
                    <button
                      onClick={() => setShowItemForm(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); saveItem(); }} className="space-y-4">
                    {/* Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type *
                      </label>
                      <select
                        value={itemForm.type}
                        onChange={(e) => setItemForm({ ...itemForm, type: e.target.value as any })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="custom">Custom</option>
                        <option value="token">Token/Crypto</option>
                        <option value="news">News</option>
                        <option value="link">Link</option>
                      </select>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={itemForm.title}
                          onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subtitle
                        </label>
                        <input
                          type="text"
                          value={itemForm.subtitle}
                          onChange={(e) => setItemForm({ ...itemForm, subtitle: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={itemForm.description}
                        onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Link Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Link URL
                        </label>
                        <input
                          type="url"
                          value={itemForm.linkUrl}
                          onChange={(e) => setItemForm({ ...itemForm, linkUrl: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Link Target
                        </label>
                        <select
                          value={itemForm.linkTarget}
                          onChange={(e) => setItemForm({ ...itemForm, linkTarget: e.target.value as any })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="_self">Same Tab</option>
                          <option value="_blank">New Tab</option>
                        </select>
                      </div>
                    </div>

                    {/* Token-specific fields */}
                    {itemForm.type === 'token' && (
                      <div className="space-y-4 p-4 bg-yellow-50 rounded-lg">
                        <h4 className="font-semibold text-yellow-800">Token Data</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Symbol
                            </label>
                            <input
                              type="text"
                              value={itemForm.symbol}
                              onChange={(e) => setItemForm({ ...itemForm, symbol: e.target.value.toUpperCase() })}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="BTC"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Price (USD)
                            </label>
                            <input
                              type="number"
                              step="0.000001"
                              value={itemForm.price || ''}
                              onChange={(e) => setItemForm({ ...itemForm, price: e.target.value ? parseFloat(e.target.value) : undefined })}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              24h Change %
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={itemForm.changePercent24h || ''}
                              onChange={(e) => setItemForm({ ...itemForm, changePercent24h: e.target.value ? parseFloat(e.target.value) : undefined })}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Market Cap
                            </label>
                            <input
                              type="number"
                              value={itemForm.marketCap || ''}
                              onChange={(e) => setItemForm({ ...itemForm, marketCap: e.target.value ? parseFloat(e.target.value) : undefined })}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Visual Settings */}
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-800">Visual Settings</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Text Color
                          </label>
                          <input
                            type="color"
                            value={itemForm.textColor || '#ffffff'}
                            onChange={(e) => setItemForm({ ...itemForm, textColor: e.target.value })}
                            className="w-full h-10 border border-gray-300 rounded-lg"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Background Color
                          </label>
                          <input
                            type="color"
                            value={itemForm.bgColor || '#000000'}
                            onChange={(e) => setItemForm({ ...itemForm, bgColor: e.target.value })}
                            className="w-full h-10 border border-gray-300 rounded-lg"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Icon Color
                          </label>
                          <input
                            type="color"
                            value={itemForm.iconColor || '#f59e0b'}
                            onChange={(e) => setItemForm({ ...itemForm, iconColor: e.target.value })}
                            className="w-full h-10 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Custom Icon (emoji or text)
                        </label>
                        <input
                          type="text"
                          value={itemForm.icon}
                          onChange={(e) => setItemForm({ ...itemForm, icon: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="🔥 or 📈"
                        />
                      </div>
                    </div>

                    {/* Flags */}
                    <div className="flex gap-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={itemForm.isHot}
                          onChange={(e) => setItemForm({ ...itemForm, isHot: e.target.checked })}
                          className="mr-2"
                        />
                        Hot/Trending
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={itemForm.isVisible}
                          onChange={(e) => setItemForm({ ...itemForm, isVisible: e.target.checked })}
                          className="mr-2"
                        />
                        Visible
                      </label>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-4 pt-6 border-t">
                      <button
                        type="button"
                        onClick={() => setShowItemForm(false)}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isLoading ? 'Saving...' : selectedItem ? 'Update Item' : 'Add Item'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarqueeItemEditor;
