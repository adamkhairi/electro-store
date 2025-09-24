import type { Product } from '@electrostock/types';
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

interface PaymentBreakdownItem {
  method: string;
  count: number;
  amount: number;
}

interface DashboardSummaryResponse {
  summary: {
    totalSales: number;
    totalTransactions: number;
    averageTransaction: number;
    date: string;
  };
  paymentMethods: PaymentBreakdownItem[];
  hourlyBreakdown: { hour: number; transactions: number; sales: number }[];
  recentSales: Array<{
    id: string;
    saleNumber: string;
    total: number;
    paymentMethod: string;
    saleDate: string;
    customerName: string;
  }>;
}

export default function PosPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
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
        if (mounted) {
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
        const res = await locationAPI.getLocations({ limit: 100 });
        const list = res.data.data.locations as Array<{ id: string; name: string }>; // narrow type
        setLocations(list);
        // If no selection yet, default to first
        if (!pos.locationId && list.length > 0) {
          dispatch(setLocation(list[0].id));
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
      setSearchResults((res.data.data.products || []) as Product[]);
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
          <div className="space-x-2">
            <Button onClick={() => window.location.reload()}>Refresh</Button>
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
        {loading && <div className="text-gray-600">Loading summary...</div>}
        {error && <div className="text-red-600">{error}</div>}

        {!loading && !error && data && (
          <StatsGrid>
            <StatCard
              title="Today's Sales"
              value={`$${data.summary.totalSales.toFixed(2)}`}
              icon={<span className="text-white text-lg font-bold">$</span>}
              iconColor="bg-green-500"
            />
            <StatCard
              title="Transactions"
              value={data.summary.totalTransactions.toString()}
              icon={<span className="text-white text-lg font-bold">#</span>}
              iconColor="bg-blue-500"
            />
            <StatCard
              title="Payment Methods"
              value={data.paymentMethods.length.toString()}
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
                  {data.recentSales.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <div className="text-center text-sm text-gray-500">No sales yet today.</div>
                      </TableCell>
                    </TableRow>
                  )}
                  {data.recentSales.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.saleNumber}</TableCell>
                      <TableCell>{s.customerName}</TableCell>
                      <TableCell className="capitalize">{s.paymentMethod}</TableCell>
                      <TableCell>${s.total.toFixed(2)}</TableCell>
                      <TableCell>{new Date(s.saleDate).toLocaleTimeString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ContentCard>
        )}

        {/* Minimal Checkout */}
        <Card>
          <CardContent>
            <div className="py-4 space-y-6">
              {/* Location & Customer */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Location</label>
                  <Select
                    value={pos.locationId ?? undefined}
                    onValueChange={val => dispatch(setLocation(val))}
                  >
                    <SelectTrigger className="w-full">
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
                  <label className="block text-sm text-gray-600 mb-1">Customer (optional)</label>
                  <Input
                    placeholder="Customer name"
                    value={pos.customerName ?? ''}
                    onChange={e => dispatch(setCustomer({ customerName: e.target.value }))}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    variant="outline"
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
                    Clear Customer
                  </Button>
                </div>
              </div>

              {/* Product Search */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Search products</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Name, SKU, barcode..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSearch();
                      }}
                    />
                    <Button onClick={handleSearch} disabled={searching}>
                      Search
                    </Button>
                    <Button variant="outline" onClick={() => setScannerOpen(true)}>
                      Scan
                    </Button>
                  </div>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div>
                  <div className="text-sm text-gray-600 mb-2">Results</div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResults.map((p: Product) => (
                          <TableRow key={p.id}>
                            <TableCell>{p.sku}</TableCell>
                            <TableCell>{p.name}</TableCell>
                            <TableCell>${Number(p.sellingPrice ?? 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
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
                              >
                                Add
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Cart */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">Cart</h3>
                  <Button variant="outline" onClick={() => dispatch(clearCart())}>
                    Clear Cart
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pos.items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7}>
                            <div className="text-center text-sm text-gray-500">
                              No items in cart.
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        pos.items.map(item => (
                          <TableRow key={`${item.productId}-${item.variantId ?? 'base'}`}>
                            <TableCell>{item.sku}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                className="w-24"
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
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                className="w-28"
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
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                className="w-28"
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
                            </TableCell>
                            <TableCell>
                              $
                              {(
                                item.quantity * item.unitPrice -
                                (item.discountAmount || 0)
                              ).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  dispatch(
                                    removeItem({
                                      productId: item.productId,
                                      variantId: item.variantId,
                                    })
                                  )
                                }
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Totals & Payments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-40 text-sm text-gray-600">Order Discount</div>
                    <Input
                      type="number"
                      className="w-40"
                      value={pos.discountAmount}
                      onChange={e => dispatch(setDiscountAmount(Number(e.target.value || 0)))}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-40 text-sm text-gray-600">Tax</div>
                    <Input
                      type="number"
                      className="w-40"
                      value={pos.taxAmount}
                      onChange={e => dispatch(setTaxAmount(Number(e.target.value || 0)))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Notes</label>
                    <Input
                      placeholder="Optional notes"
                      value={pos.notes ?? ''}
                      onChange={e => dispatch(setNotes(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-32 text-sm text-gray-600">Payment Method</div>
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
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Add payment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="store_credit">Store Credit</SelectItem>
                        <SelectItem value="gift_card">Gift Card</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => dispatch(clearPayments())}>
                      Clear Payments
                    </Button>
                  </div>

                  {/* Payments list */}
                  {pos.payments.length > 0 && (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Method</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pos.payments.map((p, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="capitalize">{p.method}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  className="w-32"
                                  value={p.amount}
                                  onChange={e => {
                                    const amount = Number(e.target.value || 0);
                                    // update by removing and re-adding (simple approach)
                                    dispatch(removePayment(idx));
                                    dispatch(addPayment({ ...p, amount }));
                                  }}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => dispatch(removePayment(idx))}
                                >
                                  Remove
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Totals */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount</span>
                      <span>-${pos.discountAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>${pos.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-gray-900">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payments</span>
                      <span>${totalPayments.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Due</span>
                      <span>${Math.max(0, total - totalPayments).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button
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
                      setData(summary.data.data);
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
                  Complete Sale
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
