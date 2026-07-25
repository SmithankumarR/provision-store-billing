import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Searchbar, FAB, Card, Chip, IconButton, useTheme, Surface } from 'react-native-paper';
import { Item } from '../types';
import api from '../services/api';

export const ItemsScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const [items, setItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchItems();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchItems = async (queryStr = searchQuery) => {
    setIsLoading(true);
    try {
      const res = await api.get('/items', { params: { search: queryStr || undefined, limit: 100 } });
      if (res.data.success) {
        setItems(res.data.data.items);
      }
    } catch (err) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (itemId: string) => {
    try {
      const res = await api.patch(`/items/${itemId}/status`);
      if (res.data.success) {
        fetchItems();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar
        placeholder="Search Inventory items..."
        value={searchQuery}
        onChangeText={(text) => {
          setSearchQuery(text);
          fetchItems(text);
        }}
        style={styles.searchBar}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        renderItem={({ item }) => (
          <Surface style={styles.card} elevation={1}>
            <View style={{ flex: 1 }}>
              <View style={styles.row}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{item.name}</Text>
                <Chip compact style={{ height: 26 }} selected={item.status === 'ACTIVE'}>
                  {item.status}
                </Chip>
              </View>
              <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                SKU: {item.sku} {item.barcode ? `| Barcode: ${item.barcode}` : ''}
              </Text>
              <View style={styles.row}>
                <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  Selling: ₹{item.sellingPrice} (MRP: ₹{item.mrp})
                </Text>
                <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: item.currentStock <= item.minimumStock ? theme.colors.error : theme.colors.onSurface }}>
                  Stock: {item.currentStock}
                </Text>
              </View>
            </View>

            <IconButton
              icon={item.status === 'ACTIVE' ? 'eye' : 'eye-off'}
              onPress={() => handleToggleStatus(item._id)}
            />
          </Surface>
        )}
      />

      <FAB
        icon="plus"
        label="Add Item"
        style={styles.fab}
        onPress={() => navigation.navigate('AddItem')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: { margin: 12 },
  card: { padding: 12, borderRadius: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
