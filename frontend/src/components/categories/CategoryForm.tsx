import React, { useEffect, useState } from 'react';
import { categoryAPI } from '../../services/api';
import { Button } from '../ui/button';
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
      if (response.data.success && response.data.data) {
        const categoriesData = response.data.data.categories || [];
        // Convert Date objects to strings for local state compatibility
        const categories = categoriesData.map(cat => ({
          ...cat,
          createdAt: cat.createdAt instanceof Date ? cat.createdAt.toISOString() : cat.createdAt,
          updatedAt: cat.updatedAt instanceof Date ? cat.updatedAt.toISOString() : cat.updatedAt,
        }));
        setCategories(categories);
      }
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
        name: formData.name,
        description: formData.description,
        parentId: formData.parentId === 'none' ? undefined : formData.parentId || undefined,
        image: formData.image || undefined,
        sortOrder: formData.sortOrder,
      };

      if (category) {
        // Update existing category
        await categoryAPI.updateCategory(category.id, { id: category.id, ...submitData });
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

    return categories.filter((cat: Category) => !isDescendant(cat, category.id));
  };

  const parentOptions = getParentOptions().filter((cat: Category) => cat.id !== category?.id);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {category ? 'Edit Category' : 'Create Category'}
        </h2>
        {parentCategory && (
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-md bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-700">
              Creating subcategory under: <span className="font-medium">{parentCategory.name}</span>
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm font-medium">{errors.general}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Category Name <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={e => handleInputChange('name', e.target.value)}
            placeholder="Enter category name"
            className={`w-full px-4 py-2.5 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          />
          {errors.name && <p className="text-red-600 text-sm mt-1.5">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={e => handleInputChange('description', e.target.value)}
            placeholder="Enter category description (optional)"
            rows={3}
            className={`w-full px-4 py-2.5 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
              errors.description
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          />
          {errors.description && (
            <p className="text-red-600 text-sm mt-1.5">{errors.description}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Parent Category</label>
          <Select
            value={formData.parentId}
            onValueChange={(value: string) => handleInputChange('parentId', value)}
          >
            <SelectTrigger className={`h-11 ${errors.parentId ? 'border-red-300 bg-red-50' : ''}`}>
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
          {errors.parentId && <p className="text-red-600 text-sm mt-1.5">{errors.parentId}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Image URL</label>
          <Input
            type="url"
            value={formData.image}
            onChange={e => handleInputChange('image', e.target.value)}
            placeholder="Enter image URL (optional)"
            className={`w-full px-4 py-2.5 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.image ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          />
          {errors.image && <p className="text-red-600 text-sm mt-1.5">{errors.image}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Sort Order</label>
          <Input
            type="number"
            value={formData.sortOrder}
            onChange={e => handleInputChange('sortOrder', parseInt(e.target.value) || 0)}
            min="0"
            className={`w-full px-4 py-2.5 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.sortOrder
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          />
          {errors.sortOrder && <p className="text-red-600 text-sm mt-1.5">{errors.sortOrder}</p>}
          <p className="text-xs text-gray-500 mt-1.5">
            Lower numbers appear first. Use 0 for default ordering.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
            className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;
