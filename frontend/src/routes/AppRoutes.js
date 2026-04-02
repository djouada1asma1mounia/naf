import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import PrivateRoute from './PrivateRoute';
import RoleGuard from './RoleGuard';
import MainLayout from '../layouts/MainLayout';
import { ROLES } from '../context/AuthContext';

// Lazy-loaded pages
const Login = lazy(() => import('../pages/auth/Login'));
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const MaterialsList = lazy(() => import('../pages/materials/MaterialsList'));
const GdMaterialsList = lazy(() => import('../pages/gd-materials/GdMaterialsList'));
const MaintenanceList = lazy(() => import('../pages/maintenance/MaintenanceList'));
const StructuresList = lazy(() => import('../pages/structures/StructuresList'));
const CategoriesList = lazy(() => import('../pages/categories/CategoriesList'));
const ReasonsList = lazy(() => import('../pages/reasons/ReasonsList'));
const UserManagement = lazy(() => import('../pages/parameters/UserManagement'));
const RolesList = lazy(() => import('../pages/roles/RolesList'));
const Profile = lazy(() => import('../pages/parameters/Profile'));
const Reports = lazy(() => import('../pages/reports/Reports'));

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
            <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.USER]}>
              <MaterialsList />
            </RoleGuard>
          }
        />

        <Route
          path="gd-materials"
          element={
            <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.USER]}>
              <GdMaterialsList />
            </RoleGuard>
          }
        />

        <Route
          path="maintenance"
          element={
            <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.USER]}>
              <MaintenanceList />
            </RoleGuard>
          }
        />

        <Route
          path="structures"
          element={
            <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.USER]}>
              <StructuresList />
            </RoleGuard>
          }
        />

        <Route
          path="categories"
          element={
            <RoleGuard allowedRoles={[ROLES.ADMIN]}>
              <CategoriesList />
            </RoleGuard>
          }
        />

        <Route
          path="reasons"
          element={
            <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.USER]}>
              <ReasonsList />
            </RoleGuard>
          }
        />

        <Route
          path="users"
          element={
            <RoleGuard allowedRoles={[ROLES.ADMIN]}>
              <UserManagement />
            </RoleGuard>
          }
        />

        <Route
          path="roles"
          element={
            <RoleGuard allowedRoles={[ROLES.ADMIN]}>
              <RolesList />
            </RoleGuard>
          }
        />

        <Route
          path="reports"
          element={
            <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.USER]}>
              <Reports />
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
