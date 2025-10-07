import type { DashboardStats, Product } from '@electrostock/types';
import { useEffect, useMemo, useState } from 'react';
import BarcodeScanner from '../../components/barcode/BarcodeScanner';
import {
  ContentCard,
  PageContent,
  PageHeader,
  PageWrapper,
  StatCard,
  StatsGrid,
} from '../../components/layout/PageWrapper';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
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
import { locationAPI, productAPI, salesAPI } from '../../services/api';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { PosPayment } from '../../store/slices/posSlice';
import {
  addItem,
  addPayment,
  clearCart,
  clearPayments,
  removeItem,
  removePayment,
  setCustomer,
  setDiscountAmount,
  setLocation,
  setNotes,
  setTaxAmount,
  updateItem,
} from '../../store/slices/posSlice';

function extractErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { error?: { message?: string } } } } | undefined;
  return e?.response?.data?.error?.message ?? fallback;
}

export default function PosPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardStats | null>(null);
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([]);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);

  const dispatch = useAppDispatch();
  const pos = useAppSelector(state => state.pos);

  const subtotal = useMemo(
    () => pos.items.reduce((sum, i) => sum + i.quantity * i.unitPrice - (i.discountAmount || 0), 0),
    [pos.items]
  );
  const total = useMemo(() => subtotal - pos.discountAmount + pos.taxAmount, [subtotal, pos]);
  const totalPayments = useMemo(
    () => pos.payments.reduce((s, p) => s + p.amount, 0),
    [pos.payments]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await salesAPI.getDashboardSummary();
        if (mounted && res.data.data) {
          setData(res.data.data);
        }
      } catch (err: unknown) {
        setError(extractErrorMessage(err, 'Failed to load POS summary'));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // Load locations for selector
    (async () => {
      try {
        const res = await locationAPI.getLocations({});
        if (res.data.success && res.data.data) {
          const list = res.data.data.slice(0, 100).map(location => ({
            // Limit client-side
            id: location.id,
            name: location.name,
          }));
          setLocations(list);
          // If no selection yet, default to first
          if (!pos.locationId && list.length > 0) {
            dispatch(setLocation(list[0].id));
          }
        }
      } catch {
        // Non-fatal
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async () => {
    if (!search) return;
    setSearching(true);
    try {
      const res = await productAPI.getProducts({ search, limit: 10 });
      if (res.data.success && res.data.data) {
        setSearchResults((res.data.data.products || []) as Product[]);
      } else {
        setSearchResults([]);
      }
    } catch {
      // ignore for now
    } finally {
      setSearching(false);
    }
  };

  const handleScan = async (barcode: string) => {
    setScannerOpen(false);
    setSearching(true);
    try {
      const res = await productAPI.getProducts({ barcode, limit: 5 });
      if (res.data.success && res.data.data) {
        const results = (res.data.data.products || []) as Product[];
        setSearchResults(results);
        if (results.length === 1) {
          const p = results[0];
          dispatch(
            addItem({
              productId: p.id,
              name: p.name,
              sku: p.sku,
              quantity: 1,
              unitPrice: Number(p.sellingPrice ?? 0),
            })
          );
        }
      } else {
        setSearchResults([]);
      }
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Point of Sale"
        description="Process sales and manage transactions"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh
            </Button>
            <Button
              variant="default"
              onClick={() => {
                /* later: open full-screen checkout */
              }}
            >
              New Sale
            </Button>
          </div>
        }
      />

      <PageContent>
        {loading && <div className="text-gray-600 text-sm">Loading summary...</div>}
        {error && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <StatsGrid>
            <StatCard
              title="Today's Sales"
              value={`$${data.totalRevenue.toFixed(2)}`}
              icon={<span className="text-white text-lg font-bold">$</span>}
              iconColor="bg-green-500"
            />
            <StatCard
              title="Transactions"
              value={data.totalOrders.toString()}
              icon={<span className="text-white text-lg font-bold">#</span>}
              iconColor="bg-blue-500"
            />
            <StatCard
              title="Payment Methods"
              value={data.totalCustomers.toString()}
              icon={<span className="text-white text-lg font-bold">💳</span>}
              iconColor="bg-purple-500"
            />
          </StatsGrid>
        )}

        {!loading && !error && data && (
          <ContentCard title="Recent Sales">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <div className="text-center text-sm text-gray-500">No sales yet today.</div>
                      </TableCell>
                    </TableRow>
                  )}
                  {data.recentOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{order.customerName || 'Walk-in'}</TableCell>
                      <TableCell className="capitalize">completed</TableCell>
                      <TableCell>${order.total.toFixed(2)}</TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleTimeString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ContentCard>
        )}

        {/* Checkout Interface - Flat Design */}
        <Card className="border-2 border-gray-200">
          <CardContent>
            <div className="py-6 space-y-6">
              {/* Location & Customer - Clean Layout */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h3 className="text-base font-semibold text-gray-900">Transaction Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <Select
                      value={pos.locationId ?? undefined}
                      onValueChange={val => dispatch(setLocation(val))}
                    >
                      <SelectTrigger className="w-full h-11">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map(loc => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer (optional)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Customer name"
                        value={pos.customerName ?? ''}
                        onChange={e => dispatch(setCustomer({ customerName: e.target.value }))}
                        className="h-11"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 shrink-0"
                        onClick={() =>
                          dispatch(
                            setCustomer({
                              customerId: null,
                              customerEmail: null,
                              customerPhone: null,
                              customerName: '',
                            })
                          )
                        }
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Search - Enhanced Flat Design */}
              <div className="bg-white rounded-lg border-2 border-gray-200 p-4 space-y-3">
                <h3 className="text-base font-semibold text-gray-900">Add Products</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by name, SKU, or barcode..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSearch();
                    }}
                    className="h-12 text-base touch-manipulation"
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={searching}
                    size="lg"
                    className="px-6 min-w-[100px] touch-manipulation"
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setScannerOpen(true)}
                    className="px-6 min-w-[100px] touch-manipulation"
                  >
                    📷 Scan
                  </Button>
                </div>
              </div>

              {/* Search Results - Grid Layout for Better Touch Targets */}
              {searchResults.length > 0 && (
                <div className="bg-white rounded-lg border-2 border-primary-200 p-4 space-y-3">
                  <div className="text-sm font-medium text-gray-700">
                    Found {searchResults.length} product{searchResults.length !== 1 ? 's' : ''}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {searchResults.map((p: Product) => (
                      <button
                        key={p.id}
                        onClick={() =>
                          dispatch(
                            addItem({
                              productId: p.id,
                              name: p.name,
                              sku: p.sku,
                              quantity: 1,
                              unitPrice: Number(p.sellingPrice ?? 0),
                            })
                          )
                        }
                        className="flex items-center justify-between p-4 bg-gray-50 hover:bg-primary-50 active:bg-primary-100 border-2 border-gray-200 hover:border-primary-400 active:border-primary-500 rounded-lg transition-all text-left min-h-[88px] touch-manipulation"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate text-base">
                            {p.name}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">SKU: {p.sku}</div>
                        </div>
                        <div className="ml-4 text-right shrink-0">
                          <div className="text-lg font-semibold text-primary-600">
                            ${Number(p.sellingPrice ?? 0).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Tap to add</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Cart - Clean Flat Design */}
              <div className="bg-white rounded-lg border-2 border-gray-200 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Shopping Cart ({pos.items.length})
                  </h3>
                  {pos.items.length > 0 && (
                    <Button variant="outline" onClick={() => dispatch(clearCart())} size="sm">
                      Clear All
                    </Button>
                  )}
                </div>

                {pos.items.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-4xl mb-3">🛒</div>
                    <div className="text-sm text-gray-500">
                      Cart is empty. Search and add products above.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pos.items.map(item => (
                      <div
                        key={`${item.productId}-${item.variantId ?? 'base'}`}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-500 mt-1">SKU: {item.sku}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              dispatch(
                                removeItem({
                                  productId: item.productId,
                                  variantId: item.variantId,
                                })
                              )
                            }
                            className="text-error-600 hover:text-error-700 hover:bg-error-50 ml-2"
                          >
                            Remove
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Quantity
                            </label>
                            <Input
                              type="number"
                              className="h-12 text-center text-base touch-manipulation"
                              value={item.quantity}
                              onChange={e =>
                                dispatch(
                                  updateItem({
                                    productId: item.productId,
                                    variantId: item.variantId,
                                    quantity: Math.max(1, Number(e.target.value || 1)),
                                  })
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Unit Price
                            </label>
                            <Input
                              type="number"
                              className="h-12 text-base touch-manipulation"
                              value={item.unitPrice}
                              onChange={e =>
                                dispatch(
                                  updateItem({
                                    productId: item.productId,
                                    variantId: item.variantId,
                                    unitPrice: Number(e.target.value || 0),
                                  })
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Discount
                            </label>
                            <Input
                              type="number"
                              className="h-12 text-base touch-manipulation"
                              value={item.discountAmount || 0}
                              onChange={e =>
                                dispatch(
                                  updateItem({
                                    productId: item.productId,
                                    variantId: item.variantId,
                                    discountAmount: Number(e.target.value || 0),
                                  })
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                          <span className="text-sm text-gray-600">Item Total</span>
                          <span className="text-lg font-semibold text-gray-900">
                            $
                            {(item.quantity * item.unitPrice - (item.discountAmount || 0)).toFixed(
                              2
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals & Payments - Responsive Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* Left Column - Adjustments */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <h3 className="text-base font-semibold text-gray-900">Adjustments</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Order Discount
                      </label>
                      <Input
                        type="number"
                        className="h-12 text-base touch-manipulation"
                        placeholder="0.00"
                        value={pos.discountAmount}
                        onChange={e => dispatch(setDiscountAmount(Number(e.target.value || 0)))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tax</label>
                      <Input
                        type="number"
                        className="h-12 text-base touch-manipulation"
                        placeholder="0.00"
                        value={pos.taxAmount}
                        onChange={e => dispatch(setTaxAmount(Number(e.target.value || 0)))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (optional)
                      </label>
                      <Input
                        placeholder="Add notes for this sale"
                        value={pos.notes ?? ''}
                        onChange={e => dispatch(setNotes(e.target.value))}
                        className="h-12 text-base touch-manipulation"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column - Payment & Summary */}
                <div className="space-y-4">
                  {/* Payment Methods */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-900">Payment</h3>
                      {pos.payments.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dispatch(clearPayments())}
                          className="text-error-600 hover:text-error-700"
                        >
                          Clear All
                        </Button>
                      )}
                    </div>

                    <Select
                      onValueChange={method =>
                        dispatch(
                          addPayment({
                            method: method as PosPayment['method'],
                            amount: Math.max(0, total - totalPayments),
                          })
                        )
                      }
                    >
                      <SelectTrigger className="w-full h-12 text-base touch-manipulation">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash" className="h-12 text-base">
                          💵 Cash
                        </SelectItem>
                        <SelectItem value="card" className="h-12 text-base">
                          💳 Card
                        </SelectItem>
                        <SelectItem value="check" className="h-12 text-base">
                          📝 Check
                        </SelectItem>
                        <SelectItem value="store_credit" className="h-12 text-base">
                          🎫 Store Credit
                        </SelectItem>
                        <SelectItem value="gift_card" className="h-12 text-base">
                          🎁 Gift Card
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Payments list */}
                    {pos.payments.length > 0 && (
                      <div className="space-y-2 pt-2">
                        {pos.payments.map((p, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-200"
                          >
                            <div className="flex-1">
                              <div className="text-base font-medium text-gray-900 capitalize">
                                {p.method.replace('_', ' ')}
                              </div>
                            </div>
                            <Input
                              type="number"
                              className="w-32 h-12 text-base touch-manipulation"
                              value={p.amount}
                              onChange={e => {
                                const amount = Number(e.target.value || 0);
                                dispatch(removePayment(idx));
                                dispatch(addPayment({ ...p, amount }));
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => dispatch(removePayment(idx))}
                              className="text-error-600 hover:text-error-700 hover:bg-error-50 h-12 w-12 touch-manipulation"
                            >
                              ✕
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Order Summary */}
                  <div className="bg-primary-50 rounded-lg p-4 border-2 border-primary-200">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Order Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-700">
                        <span>Subtotal</span>
                        <span className="font-medium">${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Discount</span>
                        <span className="font-medium text-error-600">
                          -${pos.discountAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Tax</span>
                        <span className="font-medium">${pos.taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="border-t-2 border-primary-300 pt-2 mt-2">
                        <div className="flex justify-between text-lg font-bold text-gray-900">
                          <span>Total</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Paid</span>
                        <span className="font-medium text-success-600">
                          ${totalPayments.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-base font-semibold">
                        <span
                          className={totalPayments >= total ? 'text-success-600' : 'text-error-600'}
                        >
                          {totalPayments >= total ? 'Change' : 'Amount Due'}
                        </span>
                        <span
                          className={totalPayments >= total ? 'text-success-600' : 'text-error-600'}
                        >
                          ${Math.abs(total - totalPayments).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Complete Sale Button - Large Touch Target */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <Button
                  size="lg"
                  className="h-14 px-8 text-base font-semibold w-full sm:w-auto touch-manipulation"
                  onClick={async () => {
                    if (!pos.locationId) {
                      setError('Please select a location');
                      return;
                    }
                    if (pos.items.length === 0) {
                      setError('Please add at least one item');
                      return;
                    }
                    if (Math.abs(totalPayments - total) > 0.01) {
                      setError('Payments must equal total');
                      return;
                    }
                    try {
                      setError(null);
                      const payload = {
                        locationId: pos.locationId,
                        customerId: pos.customerId || undefined,
                        customerEmail: pos.customerEmail || undefined,
                        customerPhone: pos.customerPhone || undefined,
                        customerName: pos.customerName || undefined,
                        items: pos.items.map(i => ({
                          productId: i.productId,
                          variantId: i.variantId,
                          quantity: i.quantity,
                          unitPrice: i.unitPrice,
                          discountAmount: i.discountAmount || 0,
                        })),
                        payments: pos.payments.map(p => ({ method: p.method, amount: p.amount })),
                        discountAmount: pos.discountAmount,
                        taxAmount: pos.taxAmount,
                        notes: pos.notes || undefined,
                      };
                      await salesAPI.createSale(payload);
                      // Reset cart on success
                      dispatch(clearCart());
                      dispatch(clearPayments());
                      setSearchResults([]);
                      setSearch('');
                      // Refresh dashboard summary
                      const summary = await salesAPI.getDashboardSummary();
                      if (summary.data.data) {
                        setData(summary.data.data);
                      }
                    } catch (err: unknown) {
                      setError(extractErrorMessage(err, 'Failed to complete sale'));
                    }
                  }}
                  disabled={
                    !pos.locationId ||
                    pos.items.length === 0 ||
                    Math.abs(totalPayments - total) > 0.01
                  }
                >
                  ✓ Complete Sale
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <BarcodeScanner
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScan={handleScan}
        />
      </PageContent>
    </PageWrapper>
  );
}
