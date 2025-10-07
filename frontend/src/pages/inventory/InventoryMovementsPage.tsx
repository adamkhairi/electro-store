import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  Calendar,
  Download,
  Filter,
  Package,
  RefreshCw,
  Search,
  TrendingUp,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
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

interface StockMovement {
  id: string;
  productId: string;
  locationId: string;
  type: 'adjustment' | 'transfer' | 'sale' | 'purchase' | 'return' | 'damage';
  quantity: number;
  beforeQuantity: number;
  afterQuantity: number;
  reason?: string;
  reference?: string;
  createdAt: string;
  createdBy?: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  location: {
    id: string;
    name: string;
    type: string;
  };
}

interface MovementStats {
  totalMovements: number;
  totalIn: number;
  totalOut: number;
  netChange: number;
}

const InventoryMovementsPage: React.FC = () => {
  const navigate = useNavigate();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [stats, setStats] = useState<MovementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    fetchMovements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, typeFilter, locationFilter, dateFilter]);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for demonstration since we don't have the movement history endpoint yet
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
          createdBy: 'John Doe',
          product: { id: 'prod1', name: 'Wireless Bluetooth Headphones', sku: 'WBH-001' },
          location: { id: 'loc1', name: 'Main Warehouse', type: 'warehouse' },
        },
        {
          id: '2',
          productId: 'prod2',
          locationId: 'loc1',
          type: 'sale',
          quantity: -25,
          beforeQuantity: 75,
          afterQuantity: 50,
          reference: 'ORDER-12345',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          createdBy: 'System',
          product: { id: 'prod2', name: 'USB-C Fast Charger', sku: 'UFC-002' },
          location: { id: 'loc1', name: 'Main Warehouse', type: 'warehouse' },
        },
        {
          id: '3',
          productId: 'prod3',
          locationId: 'loc2',
          type: 'purchase',
          quantity: 100,
          beforeQuantity: 0,
          afterQuantity: 100,
          reference: 'PO-67890',
          reason: 'Initial stock purchase',
          createdAt: new Date(Date.now() - 14400000).toISOString(),
          createdBy: 'Jane Smith',
          product: { id: 'prod3', name: 'Smart Watch Pro', sku: 'SWP-003' },
          location: { id: 'loc2', name: 'Retail Store', type: 'store' },
        },
        {
          id: '4',
          productId: 'prod1',
          locationId: 'loc1',
          type: 'transfer',
          quantity: -20,
          beforeQuantity: 150,
          afterQuantity: 130,
          reason: 'Transfer to retail store',
          reference: 'TRANSFER-001',
          createdAt: new Date(Date.now() - 21600000).toISOString(),
          createdBy: 'Mike Johnson',
          product: { id: 'prod1', name: 'Wireless Bluetooth Headphones', sku: 'WBH-001' },
          location: { id: 'loc1', name: 'Main Warehouse', type: 'warehouse' },
        },
        {
          id: '5',
          productId: 'prod4',
          locationId: 'loc1',
          type: 'damage',
          quantity: -5,
          beforeQuantity: 50,
          afterQuantity: 45,
          reason: 'Damaged during handling',
          createdAt: new Date(Date.now() - 28800000).toISOString(),
          createdBy: 'Sarah Wilson',
          product: { id: 'prod4', name: 'Gaming Mouse RGB', sku: 'GMR-004' },
          location: { id: 'loc1', name: 'Main Warehouse', type: 'warehouse' },
        },
      ];

      // Apply filters
      let filteredMovements = mockMovements;

      if (searchTerm) {
        filteredMovements = filteredMovements.filter(
          movement =>
            movement.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            movement.product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            movement.location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (movement.reference &&
              movement.reference.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      if (typeFilter !== 'all') {
        filteredMovements = filteredMovements.filter(movement => movement.type === typeFilter);
      }

      if (locationFilter !== 'all') {
        filteredMovements = filteredMovements.filter(
          movement => movement.locationId === locationFilter
        );
      }

      if (dateFilter !== 'all') {
        const now = new Date();
        const filterDate = new Date();

        switch (dateFilter) {
          case 'today':
            filterDate.setDate(now.getDate());
            break;
          case 'week':
            filterDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            filterDate.setMonth(now.getMonth() - 1);
            break;
        }

        filteredMovements = filteredMovements.filter(
          movement => new Date(movement.createdAt) >= filterDate
        );
      }

      setMovements(filteredMovements);

      // Calculate stats
      const totalIn = filteredMovements
        .filter(m => m.quantity > 0)
        .reduce((sum, m) => sum + m.quantity, 0);

      const totalOut = Math.abs(
        filteredMovements.filter(m => m.quantity < 0).reduce((sum, m) => sum + m.quantity, 0)
      );

      setStats({
        totalMovements: filteredMovements.length,
        totalIn,
        totalOut,
        netChange: totalIn - totalOut,
      });
    } catch (err) {
      console.error('Error fetching movements:', err);
      setError('Failed to load movement data');
    } finally {
      setLoading(false);
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
      case 'return':
        return <ArrowUp className="h-4 w-4 text-orange-500" />;
      case 'damage':
        return <ArrowDown className="h-4 w-4 text-gray-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'sale':
        return 'bg-red-100 text-red-800';
      case 'purchase':
        return 'bg-green-100 text-green-800';
      case 'transfer':
        return 'bg-blue-100 text-blue-800';
      case 'adjustment':
        return 'bg-purple-100 text-purple-800';
      case 'return':
        return 'bg-orange-100 text-orange-800';
      case 'damage':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatMovementType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const uniqueLocations = [
    ...new Set(movements.map(m => ({ id: m.locationId, name: m.location.name }))),
  ];

  if (loading && movements.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center min-h-96">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto"></div>
              <p className="text-gray-600 text-base">Loading movements...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/inventory')}
                className="mt-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-semibold text-gray-900">Inventory Movements</h1>
                <p className="text-base text-gray-600 mt-2">
                  Track all stock movements and changes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  /* TODO: Export functionality */
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={fetchMovements}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 truncate">Total Movements</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {stats.totalMovements}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <ArrowUp className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 truncate">Stock In</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.totalIn}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                  <ArrowDown className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 truncate">Stock Out</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.totalOut}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center gap-4">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${stats.netChange >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                >
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 truncate">Net Change</p>
                  <p
                    className={`text-2xl font-semibold mt-1 ${stats.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {stats.netChange >= 0 ? '+' : ''}
                    {stats.netChange}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Product, SKU, reference..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Movement Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-11 border-gray-300 hover:border-gray-400 transition-colors">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                  <SelectItem value="damage">Damage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Location</label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="h-11 border-gray-300 hover:border-gray-400 transition-colors">
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

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Date Range</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-11 border-gray-300 hover:border-gray-400 transition-colors">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                  setLocationFilter('all');
                  setDateFilter('all');
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Movements Table */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-5">
            <Package className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Stock Movements</h3>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Before</TableHead>
                  <TableHead>After</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center">
                        <Package className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500">No movements found</p>
                        <p className="text-gray-400 text-sm">Try adjusting your filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map(movement => (
                    <TableRow key={movement.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{movement.product.name}</div>
                          <div className="text-sm text-gray-500">{movement.product.sku}</div>
                          {movement.reference && (
                            <div className="text-xs text-blue-600">{movement.reference}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getMovementIcon(movement.type)}
                          <Badge className={getMovementTypeColor(movement.type)}>
                            {formatMovementType(movement.type)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-700">{movement.location.name}</span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {movement.quantity > 0 ? '+' : ''}
                          {movement.quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-600">{movement.beforeQuantity}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-900">{movement.afterQuantity}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{movement.reason || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {new Date(movement.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{movement.createdBy || '-'}</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 mt-6">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-red-800">Error Loading Movements</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryMovementsPage;
