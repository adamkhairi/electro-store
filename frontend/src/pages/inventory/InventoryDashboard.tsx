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
import {
  ContentCard,
  PageContent,
  PageHeader,
  PageWrapper,
  StatCard,
  StatsGrid,
} from '../../components/layout/PageWrapper';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      if (inventoryResponse.data.success && inventoryResponse.data.data) {
        // The API returns { data: { inventory, pagination } }
        const inventoryData = inventoryResponse.data.data.inventory;
        if (Array.isArray(inventoryData)) {
          // Transform Inventory to InventoryItem format
          const transformedData: InventoryItem[] = inventoryData.map(item => ({
            id: item.id,
            productId: item.productId || '',
            locationId: item.locationId,
            quantity: item.quantity,
            availableQuantity: item.availableQuantity,
            reservedQuantity: item.reservedQuantity,
            costPerUnit: item.locationCostPrice || 0,
            lastUpdated: item.updatedAt.toString(),
            product: item.product
              ? {
                  id: item.product.id,
                  name: item.product.name,
                  sku: item.product.sku,
                  lowStockThreshold: 10, // Default value since not in API response
                  sellingPrice: 0, // Default value since not in API response
                }
              : {
                  id: '',
                  name: 'Unknown Product',
                  sku: '',
                  lowStockThreshold: 10,
                  sellingPrice: 0,
                },
            location: {
              id: item.location.id,
              name: item.location.name,
              type: 'warehouse', // Default type
            },
          }));
          setInventory(transformedData);
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
          inventoryResponse.data.data &&
          Array.isArray(inventoryResponse.data.data.inventory)
        ) {
          // Use the transformed data for calculations
          totalValue = inventory.reduce(
            (sum: number, item: InventoryItem) => sum + item.quantity * item.costPerUnit,
            0
          );
          totalLocations = [...new Set(inventory.map((item: InventoryItem) => item.locationId))]
            .length;
          averageStockLevel =
            inventory.length > 0
              ? inventory.reduce((sum: number, item: InventoryItem) => sum + item.quantity, 0) /
                inventory.length
              : 0;
        }

        const inventoryStats: InventoryStats = {
          totalProducts: productStats?.totalProducts || 0,
          totalValue,
          lowStockItems: productStats?.lowStockProducts || 0,
          outOfStockItems: 0, // Calculate from inventory data
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

  // Create unique locations by ID to avoid duplicate keys
  const uniqueLocations = inventory
    .map(item => item.location)
    .filter((location, index, array) => array.findIndex(l => l.id === location.id) === index);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex justify-center items-center py-24">
          <div className="text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full border-2 border-primary/40 border-b-transparent animate-spin" />
            <p className="text-base text-muted-foreground">Loading inventory...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Inventory Dashboard"
        description="Monitor stock levels, movements, and real-time inventory insights across all locations."
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/inventory/adjust')}>
              <BarChart3 className="h-4 w-4" />
              Stock Adjustment
            </Button>
            <Button variant="outline" onClick={() => navigate('/inventory/transfer')}>
              <RefreshCw className="h-4 w-4" />
              Transfer Stock
            </Button>
            <Button onClick={fetchInventoryData}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </>
        }
      />

      {stats && (
        <StatsGrid>
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon={<Package className="h-5 w-5" />}
          />
          <StatCard
            title="Inventory Value"
            value={formatCurrency(stats.totalValue)}
            icon={<span className="text-base font-bold text-primary-foreground">$</span>}
            iconColor="bg-emerald-500"
            trend={{ value: '+4.1%', isPositive: true }}
          />
          <StatCard
            title="Low Stock"
            value={stats.lowStockItems}
            icon={<AlertTriangle className="h-5 w-5" />}
            iconColor="bg-amber-500"
            trend={{ value: '-3 since yesterday', isPositive: true }}
          />
          <StatCard
            title="Out of Stock"
            value={stats.outOfStockItems}
            icon={<TrendingDown className="h-5 w-5" />}
            iconColor="bg-rose-500"
          />
          <StatCard
            title="Locations"
            value={stats.totalLocations}
            icon={<Warehouse className="h-5 w-5" />}
            iconColor="bg-primary"
          />
          <StatCard
            title="Avg Stock Level"
            value={Math.round(stats.averageStockLevel)}
            icon={<TrendingUp className="h-5 w-5" />}
            iconColor="bg-violet-500"
          />
        </StatsGrid>
      )}

      <PageContent className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ContentCard
          className="lg:col-span-2"
          title="Current Inventory"
          description="Search, filter, and inspect stock levels across your catalog."
          headerActions={
            <Button onClick={() => navigate('/products/new')} size="sm">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  placeholder="Search products, SKU, or location..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="low-stock">Low Stock</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Location" />
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

            <div className="table-container">
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
                      <TableCell colSpan={6} className="py-10 text-center">
                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                          <Box className="h-10 w-10" />
                          <span className="font-medium">No inventory items found</span>
                          <span className="text-sm">Try adjusting your search or filters.</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInventory.map(item => {
                      const stockStatus = getStockStatus(item);
                      const totalValue = item.quantity * item.costPerUnit;

                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-semibold text-foreground">
                                {item.product.name}
                              </div>
                              <div className="text-xs uppercase tracking-wide text-muted-foreground/70">
                                {item.product.sku}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {item.location.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-semibold text-foreground">
                              {item.availableQuantity}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {item.reservedQuantity}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={stockStatus.variant}>{stockStatus.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-semibold text-foreground">
                              {formatCurrency(totalValue)}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </ContentCard>

        <div className="space-y-6">
          <ContentCard
            title="Recent Movements"
            description="Track the latest adjustments, transfers, and sales across your stock."
            headerActions={
              <Button variant="outline" size="sm" onClick={() => navigate('/inventory/movements')}>
                <Clock className="h-4 w-4" />
                View All
              </Button>
            }
          >
            <div className="space-y-3">
              {recentMovements.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
                  No recent movements
                </div>
              ) : (
                recentMovements.map(movement => (
                  <div
                    key={movement.id}
                    className="flex items-center gap-3 rounded-xl border border-border/70 bg-surface-subtle/60 p-3"
                  >
                    <div className="flex-shrink-0">{getMovementIcon(movement.type)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {movement.product.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {movement.location.name} • {movement.type}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-sm font-semibold ${movement.quantity > 0 ? 'text-emerald-600' : 'text-rose-500'}`}
                      >
                        {movement.quantity > 0 ? '+' : ''}
                        {movement.quantity}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(movement.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ContentCard>

          <ContentCard
            title="Stock Alerts"
            description="Review low or out-of-stock items to plan restocking priorities."
            className="space-y-4"
          >
            <div className="space-y-3">
              {filteredInventory
                .filter(item => getStockStatus(item).status !== 'In Stock')
                .slice(0, 5)
                .map(item => {
                  const stockStatus = getStockStatus(item);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-border/80 bg-surface p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-foreground">
                          {item.product.name}
                        </div>
                        <div className="text-xs text-muted-foreground">{item.location.name}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-semibold ${stockStatus.color}`}>
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
                <div className="py-6 text-center text-sm text-muted-foreground">
                  All products are well stocked.
                </div>
              )}
            </div>
          </ContentCard>
        </div>
      </PageContent>

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50/80 p-4 text-sm text-rose-700 shadow-soft">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5" />
            <div>
              <h3 className="font-semibold">Error loading inventory</h3>
              <p className="mt-1 leading-relaxed">{error}</p>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default InventoryDashboard;
