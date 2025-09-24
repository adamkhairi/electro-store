import { useSelector } from 'react-redux';
import {
  ContentCard,
  PageContent,
  PageHeader,
  PageWrapper,
  StatCard,
  StatsGrid,
} from '../components/layout/PageWrapper';
import { Button } from '../components/ui/button';
import type { RootState } from '../store';

export default function DashboardPage() {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <PageWrapper>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.firstName}! Here's what's happening with your store.`}
      />

      <PageContent>
        {/* Stats overview */}
        <StatsGrid>
          <StatCard
            title="Total Revenue"
            value="$24,780"
            icon={<span className="text-white text-sm font-bold">$</span>}
            iconColor="bg-green-500"
            trend={{ value: '+12.5%', isPositive: true }}
          />
          <StatCard
            title="Total Orders"
            value="142"
            icon={<span className="text-white text-sm font-bold">#</span>}
            iconColor="bg-blue-500"
            trend={{ value: '+8.2%', isPositive: true }}
          />
          <StatCard
            title="Total Customers"
            value="89"
            icon={<span className="text-white text-sm font-bold">�</span>}
            iconColor="bg-yellow-500"
          />
          <StatCard
            title="Low Stock Items"
            value="12"
            icon={<span className="text-white text-sm font-bold">⚠️</span>}
            iconColor="bg-red-500"
          />
        </StatsGrid>

        {/* Recent activity and quick actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <ContentCard title="Recent Orders">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Order #ORD-001</p>
                  <p className="text-sm text-gray-600">John Doe - $299.99</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Completed
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Order #ORD-002</p>
                  <p className="text-sm text-gray-600">Jane Smith - $1,299.99</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Processing
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900">Order #ORD-003</p>
                  <p className="text-sm text-gray-600">Mike Johnson - $799.99</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Pending
                </span>
              </div>
            </div>
          </ContentCard>

          {/* Quick Actions */}
          <ContentCard title="Quick Actions">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-gray-50"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">+</span>
                </div>
                <span className="text-sm font-medium">Add Product</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-gray-50"
              >
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📋</span>
                </div>
                <span className="text-sm font-medium">New Order</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-gray-50"
              >
                <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">👤</span>
                </div>
                <span className="text-sm font-medium">Add Customer</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-gray-50"
              >
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📊</span>
                </div>
                <span className="text-sm font-medium">View Reports</span>
              </Button>
            </div>
          </ContentCard>
        </div>
      </PageContent>
    </PageWrapper>
  );
}
