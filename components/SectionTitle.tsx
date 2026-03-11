import { Text, StyleSheet } from 'react-native';
import { atelierText } from '@/lib/atelierTheme';

export function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.title}>{title}</Text>;
}

const styles = StyleSheet.create({
  title: {
    ...atelierText.cardTitleMd,
    fontSize: 17,
    marginTop: 14,
  }
});
