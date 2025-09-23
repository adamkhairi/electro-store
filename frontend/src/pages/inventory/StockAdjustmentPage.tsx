import { ArrowLeft, BarChart3, Check, Loader2, Package, Save } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { inventoryAPI } from '../../services/api';

interface Product {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  location: string;
  locationId: string;
}

interface StockAdjustment {
  productId: string;
  locationId: string;
  currentQuantity: number;
  newQuantity: number;
  adjustment: number;
  reason: string;
}

interface Location {
  id: string;
  name: string;
  type: string;
}

const StockAdjustmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch inventory data with product and location details
      const inventoryResponse = await inventoryAPI.getInventory();

      if (inventoryResponse.data.success) {
        // The API returns { data: { inventory, pagination } }
        const inventoryArray = inventoryResponse.data.data.inventory;
        if (Array.isArray(inventoryArray)) {
          // Transform inventory data to products with current stock
          const productList: Product[] = inventoryArray.map(
            (item: {
              productId: string;
              product: { name: string; sku: string };
              availableQuantity: number;
              location: { name: string };
              locationId: string;
            }) => ({
              id: item.productId,
              name: item.product.name,
              sku: item.product.sku,
              currentStock: item.availableQuantity,
              location: item.location.name,
              locationId: item.locationId,
            })
          );

          setProducts(productList);

          // Extract unique locations
          const uniqueLocations: Location[] = inventoryArray.reduce(
            (acc: Location[], item: { location: { id: string; name: string; type?: string } }) => {
              const exists = acc.find(loc => loc.id === item.location.id);
              if (!exists) {
                acc.push({
                  id: item.location.id,
                  name: item.location.name,
                  type: item.location.type || 'warehouse',
                });
              }
              return acc;
            },
            []
          );

          setLocations(uniqueLocations);
        } else {
          console.warn('Unexpected inventory data structure:', inventoryArray);
          setProducts([]);
          setLocations([]);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (productId: string, locationId: string, newQuantity: string) => {
    const quantity = parseInt(newQuantity) || 0;
    const product = products.find(p => p.id === productId && p.locationId === locationId);

    if (!product) return;

    const adjustment = quantity - product.currentStock;

    setAdjustments(prev => {
      const existing = prev.findIndex(
        a => a.productId === productId && a.locationId === locationId
      );
      const newAdjustment: StockAdjustment = {
        productId,
        locationId,
        currentQuantity: product.currentStock,
        newQuantity: quantity,
        adjustment,
        reason: '',
      };

      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newAdjustment;
        return updated;
      } else if (adjustment !== 0) {
        return [...prev, newAdjustment];
      }
      return prev;
    });
  };

  const handleReasonChange = (productId: string, locationId: string, reason: string) => {
    setAdjustments(prev =>
      prev.map(adj =>
        adj.productId === productId && adj.locationId === locationId ? { ...adj, reason } : adj
      )
    );
  };

  const removeAdjustment = (productId: string, locationId: string) => {
    setAdjustments(prev =>
      prev.filter(adj => !(adj.productId === productId && adj.locationId === locationId))
    );
  };

  const submitAdjustments = async () => {
    if (adjustments.length === 0) {
      setError('No adjustments to submit');
      return;
    }

    // Validate that all adjustments have reasons
    const missingReasons = adjustments.filter(adj => !adj.reason.trim());
    if (missingReasons.length > 0) {
      setError('Please provide a reason for all adjustments');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Submit each adjustment
      for (const adjustment of adjustments) {
        await inventoryAPI.adjustStock({
          productId: adjustment.productId,
          locationId: adjustment.locationId,
          quantity: adjustment.adjustment,
          reason: adjustment.reason,
          type: 'adjustment',
        });
      }

      setSuccess(`Successfully adjusted stock for ${adjustments.length} product(s)`);
      setAdjustments([]);

      // Refresh data
      await fetchData();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error submitting adjustments:', err);
      setError('Failed to submit stock adjustments');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesLocation = selectedLocation === 'all' || product.locationId === selectedLocation;
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesLocation && matchesSearch;
  });

  const hasAdjustments = adjustments.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 text-lg">Loading inventory...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/inventory')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Inventory
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Stock Adjustment</h1>
                <p className="text-gray-600 mt-1">
                  Adjust inventory quantities for accurate stock tracking
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasAdjustments && (
                <Button
                  onClick={submitAdjustments}
                  disabled={submitting}
                  className="flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Submit Adjustments ({adjustments.length})
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <Check className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Pending Adjustments */}
        {hasAdjustments && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Pending Adjustments</h3>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {adjustments.length}
              </span>
            </div>

            <div className="space-y-3">
              {adjustments.map(adjustment => {
                const product = products.find(
                  p => p.id === adjustment.productId && p.locationId === adjustment.locationId
                );
                return (
                  <div
                    key={`${adjustment.productId}-${adjustment.locationId}`}
                    className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{product?.name}</div>
                      <div className="text-sm text-gray-600">
                        {product?.sku} • {product?.location}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Current</div>
                      <div className="font-semibold">{adjustment.currentQuantity}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">New</div>
                      <div className="font-semibold">{adjustment.newQuantity}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Change</div>
                      <div
                        className={`font-semibold ${adjustment.adjustment > 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {adjustment.adjustment > 0 ? '+' : ''}
                        {adjustment.adjustment}
                      </div>
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="Reason for adjustment"
                        value={adjustment.reason}
                        onChange={e =>
                          handleReasonChange(
                            adjustment.productId,
                            adjustment.locationId,
                            e.target.value
                          )
                        }
                        className="text-sm"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeAdjustment(adjustment.productId, adjustment.locationId)}
                    >
                      Remove
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Products Table */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Current Inventory</h3>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>New Quantity</TableHead>
                  <TableHead>Adjustment</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center">
                        <Package className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500">No products found</p>
                        <p className="text-gray-400 text-sm">
                          Try adjusting your search or location filter
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map(product => {
                    const adjustment = adjustments.find(
                      a => a.productId === product.id && a.locationId === product.locationId
                    );
                    const newQuantity = adjustment?.newQuantity ?? product.currentStock;
                    const adjustmentAmount = newQuantity - product.currentStock;

                    return (
                      <TableRow
                        key={`${product.id}-${product.locationId}`}
                        className="hover:bg-gray-50"
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.sku}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-700">{product.location}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-gray-900">
                            {product.currentStock}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={newQuantity}
                            onChange={e =>
                              handleQuantityChange(product.id, product.locationId, e.target.value)
                            }
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          {adjustmentAmount !== 0 && (
                            <span
                              className={`font-semibold ${adjustmentAmount > 0 ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {adjustmentAmount > 0 ? '+' : ''}
                              {adjustmentAmount}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {adjustment && (
                            <Input
                              placeholder="Enter reason"
                              value={adjustment.reason}
                              onChange={e =>
                                handleReasonChange(product.id, product.locationId, e.target.value)
                              }
                              className="w-48"
                            />
                          )}
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
    </div>
  );
};

export default StockAdjustmentPage;
