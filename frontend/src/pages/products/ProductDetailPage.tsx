import { Product } from '@electrostock/types';
import {
  AlertTriangle,
  ArrowLeft,
  Barcode,
  Calendar,
  CheckCircle,
  Copy,
  Edit,
  Hash,
  Package,
  Tag,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { formatCurrency } from '../../lib/utils';
import { productAPI } from '../../services/api';

const ProductDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Check for success message from navigation state
  const successMessage = location.state?.message;

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  useEffect(() => {
    // Clear navigation state after displaying message
    if (successMessage) {
      const timer = setTimeout(() => {
        navigate(location.pathname, { replace: true, state: {} });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, navigate, location.pathname]);

  const fetchProduct = async (productId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await productAPI.getProduct(productId);

      if (response.data.success && response.data.data) {
        setProduct(response.data.data);
      } else {
        setError('Product not found');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!product) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await productAPI.deleteProduct(product.id);
        navigate('/products', {
          state: { message: 'Product deleted successfully!' },
        });
      } catch (error) {
        console.error('Error deleting product:', error);
        // TODO: Show error notification
      }
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'discontinued':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStockStatus = () => {
    // Since inventory data is not available in shared Product type,
    // we'll use a default status
    return { status: 'Stock data not available', variant: 'outline' as const, total: 0 };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 text-lg">Loading product details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="p-4 bg-red-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Product Not Found</h3>
            <p className="mt-2 text-gray-600">
              {error || 'The requested product could not be found.'}
            </p>
            <button
              onClick={() => navigate('/products')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus();
  const profitMargin = product.sellingPrice - product.costPrice;
  const profitPercentage = ((profitMargin / product.costPrice) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/products')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Products
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                <p className="text-gray-600 mt-1">
                  {product.description || 'No description available'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(`/products/${product.id}/edit`)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Product
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteProduct}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* SKU and Barcode Information */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Hash className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Identification</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU (Stock Keeping Unit)
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                    <code className="font-mono text-lg font-semibold text-gray-900 flex-1">
                      {product.sku}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(product.sku, 'SKU')}
                      className="px-2 h-8"
                    >
                      {copySuccess === 'SKU' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {copySuccess === 'SKU' && (
                    <p className="text-green-600 text-sm mt-1">SKU copied to clipboard!</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Barcode</label>
                  {product.barcode ? (
                    <div>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                        <Barcode className="h-5 w-5 text-gray-500" />
                        <code className="font-mono text-lg font-semibold text-gray-900 flex-1">
                          {product.barcode}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(product.barcode!, 'barcode')}
                          className="px-2 h-8"
                        >
                          {copySuccess === 'barcode' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {copySuccess === 'barcode' && (
                        <p className="text-green-600 text-sm mt-1">Barcode copied to clipboard!</p>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <p className="text-gray-500 text-center">No barcode assigned</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/products/${product.id}/edit`)}
                        className="w-full mt-2"
                      >
                        Add Barcode
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Product Details */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">Product Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <p className="text-gray-900 font-medium">{product.brand || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <p className="text-gray-900 font-medium">{product.model || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <p className="text-gray-900 font-medium">
                    {product.category ? (
                      <Badge variant="outline">{product.category.name}</Badge>
                    ) : (
                      'Uncategorized'
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <Badge
                    variant={getStatusVariant(product.status)}
                    className={
                      product.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : product.status === 'inactive'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                    }
                  >
                    {product.status}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Pricing Information */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 bg-amber-100 rounded flex items-center justify-center">
                  <span className="text-amber-600 text-xs font-bold">$</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Pricing</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(product.costPrice)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selling Price
                  </label>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(product.sellingPrice)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profit Margin
                  </label>
                  <p
                    className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {formatCurrency(profitMargin)}
                  </p>
                  <p className={`text-sm ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profitPercentage}% margin
                  </p>
                </div>
              </div>
            </Card>

            {/* Inventory Status */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">Inventory Status</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Current Stock Level</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={stockStatus.variant} className="bg-gray-100 text-gray-800">
                        {stockStatus.status}
                      </Badge>
                      <span className="text-lg font-semibold text-gray-900">
                        {stockStatus.total} units
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Low Stock Threshold</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {product.lowStockThreshold || 10} units
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate(`/inventory?product=${product.id}`)}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Manage Inventory
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate(`/orders/new?product=${product.id}`)}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Create Order
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate(`/products/${product.id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Product
                </Button>
              </div>
            </Card>

            {/* Metadata */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      {new Date(product.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Updated
                  </label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      {new Date(product.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded flex-1">
                      {product.id}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(product.id, 'id')}
                      className="px-2 h-8"
                    >
                      {copySuccess === 'id' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {copySuccess === 'id' && (
                    <p className="text-green-600 text-sm mt-1">ID copied to clipboard!</p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
