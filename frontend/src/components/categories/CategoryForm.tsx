import React, { useEffect, useState } from 'react';
import { categoryAPI } from '../../services/api';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  parent?: {
    id: string;
    name: string;
  };
  image?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormProps {
  category?: Category | null;
  parentCategory?: Category | null;
  onSave: () => void;
  onCancel: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  parentCategory,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: 'none',
    image: '',
    sortOrder: 0,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load existing category data if editing
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        parentId: category.parentId || 'none',
        image: category.image || '',
        sortOrder: category.sortOrder,
      });
    } else if (parentCategory) {
      // If creating a subcategory, set the parent
      setFormData(prev => ({
        ...prev,
        parentId: parentCategory.id,
      }));
    }

    // Load all categories for parent selection
    fetchCategories();
  }, [category, parentCategory]);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getCategories();
      setCategories(response.data.data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }

    if (formData.name.length > 255) {
      newErrors.name = 'Category name must be less than 255 characters';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    // Check if selected parent would create a circular reference
    if (category && formData.parentId === category.id) {
      newErrors.parentId = 'Category cannot be its own parent';
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
      setSaving(true);

      const submitData = {
        ...formData,
        parentId: formData.parentId === 'none' ? null : formData.parentId || null,
        image: formData.image || null,
      };

      if (category) {
        // Update existing category
        await categoryAPI.updateCategory(category.id, submitData);
      } else {
        // Create new category
        await categoryAPI.createCategory(submitData);
      }

      onSave();
    } catch (err: unknown) {
      console.error('Error saving category:', err);
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      const errorMessage = error?.response?.data?.error?.message || 'Failed to save category';
      setErrors({ general: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  // Filter out current category and its descendants from parent options
  const getParentOptions = () => {
    if (!category) return categories;

    const isDescendant = (cat: Category, targetId: string): boolean => {
      if (cat.id === targetId) return true;
      if (cat.parentId === targetId) return true;
      // Would need to implement recursive check for deeper descendants
      return false;
    };

    return categories.filter(cat => !isDescendant(cat, category.id));
  };

  const parentOptions = getParentOptions().filter(cat => cat.id !== category?.id);

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {category ? 'Edit Category' : 'Create Category'}
        </h2>
        {parentCategory && (
          <p className="text-sm text-gray-600 mt-1">
            Creating subcategory under: {parentCategory.name}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">{errors.general}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category Name *</label>
          <Input
            type="text"
            value={formData.name}
            onChange={e => handleInputChange('name', e.target.value)}
            placeholder="Enter category name"
            className={errors.name ? 'border-red-300' : ''}
          />
          {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={e => handleInputChange('description', e.target.value)}
            placeholder="Enter category description (optional)"
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Parent Category</label>
          <Select
            value={formData.parentId}
            onValueChange={(value: string) => handleInputChange('parentId', value)}
          >
            <SelectTrigger className={errors.parentId ? 'border-red-300' : ''}>
              <SelectValue placeholder="None (Top Level)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (Top Level)</SelectItem>
              {parentOptions.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.parentId && <p className="text-red-600 text-sm mt-1">{errors.parentId}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
          <Input
            type="url"
            value={formData.image}
            onChange={e => handleInputChange('image', e.target.value)}
            placeholder="Enter image URL (optional)"
            className={errors.image ? 'border-red-300' : ''}
          />
          {errors.image && <p className="text-red-600 text-sm mt-1">{errors.image}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
          <Input
            type="number"
            value={formData.sortOrder}
            onChange={e => handleInputChange('sortOrder', parseInt(e.target.value) || 0)}
            min="0"
            className={errors.sortOrder ? 'border-red-300' : ''}
          />
          {errors.sortOrder && <p className="text-red-600 text-sm mt-1">{errors.sortOrder}</p>}
          <p className="text-xs text-gray-500 mt-1">
            Lower numbers appear first. Use 0 for default ordering.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default CategoryForm;
