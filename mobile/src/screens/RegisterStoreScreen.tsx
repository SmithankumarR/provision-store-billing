import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Surface, HelperText, useTheme } from 'react-native-paper';
import { useAuthStore } from '../store/useAuthStore';

export const RegisterStoreScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const { registerStore, isLoading, error } = useAuthStore();

  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleRegister = async () => {
    if (!storeName || !storeAddress || !storePhone || !ownerName || !ownerEmail || !ownerPhone || !password) {
      setLocalError('Please fill in all required fields');
      return;
    }
    setLocalError('');

    try {
      await registerStore({
        storeName,
        storeAddress,
        storePhone,
        gstNumber,
        ownerName,
        ownerEmail,
        ownerPhone,
        password,
      });
    } catch (err) {}
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={styles.card} elevation={3}>
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.primary }]}>
          Register Provision Store
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.outline, marginBottom: 16 }}>
          Set up your store details and primary owner login
        </Text>

        {(error || localError) ? (
          <HelperText type="error" visible={true} style={{ marginBottom: 8 }}>
            {localError || error}
          </HelperText>
        ) : null}

        <Text variant="titleSmall" style={styles.sectionHeader}>Store Information</Text>
        <TextInput label="Store Name *" value={storeName} onChangeText={setStoreName} mode="outlined" style={styles.input} />
        <TextInput label="Store Address *" value={storeAddress} onChangeText={setStoreAddress} mode="outlined" style={styles.input} />
        <TextInput label="Store Phone *" value={storePhone} onChangeText={setStorePhone} mode="outlined" keyboardType="phone-pad" style={styles.input} />
        <TextInput label="GST Number (Optional)" value={gstNumber} onChangeText={setGstNumber} mode="outlined" autoCapitalize="characters" style={styles.input} />

        <Text variant="titleSmall" style={styles.sectionHeader}>Owner Profile</Text>
        <TextInput label="Owner Full Name *" value={ownerName} onChangeText={setOwnerName} mode="outlined" style={styles.input} />
        <TextInput label="Owner Email *" value={ownerEmail} onChangeText={setOwnerEmail} mode="outlined" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
        <TextInput label="Owner Phone *" value={ownerPhone} onChangeText={setOwnerPhone} mode="outlined" keyboardType="phone-pad" style={styles.input} />
        <TextInput label="Password *" value={password} onChangeText={setPassword} mode="outlined" secureTextEntry style={styles.input} />

        <Button mode="contained" onPress={handleRegister} loading={isLoading} disabled={isLoading} style={styles.button}>
          Create Store & Register
        </Button>

        <Button mode="text" onPress={() => navigation.navigate('Login')} style={{ marginTop: 8 }}>
          Already have an account? Sign In
        </Button>
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, justifyContent: 'center' },
  card: { padding: 20, borderRadius: 16 },
  title: { fontWeight: 'bold' },
  sectionHeader: { marginTop: 12, marginBottom: 8, fontWeight: 'bold' },
  input: { marginBottom: 12 },
  button: { marginTop: 12, borderRadius: 8 },
});
