import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProductForm from '../../components/products/ProductForm';
import { productAPI } from '../../services/api';

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
  status: 'active' | 'inactive' | 'discontinued';
}

const EditProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<Partial<ProductFormData> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  const fetchProduct = async (productId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await productAPI.getProduct(productId);

      if (response.data.success) {
        const product = response.data.data;
        setInitialData({
          name: product.name,
          description: product.description || '',
          sku: product.sku,
          barcode: product.barcode || '',
          brand: product.brand || '',
          model: product.model || '',
          categoryId: product.categoryId || '',
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          lowStockThreshold: product.lowStockThreshold || 10,
          status: product.status,
        });
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

  const handleSubmit = async (data: ProductFormData) => {
    if (!id) return;

    try {
      setIsSubmitting(true);

      const response = await productAPI.updateProduct(id, {
        ...data,
        // Ensure barcode is optional
        ...(data.barcode && { barcode: data.barcode }),
      });

      if (response.data.success) {
        // Navigate to the product detail page
        navigate(`/products/${id}`, {
          state: { message: 'Product updated successfully!' },
        });
      } else {
        throw new Error(response.data.message || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      // TODO: Show error notification
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/products');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 text-lg">Loading product...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="p-4 bg-red-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Error Loading Product</h3>
            <p className="mt-2 text-gray-600">{error}</p>
            <button
              onClick={() => navigate('/products')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!initialData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProductForm
          mode="edit"
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  );
};

export default EditProductPage;
