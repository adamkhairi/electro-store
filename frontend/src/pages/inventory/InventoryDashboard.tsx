import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Box,
  Clock,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  Warehouse,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
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
import { inventoryAPI, productAPI } from '../../services/api';

interface InventoryItem {
  id: string;
  productId: string;
  locationId: string;
  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  costPerUnit: number;
  lastUpdated: string;
  product: {
    id: string;
    name: string;
    sku: string;
    lowStockThreshold: number;
    sellingPrice: number;
  };
  location: {
    id: string;
    name: string;
    type: string;
  };
}

interface InventoryStats {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalLocations: number;
  averageStockLevel: number;
}

interface StockMovement {
  id: string;
  productId: string;
  locationId: string;
  type: 'adjustment' | 'transfer' | 'sale' | 'purchase' | 'return' | 'damage';
  quantity: number;
  beforeQuantity: number;
  afterQuantity: number;
  reason?: string;
  createdAt: string;
  product: {
    name: string;
    sku: string;
  };
  location: {
    name: string;
  };
}

const InventoryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtering and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [inventoryResponse, statsResponse] = await Promise.all([
        inventoryAPI.getInventory(),
        // We'll need to add this endpoint to get aggregated stats
        productAPI.getProductStats(),
      ]);

      if (inventoryResponse.data.success) {
        // The API returns { data: { inventory, pagination } }
        const inventoryData = inventoryResponse.data.data.inventory;
        if (Array.isArray(inventoryData)) {
          setInventory(inventoryData);
        } else {
          console.warn('Unexpected inventory data structure:', inventoryData);
          setInventory([]);
        }
      }

      if (statsResponse.data.success) {
        // Transform product stats to inventory stats
        const productStats = statsResponse.data.data;

        // Use the freshly fetched inventory data for calculations
        let totalValue = 0;
        let totalLocations = 0;
        let averageStockLevel = 0;

        if (
          inventoryResponse.data.success &&
          Array.isArray(inventoryResponse.data.data.inventory)
        ) {
          const freshInventory: InventoryItem[] = inventoryResponse.data.data.inventory;
          totalValue = freshInventory.reduce(
            (sum: number, item: InventoryItem) => sum + item.quantity * item.costPerUnit,
            0
          );
          totalLocations = [
            ...new Set(freshInventory.map((item: InventoryItem) => item.locationId)),
          ].length;
          averageStockLevel =
            freshInventory.length > 0
              ? freshInventory.reduce(
                  (sum: number, item: InventoryItem) => sum + item.quantity,
                  0
                ) / freshInventory.length
              : 0;
        }

        const inventoryStats: InventoryStats = {
          totalProducts: productStats.total || 0,
          totalValue,
          lowStockItems: productStats.lowStock || 0,
          outOfStockItems: productStats.outOfStock || 0,
          totalLocations,
          averageStockLevel,
        };
        setStats(inventoryStats);
      }

      // Mock recent movements for demonstration
      const mockMovements: StockMovement[] = [
        {
          id: '1',
          productId: 'prod1',
          locationId: 'loc1',
          type: 'adjustment',
          quantity: 50,
          beforeQuantity: 100,
          afterQuantity: 150,
          reason: 'Stock count adjustment',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          product: { name: 'Sample Product', sku: 'SKU001' },
          location: { name: 'Main Warehouse' },
        },
        {
          id: '2',
          productId: 'prod2',
          locationId: 'loc1',
          type: 'sale',
          quantity: -25,
          beforeQuantity: 75,
          afterQuantity: 50,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          product: { name: 'Another Product', sku: 'SKU002' },
          location: { name: 'Main Warehouse' },
        },
      ];
      setRecentMovements(mockMovements);
    } catch (err) {
      console.error('Error fetching inventory data:', err);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.availableQuantity === 0) {
      return { status: 'Out of Stock', variant: 'destructive' as const, color: 'text-red-600' };
    } else if (item.availableQuantity <= item.product.lowStockThreshold) {
      return { status: 'Low Stock', variant: 'secondary' as const, color: 'text-amber-600' };
    } else {
      return { status: 'In Stock', variant: 'default' as const, color: 'text-green-600' };
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      case 'purchase':
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'transfer':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'adjustment':
        return <BarChart3 className="h-4 w-4 text-purple-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch =
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.name.toLowerCase().includes(searchTerm.toLowerCase());

    const stockStatus = getStockStatus(item);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'low-stock' && stockStatus.status === 'Low Stock') ||
      (statusFilter === 'out-of-stock' && stockStatus.status === 'Out of Stock') ||
      (statusFilter === 'in-stock' && stockStatus.status === 'In Stock');

    const matchesLocation = locationFilter === 'all' || item.locationId === locationFilter;

    return matchesSearch && matchesStatus && matchesLocation;
  });

  const uniqueLocations = [...new Set(inventory.map(item => item.location))];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Inventory Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Monitor stock levels, movements, and get real-time inventory insights
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
          <Button
            variant="outline"
            onClick={() => navigate('/inventory/adjust')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Stock Adjustment
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/inventory/transfer')}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Transfer Stock
          </Button>
          <Button onClick={fetchInventoryData} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalProducts}</dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-xs font-bold">$</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Value</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(stats.totalValue)}
                  </dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-amber-500 rounded-md flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Low Stock</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.lowStockItems}</dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Out of Stock</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.outOfStockItems}</dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <Warehouse className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Locations</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalLocations}</dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Stock</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Math.round(stats.averageStockLevel)}
                  </dd>
                </dl>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Inventory Table */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Current Inventory</h3>
              <Button
                onClick={() => navigate('/products/new')}
                className="flex items-center gap-2"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </div>

            {/* Filters */}
            <div className="mb-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search products, SKU, or location..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="in-stock">In Stock</SelectItem>
                      <SelectItem value="low-stock">Low Stock</SelectItem>
                      <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {uniqueLocations.map(location => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Reserved</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center">
                          <Box className="h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-gray-500">No inventory items found</p>
                          <p className="text-gray-400 text-sm">
                            Try adjusting your search or filters
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInventory.map(item => {
                      const stockStatus = getStockStatus(item);
                      const totalValue = item.quantity * item.costPerUnit;

                      return (
                        <TableRow key={item.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900">{item.product.name}</div>
                              <div className="text-sm text-gray-500">{item.product.sku}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{item.location.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`font-semibold ${stockStatus.color}`}>
                              {item.availableQuantity}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-gray-600">{item.reservedQuantity}</span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={stockStatus.variant}
                              className={
                                stockStatus.variant === 'destructive'
                                  ? 'bg-red-100 text-red-800'
                                  : stockStatus.variant === 'secondary'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-green-100 text-green-800'
                              }
                            >
                              {stockStatus.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{formatCurrency(totalValue)}</span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Recent Movements */}
        <div>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Movements</h3>
              <Button variant="outline" size="sm" onClick={() => navigate('/inventory/movements')}>
                <Clock className="h-4 w-4 mr-1" />
                View All
              </Button>
            </div>

            <div className="space-y-3">
              {recentMovements.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No recent movements</p>
                </div>
              ) : (
                recentMovements.map(movement => (
                  <div
                    key={movement.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-shrink-0">{getMovementIcon(movement.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm truncate">
                        {movement.product.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {movement.location.name} • {movement.type}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-sm font-medium ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {movement.quantity > 0 ? '+' : ''}
                        {movement.quantity}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(movement.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Low Stock Alerts */}
          <Card className="p-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-gray-900">Stock Alerts</h3>
            </div>

            <div className="space-y-2">
              {filteredInventory
                .filter(item => getStockStatus(item).status !== 'In Stock')
                .slice(0, 5)
                .map(item => {
                  const stockStatus = getStockStatus(item);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 border border-gray-200 rounded"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 text-sm truncate">
                          {item.product.name}
                        </div>
                        <div className="text-xs text-gray-500">{item.location.name}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${stockStatus.color}`}>
                          {item.availableQuantity} left
                        </div>
                        <Badge variant={stockStatus.variant} className="text-xs">
                          {stockStatus.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              {filteredInventory.filter(item => getStockStatus(item).status !== 'In Stock')
                .length === 0 && (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No stock alerts</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Inventory</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryDashboard;
