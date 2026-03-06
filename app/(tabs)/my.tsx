import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/lib/theme';

export default function MyScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatar} />
        <Text style={styles.name}>초보 웰니서 님</Text>
      </View>
      
      <View style={styles.menuList}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>내 목표 설정</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>알림 설정</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>앱 정보</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  profileSection: { padding: 32, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E0E0E0', marginBottom: 12 },
  name: { fontSize: 20, fontWeight: 'bold' },
  menuList: { padding: 20 },
  menuItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  menuText: { fontSize: 16, color: colors.text }
});
