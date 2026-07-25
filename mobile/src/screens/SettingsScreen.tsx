import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, TextInput, Button, Switch, SegmentedButtons, Divider, useTheme, Modal, Portal, ActivityIndicator, List } from 'react-native-paper';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import blePrinterService from '../services/blePrinterService';

export const SettingsScreen = () => {
  const theme = useTheme();
  const { store, user, logout, updateStoreProfile } = useAuthStore();
  const settings = useSettingsStore();

  const [name, setName] = useState(store?.name || '');
  const [address, setAddress] = useState(store?.address || '');
  const [phone, setPhone] = useState(store?.phone || '');
  const [gstNumber, setGstNumber] = useState(store?.gstNumber || '');
  const [footerMessage, setFooterMessage] = useState(store?.footerMessage || '');
  const [receiptWidth, setReceiptWidth] = useState<58 | 80>(store?.receiptWidth || 58);
  const [isSaving, setIsSaving] = useState(false);

  // Bluetooth Printer Scanner Modal
  const [isPrinterModalVisible, setIsPrinterModalVisible] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedDevices, setScannedDevices] = useState<any[]>([]);

  useEffect(() => {
    if (store) {
      setName(store.name);
      setAddress(store.address);
      setPhone(store.phone);
      setGstNumber(store.gstNumber || '');
      setFooterMessage(store.footerMessage || '');
      setReceiptWidth(store.receiptWidth || 58);
    }
  }, [store]);

  const handleSaveStoreProfile = async () => {
    setIsSaving(true);
    try {
      await updateStoreProfile({
        name,
        address,
        phone,
        gstNumber,
        footerMessage,
        receiptWidth,
      });
      alert('Store profile updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update store settings');
    } finally {
      setIsSaving(false);
    }
  };

  const startBleScan = () => {
    setScannedDevices([]);
    setIsScanning(true);
    blePrinterService.scanForPrinters((device) => {
      setScannedDevices((prev) => {
        if (prev.find((d) => d.id === device.id)) return prev;
        return [...prev, device];
      });
    });
  };

  const handleConnectPrinter = async (device: any) => {
    try {
      await blePrinterService.connect(device.id);
      settings.setPrinter(device.name || 'Thermal Printer', device.id);
      setIsPrinterModalVisible(false);
      alert(`Connected to Bluetooth printer: ${device.name || device.id}`);
    } catch (err: any) {
      alert('Failed to connect to Bluetooth printer');
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginBottom: 16, color: theme.colors.primary }}>
        Store & App Settings
      </Text>

      {/* Store Profile Section (Owner Only) */}
      {user?.role === 'OWNER' ? (
        <Surface style={styles.card} elevation={2}>
          <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12 }}>
            Store Header & Receipt Info
          </Text>

          <TextInput label="Store Name *" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
          <TextInput label="Address *" value={address} onChangeText={setAddress} mode="outlined" multiline style={styles.input} />
          <TextInput label="Phone *" value={phone} onChangeText={setPhone} mode="outlined" keyboardType="phone-pad" style={styles.input} />
          <TextInput label="GSTIN Number" value={gstNumber} onChangeText={setGstNumber} mode="outlined" autoCapitalize="characters" style={styles.input} />
          <TextInput label="Footer Receipt Message" value={footerMessage} onChangeText={setFooterMessage} mode="outlined" style={styles.input} />

          <Text variant="titleSmall" style={{ fontWeight: 'bold', marginTop: 8, marginBottom: 6 }}>
            Receipt Paper Width Format
          </Text>
          <SegmentedButtons
            value={String(receiptWidth)}
            onValueChange={(val) => setReceiptWidth(parseInt(val, 10) as 58 | 80)}
            buttons={[
              { value: '58', label: '58 mm (Standard)' },
              { value: '80', label: '80 mm (Wide)' },
            ]}
            style={{ marginBottom: 16 }}
          />

          <Button mode="contained" onPress={handleSaveStoreProfile} loading={isSaving} disabled={isSaving}>
            Save Store Settings
          </Button>
        </Surface>
      ) : null}

      {/* Bluetooth Printer Pairing */}
      <Surface style={styles.card} elevation={2}>
        <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 6 }}>
          Bluetooth ESC/POS Printer
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.outline, marginBottom: 12 }}>
          {settings.bluetoothPrinterName
            ? `Paired Device: ${settings.bluetoothPrinterName}`
            : 'No Bluetooth thermal printer paired.'}
        </Text>

        <Button
          mode="outlined"
          icon="bluetooth"
          onPress={() => {
            setIsPrinterModalVisible(true);
            startBleScan();
          }}
        >
          {settings.bluetoothPrinterName ? 'Change Bluetooth Printer' : 'Scan & Pair Bluetooth Printer'}
        </Button>
      </Surface>

      {/* App Preferences */}
      <Surface style={styles.card} elevation={2}>
        <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12 }}>
          App Preferences
        </Text>

        <View style={styles.switchRow}>
          <Text variant="bodyLarge">Dark Mode Theme</Text>
          <Switch value={settings.darkMode} onValueChange={settings.setDarkMode} />
        </View>

        <Divider style={{ marginVertical: 8 }} />

        <View style={styles.switchRow}>
          <Text variant="bodyLarge">Auto Print Receipt After Sale</Text>
          <Switch value={settings.autoPrintReceipt} onValueChange={settings.setAutoPrintReceipt} />
        </View>
      </Surface>

      {/* Account / Logout */}
      <Surface style={styles.card} elevation={2}>
        <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>Signed in as {user?.name}</Text>
        <Text variant="bodySmall" style={{ color: theme.colors.outline, marginBottom: 12 }}>
          Role: {user?.role} | Email: {user?.email}
        </Text>

        <Button mode="contained-tonal" icon="logout" onPress={logout} buttonColor={theme.colors.errorContainer}>
          Logout Account
        </Button>
      </Surface>

      {/* BLE Printer Scanner Modal */}
      <Portal>
        <Modal
          visible={isPrinterModalVisible}
          onDismiss={() => {
            blePrinterService.stopScan();
            setIsPrinterModalVisible(false);
          }}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.background }]}
        >
          <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12 }}>
            Bluetooth Thermal Printers
          </Text>

          {isScanning ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <ActivityIndicator size="small" style={{ marginRight: 8 }} />
              <Text variant="bodySmall">Scanning for nearby Bluetooth devices...</Text>
            </View>
          ) : null}

          {scannedDevices.map((dev) => (
            <List.Item
              key={dev.id}
              title={dev.name || 'Unknown Printer'}
              description={`ID: ${dev.id}`}
              left={(props) => <List.Icon {...props} icon="printer" />}
              onPress={() => handleConnectPrinter(dev)}
            />
          ))}

          <Button
            mode="contained"
            onPress={() => {
              blePrinterService.stopScan();
              setIsPrinterModalVisible(false);
            }}
            style={{ marginTop: 12 }}
          >
            Close
          </Button>
        </Modal>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: { padding: 16, borderRadius: 16, marginBottom: 16 },
  input: { marginBottom: 12 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  modal: { padding: 20, margin: 20, borderRadius: 16 },
});
