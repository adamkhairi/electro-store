import {
  AlertTriangle,
  Download,
  Edit,
  Eye,
  Filter,
  Grid3X3,
  List,
  MoreVertical,
  Package,
  Plus,
  Search,
  SortAsc,
  SortDesc,
  Trash2,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { formatCurrency } from '../../lib/utils';
import { productAPI } from '../../services/api';

interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  brand?: string;
  model?: string;
  costPrice: number;
  sellingPrice: number;
  status: 'active' | 'inactive' | 'discontinued';
  lowStockThreshold?: number;
  category?: {
    id: string;
    name: string;
  };
  inventory?: Array<{
    quantity: number;
    availableQuantity: number;
    location: {
      id: string;
      name: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ProductStats {
  total: number;
  active: number;
  lowStock: number;
  outOfStock: number;
}

interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination and filtering state
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // UI state
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: ProductListParams = {
        page,
        limit,
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      };

      const response = await productAPI.getProducts(params);

      if (response.data.success) {
        setProducts(response.data.data.products);
        setTotalProducts(response.data.data.pagination.total);
      } else {
        setError('Failed to fetch products');
      }
    } catch (err) {
      setError('An error occurred while fetching products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await productAPI.getProductStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching product stats:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, searchTerm, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1); // Reset to first page when searching
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const getProductImage = (product: Product) => {
    // Create a stable placeholder using product ID to avoid refreshing
    // Using a color palette based on the first character of the product name
    const colors = [
      { bg: '3b82f6', text: 'ffffff' }, // blue
      { bg: '10b981', text: 'ffffff' }, // emerald
      { bg: 'f59e0b', text: 'ffffff' }, // amber
      { bg: 'ef4444', text: 'ffffff' }, // red
      { bg: '8b5cf6', text: 'ffffff' }, // violet
      { bg: '06b6d4', text: 'ffffff' }, // cyan
      { bg: 'ec4899', text: 'ffffff' }, // pink
      { bg: '84cc16', text: 'ffffff' }, // lime
    ];

    // Use product ID hash to consistently select a color
    const colorIndex =
      product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const color = colors[colorIndex];

    // In a real app, this would be: product.imageUrl || fallbackUrl
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name.charAt(0))}&background=${color.bg}&color=${color.text}&size=60&format=svg`;
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productAPI.deleteProduct(productId);
        fetchProducts(); // Refresh the list
        fetchStats(); // Refresh stats
      } catch (err) {
        console.error('Error deleting product:', err);
        // TODO: Show error notification
      }
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

  const getStockStatus = (product: Product) => {
    if (!product.inventory || product.inventory.length === 0) {
      return { status: 'No Stock Data', variant: 'outline' as const };
    }

    const totalStock = product.inventory.reduce((sum, inv) => sum + inv.availableQuantity, 0);
    const threshold = product.lowStockThreshold || 10;

    if (totalStock === 0) {
      return { status: 'Out of Stock', variant: 'destructive' as const };
    } else if (totalStock <= threshold) {
      return { status: 'Low Stock', variant: 'secondary' as const };
    } else {
      return { status: 'In Stock', variant: 'default' as const };
    }
  };

  const totalPages = Math.ceil(totalProducts / limit);

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-96 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading products...</p>
          <p className="text-gray-500 text-sm mt-1">Please wait while we fetch your product data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-wrapper">
        <div className="page-header">
          <div className="md:flex md:items-start md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="page-title">Products</h1>
              <p className="page-description">Manage your product catalog and inventory</p>
              {stats && (
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    {stats.total} Total
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    {stats.active} Active
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    {stats.lowStock} Low Stock
                  </span>
                </div>
              )}
            </div>
            <div className="page-actions">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button onClick={() => navigate('/products/new')} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </div>
          </div>
        </div>

        <div className="content-section">
          {/* Stats overview */}
          {stats && (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Products */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Products
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Products */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Active Products
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.active}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Low Stock */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Low Stock</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.lowStock}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Out of Stock */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                        <XCircle className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Out of Stock</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.outOfStock}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search products by name, SKU, or brand..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-10 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                    <SelectTrigger className="w-[180px] border-gray-300">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="discontinued">Discontinued</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-l-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        viewMode === 'table'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 text-sm font-medium rounded-r-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        viewMode === 'grid'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sort By
                      </label>
                      <Select
                        value={sortBy}
                        onValueChange={(value: string) => {
                          setSortBy(value);
                          setPage(1);
                        }}
                      >
                        <SelectTrigger className="border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Product Name</SelectItem>
                          <SelectItem value="sku">SKU</SelectItem>
                          <SelectItem value="sellingPrice">Price</SelectItem>
                          <SelectItem value="createdAt">Date Created</SelectItem>
                          <SelectItem value="updatedAt">Last Updated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSortOrder('asc');
                            setPage(1);
                          }}
                          className={`flex-1 inline-flex justify-center items-center px-3 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                            sortOrder === 'asc'
                              ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <SortAsc className="h-4 w-4 mr-1" />
                          Ascending
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSortOrder('desc');
                            setPage(1);
                          }}
                          className={`flex-1 inline-flex justify-center items-center px-3 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                            sortOrder === 'desc'
                              ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <SortDesc className="h-4 w-4 mr-1" />
                          Descending
                        </button>
                      </div>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => setShowFilters(false)}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Hide Filters
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white shadow rounded-lg">
            {/* Bulk Actions Bar */}
            {selectedProducts.length > 0 && (
              <div className="bg-indigo-50 border-b border-indigo-200 px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-indigo-900">
                      {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''}{' '}
                      selected
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-1 border border-indigo-300 text-xs font-medium rounded text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Export Selected
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedProducts([])}
                    className="text-indigo-700 hover:text-indigo-900 text-sm font-medium"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === products.length && products.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </TableHead>
                    <TableHead className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </TableHead>
                    <TableHead className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </TableHead>
                    <TableHead className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Brand
                    </TableHead>
                    <TableHead
                      className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => handleSortChange('sellingPrice')}
                    >
                      <div className="flex items-center gap-1">
                        Price
                        {sortBy === 'sellingPrice' &&
                          (sortOrder === 'asc' ? (
                            <SortAsc className="h-3 w-3" />
                          ) : (
                            <SortDesc className="h-3 w-3" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Status
                    </TableHead>
                    <TableHead
                      className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => handleSortChange('status')}
                    >
                      <div className="flex items-center gap-1">
                        Status
                        {sortBy === 'status' &&
                          (sortOrder === 'asc' ? (
                            <SortAsc className="h-3 w-3" />
                          ) : (
                            <SortDesc className="h-3 w-3" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="p-4 bg-gray-100 rounded-full">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-lg font-medium text-gray-900">No products found</p>
                            <p className="text-gray-500 max-w-md">
                              {searchTerm || statusFilter !== 'all'
                                ? 'Try adjusting your search or filter criteria.'
                                : 'Get started by adding your first product to the catalog.'}
                            </p>
                          </div>
                          <Button onClick={() => navigate('/products/new')} className="mt-4">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Product
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map(product => {
                      const stockStatus = getStockStatus(product);
                      const totalStock =
                        product.inventory?.reduce((sum, inv) => sum + inv.availableQuantity, 0) ||
                        0;
                      const isSelected = selectedProducts.includes(product.id);

                      return (
                        <TableRow
                          key={product.id}
                          className={`${isSelected ? 'bg-indigo-50' : 'bg-white'} hover:bg-gray-50`}
                        >
                          <TableCell className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectProduct(product.id)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <img
                                  src={getProductImage(product)}
                                  alt={product.name}
                                  className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                                  onError={e => {
                                    // Fallback to a stable SVG placeholder
                                    e.currentTarget.src = `data:image/svg+xml;base64,${btoa(`
                                      <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
                                        <rect width="60" height="60" fill="#f3f4f6"/>
                                        <text x="30" y="35" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle" fill="#6b7280">${product.name.charAt(0)}</text>
                                      </svg>
                                    `)}`;
                                  }}
                                />
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-gray-900 truncate">
                                  {product.name}
                                </div>
                                {product.description && (
                                  <div className="text-sm text-gray-500 line-clamp-1 mt-1">
                                    {product.description}
                                  </div>
                                )}
                                {product.category && (
                                  <div className="text-xs text-blue-600 mt-1">
                                    {product.category.name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-gray-600">
                            {product.sku}
                          </TableCell>
                          <TableCell className="text-gray-900 font-medium">
                            {product.brand || '-'}
                          </TableCell>
                          <TableCell className="font-semibold text-gray-900">
                            {formatCurrency(product.sellingPrice)}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge
                                variant={stockStatus.variant}
                                className={
                                  stockStatus.variant === 'destructive'
                                    ? 'bg-red-100 text-red-800 hover:bg-red-100'
                                    : stockStatus.variant === 'secondary'
                                      ? 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                                      : 'bg-green-100 text-green-800 hover:bg-green-100'
                                }
                              >
                                {stockStatus.status}
                              </Badge>
                              <div className="text-xs text-gray-500">{totalStock} units</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusVariant(product.status)}
                              className={
                                product.status === 'active'
                                  ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                  : product.status === 'inactive'
                                    ? 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                                    : 'bg-red-100 text-red-800 hover:bg-red-100'
                              }
                            >
                              {product.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-gray-100"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onClick={() => navigate(`/products/${product.id}`)}
                                  className="gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => navigate(`/products/${product.id}/edit`)}
                                  className="gap-2"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit Product
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="gap-2 text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(page * limit, totalProducts)}</span> of{' '}
                    <span className="font-medium">{totalProducts}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === pageNum
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error Loading Products</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
