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
    <div className="page-container">
      <div className="page-wrapper">
        <div className="page-header">
          <div className="md:flex md:items-start md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="page-title">Categories</h1>
              <p className="page-description">
                Organize your products with hierarchical categories
              </p>
            </div>
            {viewMode === 'list' && (
              <div className="page-actions">
                <Button onClick={handleCreateCategory} className="btn-primary">
                  <Plus size={16} className="mr-2" />
                  Create Category
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="content-section">
          {viewMode === 'list' && (
            <div className="card">
              <CategoryList
                key={refreshKey}
                onEdit={handleEditCategory}
                onCreateSubcategory={handleCreateSubcategory}
              />
            </div>
          )}

          {(viewMode === 'create' || viewMode === 'edit') && (
            <div className="card">
              <CategoryForm
                category={selectedCategory}
                parentCategory={parentCategory}
                onSave={handleSaveCategory}
                onCancel={handleCancel}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
