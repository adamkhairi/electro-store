import { ProductStatus } from '@electrostock/types';
import { AlertTriangle, CheckCircle, Loader2, Package, Scan, Wand2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { categoryAPI, productAPI } from '../../services/api';
import BarcodeScanner from '../barcode/BarcodeScanner';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  children?: Category[];
}

interface ProductFormData {
  name: string;
  description: string;
  sku: string;
  barcode: string;
  brand: string;
  model: string;
  categoryId: string;
  costPrice: number;
  sellingPrice: number;
  lowStockThreshold: number;
  status: ProductStatus;
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode,
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    sku: '',
    barcode: '',
    brand: '',
    model: '',
    categoryId: '',
    costPrice: 0,
    sellingPrice: 0,
    lowStockThreshold: 10,
    status: ProductStatus.ACTIVE,
    ...initialData,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});

  // SKU and Barcode states
  const [generatingSku, setGeneratingSku] = useState(false);
  const [validatingBarcode, setValidatingBarcode] = useState(false);
  const [barcodeValid, setBarcodeValid] = useState<boolean | null>(null);
  const [skuGenerated, setSkuGenerated] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await categoryAPI.getCategories();
      if (response.data.success && response.data.data) {
        // The API returns { data: { categories, pagination } }
        const categoriesData = response.data.data.categories;
        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData);
        } else {
          console.warn('Unexpected categories data structure:', categoriesData);
          setCategories([]);
        }
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Special handling for barcode validation
    if (field === 'barcode' && value && typeof value === 'string') {
      if (value !== formData.barcode) {
        setBarcodeValid(null);
        // Debounce barcode validation
        const timeoutId = setTimeout(() => {
          validateBarcode(value);
        }, 500);
        return () => clearTimeout(timeoutId);
      }
    }
  };

  const generateSku = async () => {
    if (!formData.name || !formData.categoryId) {
      setErrors(prev => ({
        ...prev,
        name: !formData.name ? 'Product name is required for SKU generation' : undefined,
        categoryId: !formData.categoryId ? 'Category is required for SKU generation' : undefined,
      }));
      return;
    }

    try {
      setGeneratingSku(true);
      const response = await productAPI.generateSku({
        productName: formData.name,
        categoryId: formData.categoryId,
        brand: formData.brand || undefined,
      });

      if (response.data.success && response.data.data) {
        const newSku = response.data.data.sku;
        setFormData(prev => ({ ...prev, sku: newSku }));
        setSkuGenerated(true);

        // Clear the generated indicator after 3 seconds
        setTimeout(() => setSkuGenerated(false), 3000);
      }
    } catch (error) {
      console.error('Error generating SKU:', error);
      setErrors(prev => ({ ...prev, sku: 'Failed to generate SKU' }));
    } finally {
      setGeneratingSku(false);
    }
  };

  const validateBarcode = async (barcode: string) => {
    if (!barcode.trim()) {
      setBarcodeValid(null);
      return;
    }

    try {
      setValidatingBarcode(true);
      const response = await productAPI.validateBarcode({ barcode });

      if (response.data.success && response.data.data) {
        setBarcodeValid(response.data.data.isValid);
        if (!response.data.data.isValid) {
          setErrors(prev => ({
            ...prev,
            barcode: response.data.data?.message || 'Invalid barcode format',
          }));
        } else {
          setErrors(prev => ({ ...prev, barcode: undefined }));
        }
      }
    } catch (error) {
      console.error('Error validating barcode:', error);
      setBarcodeValid(false);
      setErrors(prev => ({ ...prev, barcode: 'Failed to validate barcode' }));
    } finally {
      setValidatingBarcode(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }

    if (formData.costPrice < 0) {
      newErrors.costPrice = 'Cost price must be positive';
    }

    if (formData.sellingPrice < 0) {
      newErrors.sellingPrice = 'Selling price must be positive';
    }

    if (formData.sellingPrice < formData.costPrice) {
      newErrors.sellingPrice = 'Selling price should be greater than cost price';
    }

    if (formData.lowStockThreshold < 0) {
      newErrors.lowStockThreshold = 'Low stock threshold must be positive';
    }

    if (formData.barcode && barcodeValid === false) {
      newErrors.barcode = 'Please provide a valid barcode or leave empty';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const renderCategoryOptions = (categories: Category[], level = 0): React.ReactNode[] => {
    // Defensive check to ensure categories is an array
    if (!Array.isArray(categories)) {
      console.warn('renderCategoryOptions called with non-array:', categories);
      return [];
    }

    return categories.flatMap(category => [
      <SelectItem key={category.id} value={category.id}>
        {'  '.repeat(level) + category.name}
      </SelectItem>,
      ...(category.children ? renderCategoryOptions(category.children, level + 1) : []),
    ]);
  };

  const simulateBarcodeScanner = () => {
    // In a real app, this would integrate with a barcode scanner
    // For demo purposes, we'll generate a sample barcode
    const sampleBarcodes = [
      '1234567890123', // EAN-13
      '123456789012', // UPC-A
      '12345678901', // EAN-11
      '1234567890', // EAN-10
    ];

    const randomBarcode = sampleBarcodes[Math.floor(Math.random() * sampleBarcodes.length)];
    setFormData(prev => ({ ...prev, barcode: randomBarcode }));
    validateBarcode(randomBarcode);
  };

  const handleBarcodeScanned = (barcode: string) => {
    setFormData(prev => ({ ...prev, barcode }));
    validateBarcode(barcode);
    setShowBarcodeScanner(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Create New Product' : 'Edit Product'}
          </h2>
          <p className="text-gray-600 mt-1">
            {mode === 'create'
              ? 'Add a new product to your inventory with detailed information.'
              : 'Update product information and settings.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
              <Input
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                placeholder="Enter product name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                placeholder="Enter product description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
              <Input
                value={formData.brand}
                onChange={e => handleInputChange('brand', e.target.value)}
                placeholder="Enter brand name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
              <Input
                value={formData.model}
                onChange={e => handleInputChange('model', e.target.value)}
                placeholder="Enter model number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <Select
                value={formData.categoryId}
                onValueChange={value => handleInputChange('categoryId', value)}
              >
                <SelectTrigger className={errors.categoryId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {loadingCategories ? (
                    <SelectItem value="loading" disabled>
                      Loading categories...
                    </SelectItem>
                  ) : categories.length === 0 ? (
                    <SelectItem value="no-categories" disabled>
                      No categories available
                    </SelectItem>
                  ) : (
                    renderCategoryOptions(categories)
                  )}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive' | 'discontinued') =>
                  handleInputChange('status', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ProductStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={ProductStatus.INACTIVE}>Inactive</SelectItem>
                  <SelectItem value={ProductStatus.DISCONTINUED}>Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* SKU and Barcode */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Scan className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">SKU & Barcode</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU (Stock Keeping Unit) *
              </label>
              <div className="flex gap-2">
                <Input
                  value={formData.sku}
                  onChange={e => handleInputChange('sku', e.target.value)}
                  placeholder="Enter or generate SKU"
                  className={`flex-1 ${errors.sku ? 'border-red-500' : ''} ${skuGenerated ? 'border-green-500' : ''}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateSku}
                  disabled={generatingSku || !formData.name || !formData.categoryId}
                  className="px-3"
                >
                  {generatingSku ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : skuGenerated ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.sku && <p className="text-red-500 text-sm mt-1">{errors.sku}</p>}
              {skuGenerated && (
                <p className="text-green-600 text-sm mt-1">SKU generated successfully!</p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                Fill in product name and category first to generate SKU
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Barcode</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={formData.barcode}
                    onChange={e => handleInputChange('barcode', e.target.value)}
                    placeholder="Enter barcode or scan"
                    className={`pr-10 ${errors.barcode ? 'border-red-500' : barcodeValid === true ? 'border-green-500' : barcodeValid === false ? 'border-red-500' : ''}`}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {validatingBarcode ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    ) : barcodeValid === true ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : barcodeValid === false ? (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    ) : null}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBarcodeScanner(true)}
                  className="px-3"
                  title="Open barcode scanner"
                >
                  <Scan className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={simulateBarcodeScanner}
                  className="px-3"
                  title="Simulate barcode scanner"
                >
                  Demo
                </Button>
              </div>
              {errors.barcode && <p className="text-red-500 text-sm mt-1">{errors.barcode}</p>}
              {barcodeValid === true && (
                <p className="text-green-600 text-sm mt-1">Valid barcode format</p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                Supports EAN-13, UPC-A, and other standard formats
              </p>
            </div>
          </div>
        </Card>

        {/* Pricing */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 bg-amber-100 rounded flex items-center justify-center">
              <span className="text-amber-600 text-xs font-bold">$</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Pricing</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price *</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.costPrice || ''}
                onChange={e => handleInputChange('costPrice', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={errors.costPrice ? 'border-red-500' : ''}
              />
              {errors.costPrice && <p className="text-red-500 text-sm mt-1">{errors.costPrice}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selling Price *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.sellingPrice || ''}
                onChange={e => handleInputChange('sellingPrice', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={errors.sellingPrice ? 'border-red-500' : ''}
              />
              {errors.sellingPrice && (
                <p className="text-red-500 text-sm mt-1">{errors.sellingPrice}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Low Stock Threshold
              </label>
              <Input
                type="number"
                min="0"
                value={formData.lowStockThreshold || ''}
                onChange={e =>
                  handleInputChange('lowStockThreshold', parseInt(e.target.value) || 0)
                }
                placeholder="10"
                className={errors.lowStockThreshold ? 'border-red-500' : ''}
              />
              {errors.lowStockThreshold && (
                <p className="text-red-500 text-sm mt-1">{errors.lowStockThreshold}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">Alert when stock falls below this level</p>
            </div>
          </div>

          {/* Pricing Summary */}
          {formData.costPrice > 0 && formData.sellingPrice > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Profit Margin:</span>
                <span
                  className={`font-medium ${formData.sellingPrice > formData.costPrice ? 'text-green-600' : 'text-red-600'}`}
                >
                  ${(formData.sellingPrice - formData.costPrice).toFixed(2)} (
                  {(
                    ((formData.sellingPrice - formData.costPrice) / formData.costPrice) *
                    100
                  ).toFixed(1)}
                  %)
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || validatingBarcode || generatingSku}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : mode === 'create' ? (
              'Create Product'
            ) : (
              'Update Product'
            )}
          </Button>
        </div>
      </form>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onScan={handleBarcodeScanned}
        onClose={() => setShowBarcodeScanner(false)}
      />
    </div>
  );
};

export default ProductForm;
