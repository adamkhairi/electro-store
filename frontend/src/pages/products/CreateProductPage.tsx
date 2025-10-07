import { ProductStatus } from '@electrostock/types';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  status: ProductStatus;
}

const CreateProductPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ProductFormData) => {
    try {
      setIsSubmitting(true);

      const response = await productAPI.createProduct({
        ...data,
        // Ensure barcode is optional
        ...(data.barcode && { barcode: data.barcode }),
      });

      if (response.data.success && response.data.data) {
        // Navigate to the product detail page
        navigate(`/products/${response.data.data.id}`, {
          state: { message: 'Product created successfully!' },
        });
      } else {
        throw new Error(response.data.message || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      // TODO: Show error notification
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/products');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProductForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  );
};

export default CreateProductPage;
