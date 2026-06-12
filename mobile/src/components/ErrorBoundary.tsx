import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message ?? '' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>⚠️</Text>
        <Text style={styles.title}>Algo salió mal</Text>
        <Text style={styles.subtitle}>
          Ocurrió un error inesperado.{'\n'}Intentá recargar la aplicación.
        </Text>
        {__DEV__ && this.state.message ? (
          <Text style={styles.devMessage}>{this.state.message}</Text>
        ) : null}
        <TouchableOpacity style={styles.btn} onPress={this.handleRetry}>
          <Text style={styles.btnText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#F9FAFB',
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: {
    fontSize: 22, fontWeight: '700', color: '#111827',
    textAlign: 'center', marginBottom: 10,
  },
  subtitle: {
    fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24,
  },
  devMessage: {
    fontSize: 12, color: '#EF4444', textAlign: 'center',
    backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8,
    marginBottom: 24, fontFamily: 'monospace',
  },
  btn: {
    backgroundColor: '#4F46E5', paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 12,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
