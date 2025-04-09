import { Stack } from 'expo-router';
import AdminProtectedRoute from '../../src/components/AdminProtectedRoute';

export default function AdminLayout() {
  return (
    <AdminProtectedRoute>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="users" />
        <Stack.Screen name="approvals" />
        <Stack.Screen name="settings" />
      </Stack>
    </AdminProtectedRoute>
  );
} 