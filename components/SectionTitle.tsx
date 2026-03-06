import { Text, StyleSheet } from 'react-native';
import { colors } from '@/lib/theme';

export function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.title}>{title}</Text>;
}

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
  }
});
