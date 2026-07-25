import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, TextInput, Button, Surface, HelperText, useTheme } from 'react-native-paper';
import { useAuthStore } from '../store/useAuthStore';

export const LoginScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const { login, isLoading, error } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [localError, setLocalError] = useState('');

  const handleLogin = async () => {
    if (!identifier.trim()) {
      setLocalError('Please enter email or phone number');
      return;
    }
    if (!password) {
      setLocalError('Please enter password');
      return;
    }
    setLocalError('');

    try {
      await login(identifier, password);
    } catch (err: any) {
      // Error handled by store
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={styles.card} elevation={3}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
            Provision Store POS
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>
            Sign in to start billing & manage inventory
          </Text>
        </View>

        {(error || localError) ? (
          <HelperText type="error" visible={true} style={styles.error}>
            {localError || error}
          </HelperText>
        ) : null}

        <TextInput
          label="Email or Phone Number"
          value={identifier}
          onChangeText={setIdentifier}
          mode="outlined"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          left={<TextInput.Icon icon="account" />}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry={secureText}
          style={styles.input}
          left={<TextInput.Icon icon="lock" />}
          right={
            <TextInput.Icon
              icon={secureText ? 'eye-off' : 'eye'}
              onPress={() => setSecureText(!secureText)}
            />
          }
        />

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={isLoading}
          disabled={isLoading}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Sign In
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate('RegisterStore')}
          style={styles.registerLink}
        >
          New Provision Store? Register Store & Owner Account
        </Button>
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 24,
    borderRadius: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  registerLink: {
    marginTop: 16,
  },
  error: {
    marginBottom: 8,
    fontSize: 14,
  },
});
