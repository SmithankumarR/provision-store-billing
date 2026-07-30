import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Surface, HelperText, useTheme, IconButton } from 'react-native-paper';
import { Category } from '../types';
import api from '../services/api';

export const AddItemScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  // Minimal Inputs
  const [name, setName] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [currentStock, setCurrentStock] = useState('100');

  // Optional Advanced Toggle & Inputs
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [gstPercentage, setGstPercentage] = useState('0');

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
    if (!name.trim()) {
      setError('Please enter item name');
      return;
    }
    if (!sellingPrice || isNaN(Number(sellingPrice)) || Number(sellingPrice) <= 0) {
      setError('Please enter a valid price');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const res = await api.post('/items', {
        name: name.trim(),
        sellingPrice: parseFloat(sellingPrice),
        currentStock: parseInt(currentStock, 10) || 100,
        categoryId: selectedCategoryId || undefined,
        sku: sku.trim() || undefined,
        barcode: barcode.trim() || undefined,
        costPrice: costPrice ? parseFloat(costPrice) : undefined,
        mrp: mrp ? parseFloat(mrp) : undefined,
        gstPercentage: gstPercentage ? parseFloat(gstPercentage) : 0,
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
        <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginBottom: 6, color: theme.colors.primary }}>
          Quick Add Item
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.outline, marginBottom: 16 }}>
          Enter item name and price to start billing immediately
        </Text>

        {error ? <HelperText type="error" visible={true} style={{ marginBottom: 8 }}>{error}</HelperText> : null}

        {/* Minimal Core Fields */}
        <TextInput
          label="Item Name *"
          value={name}
          onChangeText={setName}
          mode="outlined"
          placeholder="e.g. Basmati Rice 5kg, Sugar 1kg"
          style={styles.input}
        />

        <TextInput
          label="Item Price (₹) *"
          value={sellingPrice}
          onChangeText={setSellingPrice}
          mode="outlined"
          keyboardType="numeric"
          placeholder="e.g. 250"
          style={styles.input}
        />

        <TextInput
          label="Initial Stock Quantity"
          value={currentStock}
          onChangeText={setCurrentStock}
          mode="outlined"
          keyboardType="numeric"
          placeholder="Default: 100"
          style={styles.input}
        />

        {/* Expandable Optional Details */}
        <TouchableOpacity
          onPress={() => setShowAdvanced(!showAdvanced)}
          style={styles.advancedToggle}
        >
          <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
            {showAdvanced ? '➖ Hide Optional Details' : '➕ Optional Details (GST, Barcode, Cost Price)'}
          </Text>
        </TouchableOpacity>

        {showAdvanced ? (
          <View style={styles.advancedSection}>
            <TextInput
              label="Barcode / Scanner Code (Optional)"
              value={barcode}
              onChangeText={setBarcode}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              label="Custom SKU Code (Optional)"
              value={sku}
              onChangeText={setSku}
              mode="outlined"
              autoCapitalize="characters"
              style={styles.input}
            />

            <View style={styles.row}>
              <TextInput
                label="MRP (₹)"
                value={mrp}
                onChangeText={setMrp}
                mode="outlined"
                keyboardType="numeric"
                style={[styles.input, { flex: 1, marginRight: 6 }]}
              />
              <TextInput
                label="Cost Price (₹)"
                value={costPrice}
                onChangeText={setCostPrice}
                mode="outlined"
                keyboardType="numeric"
                style={[styles.input, { flex: 1, marginLeft: 6 }]}
              />
            </View>

            <TextInput
              label="GST %"
              value={gstPercentage}
              onChangeText={setGstPercentage}
              mode="outlined"
              keyboardType="numeric"
              placeholder="Default: 0%"
              style={styles.input}
            />
          </View>
        ) : null}

        <Button
          mode="contained"
          onPress={handleSaveItem}
          loading={isLoading}
          disabled={isLoading}
          style={styles.button}
          contentStyle={{ paddingVertical: 6 }}
        >
          Save & Add to Catalog
        </Button>
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16 },
  card: { padding: 20, borderRadius: 16 },
  input: { marginBottom: 14 },
  row: { flexDirection: 'row' },
  button: { marginTop: 16, borderRadius: 8 },
  advancedToggle: { paddingVertical: 10, marginVertical: 4 },
  advancedSection: { marginTop: 8, paddingTop: 12, borderTopWidth: 0.5, borderColor: '#ccc' },
});
