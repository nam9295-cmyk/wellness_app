import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { colors } from '@/lib/theme';
import { useStore } from '@/lib/store';

export default function MyScreen() {
  const { userSettings } = useStore();

  const handleEdit = () => {
    Alert.alert('알림', '설정 수정 기능은 준비 중입니다.');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{userSettings?.nickname?.[0] || '?'}</Text>
        </View>
        <Text style={styles.name}>{userSettings?.nickname || '초보 웰니서'} 님</Text>
        <Text style={styles.goalText}>목표: {userSettings?.goal || '설정 필요'}</Text>
      </View>
      
      <View style={styles.menuList}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>나의 설정 내용</Text>
          <TouchableOpacity onPress={handleEdit}>
            <Text style={styles.editButtonText}>수정</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>알림 시간</Text>
          <Text style={styles.settingValue}>{userSettings?.notificationTime || '설정 안 함'}</Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>생리주기 트래킹</Text>
          <Text style={styles.settingValue}>{userSettings?.useMenstrualCycle ? '사용 중' : '사용 안 함'}</Text>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
          <Text style={styles.menuText}>내 정보 수정하기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>앱 정보 (v1.0.0)</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  profileSection: { 
    padding: 32, 
    alignItems: 'center', 
    backgroundColor: '#fff',
    borderBottomWidth: 1, 
    borderBottomColor: colors.border,
    paddingTop: 48,
  },
  avatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: colors.primaryLight, 
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary
  },
  name: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  goalText: { fontSize: 14, color: colors.textLight },
  menuList: { padding: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  editButtonText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  settingItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 14,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  settingLabel: { fontSize: 15, color: '#4B5563' },
  settingValue: { fontSize: 15, fontWeight: '500', color: colors.primary },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 24 },
  menuItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuText: { fontSize: 16, color: '#4B5563' }
});
