import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Surface, SegmentedButtons, Card, useTheme, ActivityIndicator, Divider } from 'react-native-paper';
import api from '../services/api';

export const ReportsScreen = () => {
  const theme = useTheme();
  const [period, setPeriod] = useState<'today' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [report, setReport] = useState<any>(null);
  const [itemPerf, setItemPerf] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [period]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const [salesRes, perfRes] = await Promise.all([
        api.get(`/reports/sales?period=${period}`),
        api.get(`/reports/items-performance?period=${period}`),
      ]);
      if (salesRes.data.success) setReport(salesRes.data.data);
      if (perfRes.data.success) setItemPerf(perfRes.data.data);
    } catch (err) {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchReports} />}
    >
      <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginBottom: 12, color: theme.colors.primary }}>
        Sales & Financial Reports
      </Text>

      <SegmentedButtons
        value={period}
        onValueChange={(val: any) => setPeriod(val)}
        buttons={[
          { value: 'today', label: 'Today' },
          { value: 'weekly', label: '7 Days' },
          { value: 'monthly', label: 'Month' },
          { value: 'yearly', label: 'Year' },
        ]}
        style={{ marginBottom: 16 }}
      />

      {isLoading && !report ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      ) : (
        <View>
          {/* Revenue & Profit Cards */}
          <Surface style={styles.summaryCard} elevation={3}>
            <Text variant="titleMedium" style={{ color: theme.colors.outline }}>Total Revenue</Text>
            <Text variant="displaySmall" style={{ fontWeight: 'bold', color: theme.colors.primary, marginVertical: 4 }}>
              ₹{report?.totalRevenue || 0}
            </Text>

            <Divider style={{ marginVertical: 12 }} />

            <View style={styles.row}>
              <View>
                <Text variant="bodySmall">Total Bills Count</Text>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{report?.totalBillsCount || 0}</Text>
              </View>
              <View>
                <Text variant="bodySmall">Estimated Net Profit</Text>
                <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#16a34a' }}>₹{report?.netProfit || 0}</Text>
              </View>
            </View>

            <Divider style={{ marginVertical: 12 }} />

            <View style={styles.row}>
              <View>
                <Text variant="bodySmall">Discounts Given</Text>
                <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: theme.colors.error }}>-₹{report?.totalDiscount || 0}</Text>
              </View>
              <View>
                <Text variant="bodySmall">GST Collected</Text>
                <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>+₹{report?.totalTax || 0}</Text>
              </View>
              <View>
                <Text variant="bodySmall">Cost of Goods (COGS)</Text>
                <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>₹{report?.estimatedCOGS || 0}</Text>
              </View>
            </View>
          </Surface>

          {/* Top Selling Items */}
          <Surface style={styles.section} elevation={2}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12 }}>
              Top Selling Products ({period.toUpperCase()})
            </Text>
            {itemPerf?.topSellingItems.map((item: any, idx: number) => (
              <View key={item._id} style={styles.itemRow}>
                <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>#{idx + 1} {item.itemName}</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  {item.totalQty} Units (₹{item.totalRevenue})
                </Text>
              </View>
            ))}
          </Surface>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  summaryCard: { padding: 20, borderRadius: 16, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  section: { padding: 16, borderRadius: 12, marginBottom: 16 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderColor: '#eee' },
});
