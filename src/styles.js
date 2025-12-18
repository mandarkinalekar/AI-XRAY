// src/styles.js
import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#3b82f6',
  danger: '#ef4444',
  text: '#111827',
  muted: '#6b7280',
  background: '#f8fafc'
};

export default StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  input: { borderWidth: 1, borderColor: '#e5e7eb', padding: 12, borderRadius: 8, marginBottom: 10, backgroundColor: '#fff' },
  button: { backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#93c5fd' },
  buttonText: { color: '#fff', fontWeight: '600' },
  errorText: { color: colors.danger, marginBottom: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  card: { padding: 12, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', marginBottom: 10 },
  fileName: { fontWeight: '600' },
  fileDate: { color: colors.muted, marginTop: 6 }
});
