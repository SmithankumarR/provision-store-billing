import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Surface, HelperText, useTheme } from 'react-native-paper';
import { Category } from '../types';
import api from '../services/api';

export const AddItemScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [gstPercentage, setGstPercentage] = useState('0');
  const [currentStock, setCurrentStock] = useState('10');
  const [minimumStock, setMinimumStock] = useState('5');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories?status=active');
      if (res.data.success && res.data.data.categories.length > 0) {
        setCategories(res.data.data.categories);
        setSelectedCategoryId(res.data.data.categories[0]._id);
      }
    } catch (err) {}
  };

  const handleSaveItem = async () => {
    if (!name || !sellingPrice || !costPrice || !mrp || !selectedCategoryId) {
      setError('Please fill in all required fields');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const res = await api.post('/items', {
        name,
        categoryId: selectedCategoryId,
        sku: sku || undefined,
        barcode: barcode || undefined,
        sellingPrice: parseFloat(sellingPrice),
        costPrice: parseFloat(costPrice),
        mrp: parseFloat(mrp),
        gstPercentage: parseFloat(gstPercentage) || 0,
        currentStock: parseInt(currentStock, 10) || 0,
        minimumStock: parseInt(minimumStock, 10) || 5,
      });

      if (res.data.success) {
        navigation.goBack();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save item');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={styles.card} elevation={2}>
        <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginBottom: 16 }}>
          Add New Product Item
        </Text>

        {error ? <HelperText type="error" visible={true}>{error}</HelperText> : null}

        <TextInput label="Item Name *" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
        <TextInput label="SKU (Optional auto-generated)" value={sku} onChangeText={setSku} mode="outlined" autoCapitalize="characters" style={styles.input} />
        <TextInput label="Barcode Number (Optional)" value={barcode} onChangeText={setBarcode} mode="outlined" keyboardType="numeric" style={styles.input} />

        <View style={styles.row}>
          <TextInput label="Selling Price *" value={sellingPrice} onChangeText={setSellingPrice} mode="outlined" keyboardType="numeric" style={[styles.input, { flex: 1, marginRight: 6 }]} />
          <TextInput label="MRP *" value={mrp} onChangeText={setMrp} mode="outlined" keyboardType="numeric" style={[styles.input, { flex: 1, marginLeft: 6 }]} />
        </View>

        <View style={styles.row}>
          <TextInput label="Cost Price *" value={costPrice} onChangeText={setCostPrice} mode="outlined" keyboardType="numeric" style={[styles.input, { flex: 1, marginRight: 6 }]} />
          <TextInput label="GST %" value={gstPercentage} onChangeText={setGstPercentage} mode="outlined" keyboardType="numeric" style={[styles.input, { flex: 1, marginLeft: 6 }]} />
        </View>

        <View style={styles.row}>
          <TextInput label="Current Stock *" value={currentStock} onChangeText={setCurrentStock} mode="outlined" keyboardType="numeric" style={[styles.input, { flex: 1, marginRight: 6 }]} />
          <TextInput label="Min Stock Alert *" value={minimumStock} onChangeText={setMinimumStock} mode="outlined" keyboardType="numeric" style={[styles.input, { flex: 1, marginLeft: 6 }]} />
        </View>

        <Button mode="contained" onPress={handleSaveItem} loading={isLoading} disabled={isLoading} style={styles.button}>
          Save Product Item
        </Button>
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16 },
  card: { padding: 20, borderRadius: 16 },
  input: { marginBottom: 12 },
  row: { flexDirection: 'row' },
  button: { marginTop: 12, borderRadius: 8 },
});
