import { Edit, Folder, FolderOpen, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { categoryAPI } from '../../services/api';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  parent?: {
    id: string;
    name: string;
  };
  children?: Category[];
  image?: string;
  isActive: boolean;
  sortOrder: number;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryListProps {
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  onCreateSubcategory?: (parentCategory: Category) => void;
  selectable?: boolean;
  selectedCategoryId?: string;
  onSelectCategory?: (category: Category) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({
  onEdit,
  onDelete,
  onCreateSubcategory,
  selectable = false,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryAPI.getCategoryTree();
      setCategories(response.data.data);
    } catch (err) {
      setError('Failed to load categories');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleDelete = async (category: Category) => {
    if (window.confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      try {
        await categoryAPI.deleteCategory(category.id);
        await fetchCategories(); // Refresh the list
      } catch (err) {
        console.error('Error deleting category:', err);
        alert('Failed to delete category');
      }
    }
  };

  const renderCategory = (category: Category, depth = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectable && selectedCategoryId === category.id;

    return (
      <div key={category.id} className="category-item">
        <div
          className={`flex items-center justify-between p-3 border rounded-lg mb-2 hover:bg-gray-50 cursor-pointer ${
            isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}
          style={{ marginLeft: `${depth * 20}px` }}
          onClick={() => {
            if (selectable && onSelectCategory) {
              onSelectCategory(category);
            }
          }}
        >
          <div className="flex items-center space-x-3">
            {hasChildren && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  toggleExpand(category.id);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                {isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
              </button>
            )}
            {!hasChildren && <div className="w-4" />}

            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{category.name}</h3>
              {category.description && (
                <p className="text-sm text-gray-500">{category.description}</p>
              )}
              <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                <span>{category.productCount || 0} products</span>
                <span>Sort: {category.sortOrder}</span>
                {!category.isActive && <span className="text-red-500">Inactive</span>}
              </div>
            </div>
          </div>

          {!selectable && (
            <div className="flex items-center space-x-2">
              {onCreateSubcategory && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    onCreateSubcategory(category);
                  }}
                >
                  <Plus size={14} />
                  Add Sub
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    onEdit(category);
                  }}
                >
                  <Edit size={14} />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    handleDelete(category);
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {category.children!.map(child => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchCategories}>Retry</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-2">
        {categories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No categories found</p>
            <Button onClick={fetchCategories}>Refresh</Button>
          </div>
        ) : (
          categories.map(category => renderCategory(category))
        )}
      </div>
    </Card>
  );
};

export default CategoryList;
