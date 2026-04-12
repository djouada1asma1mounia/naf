import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import PrivateRoute from './PrivateRoute';
import RoleGuard from './RoleGuard';
import MainLayout from '../layouts/MainLayout';

const ROUTE_PERMISSIONS = {
  materials: [
    'read-materiels',
    'read materiels',
    'read materials',
    'read-materiel',
    'read materiel',
    'read material',
    'read-my-materiels',
    'read my materiels',
    'read my materials',
    'read-my-materials',
  ],
  gdMaterials: ['read-subsidiary', 'read subsidiary', 'read-subsidiaries', 'read subsidiaries'],
  maintenance: ['read-interventions', 'read intervention', 'read interventions'],
  decharges: ['read-decharges', 'read decharges', 'read-decharge', 'read decharge'],
  structures: ['read-departments', 'read department', 'read departments'],
  categories: ['read-categories', 'read categories', 'read-category', 'read category'],
  reasons: ['read-subsidiary', 'read subsidiary', 'read-subsidiaries', 'read subsidiaries'],
  users: ['read-users', 'read users', 'read-user', 'read user'],
  roles: ['read-roles', 'read roles', 'read-role', 'read role'],
  dataTransfer: ['export-all-data', 'export all data'],
};

// Lazy-loaded pages
const Login = lazy(() => import('../pages/auth/Login'));
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const MaterialsList = lazy(() => import('../pages/materials/MaterialsList'));
const GdMaterialsList = lazy(() => import('../pages/gd-materials/GdMaterialsList'));
const MaintenanceList = lazy(() => import('../pages/maintenance/MaintenanceList'));
const DechargesList = lazy(() => import('../pages/decharges/DechargesList'));
const StructuresList = lazy(() => import('../pages/structures/StructuresList'));
const CategoriesList = lazy(() => import('../pages/categories/CategoriesList'));
const ReasonsList = lazy(() => import('../pages/reasons/ReasonsList'));
const UserManagement = lazy(() => import('../pages/parameters/UserManagement'));
const RolesList = lazy(() => import('../pages/roles/RolesList'));
const Profile = lazy(() => import('../pages/parameters/Profile'));
const DataTransfer = lazy(() => import('../pages/parameters/DataTransfer'));

const PageLoader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
    <CircularProgress size={40} />
  </Box>
);

const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route path="dashboard" element={<Dashboard />} />

        <Route
          path="materials"
          element={
            <RoleGuard
              allowedPermissions={ROUTE_PERMISSIONS.materials}
            >
              <MaterialsList />
            </RoleGuard>
          }
        />

        <Route
          path="gd-materials"
          element={
            <RoleGuard
              allowedPermissions={ROUTE_PERMISSIONS.gdMaterials}
            >
              <GdMaterialsList />
            </RoleGuard>
          }
        />

        <Route
          path="maintenance"
          element={
            <RoleGuard allowedPermissions={ROUTE_PERMISSIONS.maintenance}>
              <MaintenanceList />
            </RoleGuard>
          }
        />

        <Route
          path="decharges"
          element={
            <RoleGuard
              allowedPermissions={ROUTE_PERMISSIONS.decharges}
            >
              <DechargesList />
            </RoleGuard>
          }
        />

        <Route
          path="structures"
          element={
            <RoleGuard allowedPermissions={ROUTE_PERMISSIONS.structures}>
              <StructuresList />
            </RoleGuard>
          }
        />

        <Route
          path="categories"
          element={
            <RoleGuard allowedPermissions={ROUTE_PERMISSIONS.categories}>
              <CategoriesList />
            </RoleGuard>
          }
        />

        <Route
          path="reasons"
          element={
            <RoleGuard
              allowedPermissions={ROUTE_PERMISSIONS.reasons}
            >
              <ReasonsList />
            </RoleGuard>
          }
        />

        <Route
          path="users"
          element={
            <RoleGuard allowedPermissions={ROUTE_PERMISSIONS.users}>
              <UserManagement />
            </RoleGuard>
          }
        />

        <Route
          path="roles"
          element={
            <RoleGuard allowedPermissions={ROUTE_PERMISSIONS.roles}>
              <RolesList />
            </RoleGuard>
          }
        />

        <Route
          path="data-transfer"
          element={
            <RoleGuard allowedPermissions={ROUTE_PERMISSIONS.dataTransfer}>
              <DataTransfer />
            </RoleGuard>
          }
        />

        <Route path="profile" element={<Profile />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
