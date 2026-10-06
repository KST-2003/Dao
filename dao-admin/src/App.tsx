import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { ErrorState, TableSkeleton } from '@/components/ui'
import { AdminLayout } from '@/layouts/AdminLayout'
import LoginPage from '@/pages/LoginPage'
import type { Permission } from '@/types/api'

const Dashboard = lazy(() => import('@/pages/DashboardPage'))
const Products = lazy(() => import('@/pages/ProductsPage'))
const ProductEdit = lazy(() => import('@/pages/ProductEditPage'))
const Inventory = lazy(() => import('@/pages/InventoryPage'))
const Orders = lazy(() => import('@/pages/OrdersPage'))
const OrderDetail = lazy(() => import('@/pages/OrderDetailPage'))
const Customers = lazy(() => import('@/pages/CustomersPage'))
const CustomerDetail = lazy(() => import('@/pages/CustomerDetailPage'))
const CouponRedemptions = lazy(() => import('@/pages/CouponRedemptionsPage'))
const Points = lazy(() => import('@/pages/PointsPage'))
const Reviews = lazy(() => import('@/pages/ReviewsPage'))
const Notifications = lazy(() => import('@/pages/NotificationsPage'))
const Settings = lazy(() => import('@/pages/SettingsPage'))
const AdminUsers = lazy(() => import('@/pages/AdminUsersPage'))
const AuditLogs = lazy(() => import('@/pages/AuditLogsPage'))
const Videos = lazy(() => import('@/pages/VideosPage'))
const VideoEdit = lazy(() => import('@/pages/VideoEditPage'))
const Recipes = lazy(() => import('@/pages/RecipesPage'))
const RecipeEdit = lazy(() => import('@/pages/RecipeEditPage'))
const Categories = lazy(() => import('@/pages/ResourcePages').then((m) => ({ default: m.CategoriesPage })))
const Collections = lazy(() => import('@/pages/ResourcePages').then((m) => ({ default: m.CollectionsPage })))
const Tiers = lazy(() => import('@/pages/ResourcePages').then((m) => ({ default: m.MembershipTiersPage })))
const Rewards = lazy(() => import('@/pages/ResourcePages').then((m) => ({ default: m.RewardsPage })))
const Coupons = lazy(() => import('@/pages/ResourcePages').then((m) => ({ default: m.CouponsPage })))
const Banners = lazy(() => import('@/pages/ResourcePages').then((m) => ({ default: m.BannersPage })))

/** UI guard mirrors the API's role permissions (the API is the real enforcement). */
function Guard({ perms, children }: { perms: Permission[]; children: ReactNode }) {
  const { can } = useAuth()
  return can(...perms) ? <>{children}</> : <ErrorState error={new Error('forbidden')} />
}

const g = (perms: Permission[], el: ReactNode) => <Guard perms={perms}>{el}</Guard>

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<TableSkeleton />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AdminLayout />}>
            <Route index element={g(['dashboard.view'], <Dashboard />)} />
            <Route path="orders" element={g(['orders.view', 'orders.manage'], <Orders />)} />
            <Route path="orders/:id" element={g(['orders.view', 'orders.manage'], <OrderDetail />)} />
            <Route path="products" element={g(['products.manage'], <Products />)} />
            <Route path="products/:id" element={g(['products.manage'], <ProductEdit />)} />
            <Route path="inventory" element={g(['inventory.manage'], <Inventory />)} />
            <Route path="categories" element={g(['products.manage'], <Categories />)} />
            <Route path="collections" element={g(['products.manage'], <Collections />)} />
            <Route path="reviews" element={g(['reviews.moderate'], <Reviews />)} />
            <Route path="customers" element={g(['customers.view'], <Customers />)} />
            <Route path="customers/:id" element={g(['customers.view'], <CustomerDetail />)} />
            <Route path="membership" element={g(['loyalty.manage'], <Tiers />)} />
            <Route path="points" element={g(['loyalty.manage'], <Points />)} />
            <Route path="rewards" element={g(['loyalty.manage'], <Rewards />)} />
            <Route path="coupons" element={g(['marketing.manage'], <Coupons />)} />
            <Route path="coupons/:id/redemptions" element={g(['marketing.manage'], <CouponRedemptions />)} />
            <Route path="banners" element={g(['marketing.manage'], <Banners />)} />
            <Route path="notifications" element={g(['notifications.send'], <Notifications />)} />
            <Route path="videos" element={g(['content.manage'], <Videos />)} />
            <Route path="videos/:id" element={g(['content.manage'], <VideoEdit />)} />
            <Route path="recipes" element={g(['content.manage'], <Recipes />)} />
            <Route path="recipes/:id" element={g(['content.manage'], <RecipeEdit />)} />
            <Route path="settings" element={g(['settings.manage'], <Settings />)} />
            <Route path="admin-users" element={g(['admins.manage'], <AdminUsers />)} />
            <Route path="audit-logs" element={g(['audit.view'], <AuditLogs />)} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
