import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Surface, FAB, Modal, Portal, TextInput, Button, IconButton, useTheme } from 'react-native-paper';
import { Category } from '../types';
import api from '../services/api';

export const CategoriesScreen = () => {
  const theme = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories?status=all');
      if (res.data.success) {
        setCategories(res.data.data.categories);
      }
    } catch (err) {}
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setIsLoading(true);
    try {
      const res = await api.post('/categories', {
        name: newCatName.trim(),
        description: newCatDesc.trim(),
      });
      if (res.data.success) {
        setNewCatName('');
        setNewCatDesc('');
        setIsModalVisible(false);
        fetchCategories();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await api.patch(`/categories/${id}/status`);
      fetchCategories();
    } catch (err) {}
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={categories}
        keyExtractor={(cat) => cat._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        renderItem={({ item }) => (
          <Surface style={styles.card} elevation={1}>
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{item.name}</Text>
              {item.description ? <Text variant="bodySmall" style={{ color: theme.colors.outline }}>{item.description}</Text> : null}
            </View>
            <IconButton
              icon={item.isActive ? 'check-circle' : 'minus-circle-outline'}
              iconColor={item.isActive ? theme.colors.primary : theme.colors.error}
              onPress={() => handleToggleStatus(item._id)}
            />
          </Surface>
        )}
      />

      <FAB
        icon="plus"
        label="New Category"
        style={styles.fab}
        onPress={() => setIsModalVisible(true)}
      />

      <Portal>
        <Modal
          visible={isModalVisible}
          onDismiss={() => setIsModalVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.background }]}
        >
          <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12 }}>Create Category</Text>
          <TextInput label="Category Name *" value={newCatName} onChangeText={setNewCatName} mode="outlined" style={{ marginBottom: 12 }} />
          <TextInput label="Description (Optional)" value={newCatDesc} onChangeText={setNewCatDesc} mode="outlined" style={{ marginBottom: 16 }} />
          <Button mode="contained" onPress={handleCreateCategory} loading={isLoading} disabled={isLoading}>
            Save Category
          </Button>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { padding: 16, borderRadius: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  modal: { padding: 20, margin: 20, borderRadius: 16 },
});
