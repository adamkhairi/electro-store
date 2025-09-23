import { Plus } from 'lucide-react';
import React, { useState } from 'react';
import CategoryForm from '../../components/categories/CategoryForm';
import CategoryList from '../../components/categories/CategoryList';
import { Button } from '../../components/ui/button';

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

type ViewMode = 'list' | 'create' | 'edit';

const CategoriesPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateCategory = () => {
    setSelectedCategory(null);
    setParentCategory(null);
    setViewMode('create');
  };

  const handleCreateSubcategory = (parent: Category) => {
    setSelectedCategory(null);
    setParentCategory(parent);
    setViewMode('create');
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setParentCategory(null);
    setViewMode('edit');
  };

  const handleSaveCategory = () => {
    setViewMode('list');
    setSelectedCategory(null);
    setParentCategory(null);
    // Trigger refresh of category list
    setRefreshKey(prev => prev + 1);
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedCategory(null);
    setParentCategory(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600 mt-1">
              Organize your products with hierarchical categories
            </p>
          </div>

          {viewMode === 'list' && (
            <Button onClick={handleCreateCategory} className="bg-blue-600 hover:bg-blue-700">
              <Plus size={16} className="mr-2" />
              Create Category
            </Button>
          )}
        </div>
      </div>

      {viewMode === 'list' && (
        <CategoryList
          key={refreshKey}
          onEdit={handleEditCategory}
          onCreateSubcategory={handleCreateSubcategory}
        />
      )}

      {(viewMode === 'create' || viewMode === 'edit') && (
        <CategoryForm
          category={selectedCategory}
          parentCategory={parentCategory}
          onSave={handleSaveCategory}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default CategoriesPage;
