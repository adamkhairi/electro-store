import { Edit, Folder, FolderOpen, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { categoryAPI } from '../../services/api';
import { Button } from '../ui/button';

interface CategoryTreeNode {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  tenantId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

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
      if (response.data.success && response.data.data) {
        // Convert CategoryTreeNode[] to Category[] for local state
        const convertTreeNodes = (nodes: CategoryTreeNode[]): Category[] => {
          return nodes.map(node => ({
            id: node.id,
            name: node.name,
            description: node.description,
            parentId: node.parentId,
            image: node.image,
            isActive: node.isActive,
            sortOrder: node.sortOrder,
            tenantId: node.tenantId,
            createdAt:
              node.createdAt instanceof Date ? node.createdAt.toISOString() : node.createdAt,
            updatedAt:
              node.updatedAt instanceof Date ? node.updatedAt.toISOString() : node.updatedAt,
          }));
        };
        setCategories(convertTreeNodes(response.data.data));
      }
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
          className={`flex items-center justify-between p-4 border rounded-lg mb-2 transition-all cursor-pointer ${
            isSelected
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
          style={{ marginLeft: `${depth * 24}px` }}
          onClick={() => {
            if (selectable && onSelectCategory) {
              onSelectCategory(category);
            }
          }}
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {hasChildren && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  toggleExpand(category.id);
                }}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
              >
                {isExpanded ? <FolderOpen size={18} /> : <Folder size={18} />}
              </button>
            )}
            {!hasChildren && <div className="w-7 flex-shrink-0" />}

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{category.name}</h3>
              {category.description && (
                <p className="text-sm text-gray-600 mt-0.5 line-clamp-1">{category.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100">
                  {category.productCount || 0} products
                </span>
                <span>Sort: {category.sortOrder}</span>
                {!category.isActive && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>

          {!selectable && (
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              {onCreateSubcategory && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    onCreateSubcategory(category);
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <Plus size={14} className="mr-1" />
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
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
                  className="px-3 py-1.5 border border-red-300 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="ml-6">
            {category.children!.map(child => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4 font-medium">{error}</p>
          <Button
            onClick={fetchCategories}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="space-y-2">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No categories found</p>
            <Button
              onClick={fetchCategories}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Refresh
            </Button>
          </div>
        ) : (
          categories.map(category => renderCategory(category))
        )}
      </div>
    </div>
  );
};

export default CategoryList;
