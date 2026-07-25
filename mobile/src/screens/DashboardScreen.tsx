import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Surface, Card, useTheme, ActivityIndicator, Divider } from 'react-native-paper';
import { DashboardSummary } from '../types';
import api from '../services/api';

export const DashboardScreen = () => {
  const theme = useTheme();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/dashboard/summary');
      if (res.data.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !summary) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchDashboardData} />}
    >
      <Text variant="headlineSmall" style={[styles.pageTitle, { color: theme.colors.primary }]}>
        Store Performance Dashboard
      </Text>

      {/* KPI Cards Grid */}
      <View style={styles.grid}>
        <Card style={styles.kpiCard}>
          <Card.Content>
            <Text variant="labelMedium" style={{ color: theme.colors.outline }}>Today's Revenue</Text>
            <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
              ₹{summary?.todayRevenue || 0}
            </Text>
            <Text variant="bodySmall">{summary?.todayBillsCount || 0} Bills today</Text>
          </Card.Content>
        </Card>

        <Card style={styles.kpiCard}>
          <Card.Content>
            <Text variant="labelMedium" style={{ color: theme.colors.outline }}>Avg Bill Value</Text>
            <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.secondary }}>
              ₹{summary?.averageBillValue || 0}
            </Text>
            <Text variant="bodySmall">Per transaction</Text>
          </Card.Content>
        </Card>

        <Card style={styles.kpiCard}>
          <Card.Content>
            <Text variant="labelMedium" style={{ color: theme.colors.outline }}>Monthly Revenue</Text>
            <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
              ₹{summary?.monthlySales || 0}
            </Text>
            <Text variant="bodySmall">This month</Text>
          </Card.Content>
        </Card>

        <Card style={styles.kpiCard}>
          <Card.Content>
            <Text variant="labelMedium" style={{ color: theme.colors.outline }}>Monthly Profit</Text>
            <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: '#16a34a' }}>
              ₹{summary?.monthlyProfit || 0}
            </Text>
            <Text variant="bodySmall">Est. Net Profit</Text>
          </Card.Content>
        </Card>

        <Card style={styles.kpiCard}>
          <Card.Content>
            <Text variant="labelMedium" style={{ color: theme.colors.outline }}>Inventory Valuation</Text>
            <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
              ₹{summary?.totalInventoryValue || 0}
            </Text>
            <Text variant="bodySmall">Total Cost Price</Text>
          </Card.Content>
        </Card>

        <Card style={[styles.kpiCard, (summary?.lowStockCount || 0) > 0 && { borderColor: theme.colors.error, borderWidth: 1 }]}>
          <Card.Content>
            <Text variant="labelMedium" style={{ color: theme.colors.outline }}>Low Stock Alert</Text>
            <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: (summary?.lowStockCount || 0) > 0 ? theme.colors.error : theme.colors.onSurface }}>
              {summary?.lowStockCount || 0}
            </Text>
            <Text variant="bodySmall">Items below min stock</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Recent Bills List */}
      <Surface style={styles.recentSection} elevation={2}>
        <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12 }}>
          Recent Transactions
        </Text>
        {summary?.recentBills.map((bill) => (
          <View key={bill._id}>
            <View style={styles.billRow}>
              <View>
                <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>{bill.invoiceNumber}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                  {new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {bill.paymentMethod}
                </Text>
              </View>
              <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                ₹{bill.grandTotal}
              </Text>
            </View>
            <Divider style={{ marginVertical: 8 }} />
          </View>
        ))}
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageTitle: { fontWeight: 'bold', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  kpiCard: { width: '48%', margin: '1%', borderRadius: 12 },
  recentSection: { padding: 16, borderRadius: 12, marginTop: 16 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
