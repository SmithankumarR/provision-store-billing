import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

import { useAuthStore } from '../store/useAuthStore';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterStoreScreen } from '../screens/RegisterStoreScreen';
import { BillingScreen } from '../screens/BillingScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ItemsScreen } from '../screens/ItemsScreen';
import { AddItemScreen } from '../screens/AddItemScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const OwnerTabs = () => {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: '#fff',
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="view-dashboard" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Billing"
        component={BillingScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="calculator" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={ItemsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="package-variant-closed" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="chart-bar" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="cog" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};

const BillerTabs = () => {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: '#fff',
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
      }}
    >
      <Tab.Screen
        name="Billing"
        component={BillingScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="calculator" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="cog" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="RegisterStore" component={RegisterStoreScreen} />
          </>
        ) : (
          <>
            {user?.role === 'OWNER' ? (
              <Stack.Screen name="MainOwner" component={OwnerTabs} />
            ) : (
              <Stack.Screen name="MainBiller" component={BillerTabs} />
            )}
            <Stack.Screen name="AddItem" component={AddItemScreen} options={{ headerShown: true, title: 'Add New Product' }} />
            <Stack.Screen name="Categories" component={CategoriesScreen} options={{ headerShown: true, title: 'Manage Categories' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
