import {
  AlertTriangle,
  ClipboardPlus,
  PackagePlus,
  ShoppingBag,
  Users,
  Wallet,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import {
  ContentCard,
  PageContent,
  PageHeader,
  PageWrapper,
  StatCard,
  StatsGrid,
} from '../../components/layout/PageWrapper';
import { Button } from '../../components/ui/button';
import type { RootState } from '../../store';

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
            icon={<Wallet className="h-5 w-5" />}
            iconColor="bg-success"
            trend={{ value: '+12.5%', isPositive: true }}
          />
          <StatCard
            title="Total Orders"
            value="142"
            icon={<ShoppingBag className="h-5 w-5" />}
            iconColor="bg-primary"
            trend={{ value: '+8.2%', isPositive: true }}
          />
          <StatCard
            title="Total Customers"
            value="89"
            icon={<Users className="h-5 w-5" />}
            iconColor="bg-info"
          />
          <StatCard
            title="Low Stock Items"
            value="12"
            icon={<AlertTriangle className="h-5 w-5" />}
            iconColor="bg-error"
          />
        </StatsGrid>

        {/* Recent activity and quick actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <ContentCard title="Recent Orders">
            <div className="divide-y divide-gray-100">
              <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">Order #ORD-001</p>
                  <p className="text-sm text-gray-600 mt-0.5">John Doe · $299.99</p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <BadgePill label="Completed" tone="success" />
                </div>
              </div>
              <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">Order #ORD-002</p>
                  <p className="text-sm text-gray-600 mt-0.5">Jane Smith · $1,299.99</p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <BadgePill label="Processing" tone="warning" />
                </div>
              </div>
              <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">Order #ORD-003</p>
                  <p className="text-sm text-gray-600 mt-0.5">Mike Johnson · $799.99</p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <BadgePill label="Pending" tone="info" />
                </div>
              </div>
            </div>
          </ContentCard>

          {/* Quick Actions */}
          <ContentCard
            title="Quick Actions"
            description="Jump into your most common workflows with a single tap."
          >
            <div className="grid grid-cols-2 gap-4">
              <QuickActionButton
                icon={<PackagePlus className="h-4 w-4" />}
                label="Add Product"
                accent="bg-primary"
              />
              <QuickActionButton
                icon={<ClipboardPlus className="h-4 w-4" />}
                label="New Order"
                accent="bg-emerald-500"
              />
              <QuickActionButton
                icon={<Users className="h-4 w-4" />}
                label="Add Customer"
                accent="bg-amber-500"
              />
              <QuickActionButton
                icon={<ShoppingBag className="h-4 w-4" />}
                label="View Reports"
                accent="bg-violet-500"
              />
            </div>
          </ContentCard>
        </div>
      </PageContent>
    </PageWrapper>
  );
}

interface BadgePillProps {
  label: string;
  tone: 'success' | 'warning' | 'info';
}

const toneClasses: Record<BadgePillProps['tone'], string> = {
  success: 'bg-success-50 text-success-700 border-success-200',
  warning: 'bg-warning-50 text-warning-700 border-warning-200',
  info: 'bg-info-50 text-info-700 border-info-200',
};

const BadgePill = ({ label, tone }: BadgePillProps) => (
  <span
    className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${toneClasses[tone]}`}
  >
    {label}
  </span>
);

interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  accent: string;
}

const QuickActionButton = ({ icon, label, accent }: QuickActionButtonProps) => (
  <Button
    variant="outline"
    className="h-auto rounded-lg border-gray-200 bg-white p-5 text-left transition-all duration-200 hover:border-gray-300 hover:bg-gray-50"
  >
    <div className="flex flex-col items-start gap-3">
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg text-white ${accent}`}>
        {icon}
      </div>
      <span className="text-sm font-semibold text-gray-900">{label}</span>
    </div>
  </Button>
);
