import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Mail,
  Target,
  Wallet,
  Shield,
  TrendingUp,
  Sparkles,
  Check,
  Edit3,
  BarChart3,
  Clock,
  LogOut,
  Briefcase,
  CalendarDays,
  PiggyBank,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { UserProfile } from '@/types';
import { riskLabels } from '@/constants/mockData';

export default function ProfileScreen() {
  const { profile, saveProfile, analysisHistory, logout } = useUser();
  const [isEditing, setIsEditing] = useState(!profile?.occupation);
  const [name, setName] = useState(profile?.name || '');
  const [email, _setEmail] = useState(profile?.email || '');
  const [riskTolerance, setRiskTolerance] = useState<'low' | 'medium' | 'high'>(
    profile?.riskTolerance || 'medium'
  );
  const [investmentGoal, setInvestmentGoal] = useState(profile?.investmentGoal || '');
  const [monthlyIncome, setMonthlyIncome] = useState(
    profile?.monthlyIncome ? profile.monthlyIncome.toLocaleString('tr-TR') : ''
  );
  const [investmentBudget, setInvestmentBudget] = useState(
    profile?.investmentBudget ? profile.investmentBudget.toLocaleString('tr-TR') : ''
  );
  const [occupation, setOccupation] = useState(profile?.occupation || '');
  const [age, setAge] = useState(profile?.age || '');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Lütfen adınızı girin.');
      return;
    }

    const incomeNum = Number(monthlyIncome.replace(/[^0-9]/g, '')) || 0;
    const budgetNum = Number(investmentBudget.replace(/[^0-9]/g, '')) || 0;

    const newProfile: UserProfile = {
      name: name.trim(),
      email: email.trim(),
      riskTolerance,
      investmentGoal: investmentGoal.trim(),
      monthlyIncome: incomeNum,
      investmentBudget: budgetNum,
      occupation: occupation.trim(),
      age: age.trim(),
      createdAt: profile?.createdAt || new Date().toISOString(),
    };

    saveProfile(newProfile);
    setIsEditing(false);
  }, [name, email, riskTolerance, investmentGoal, monthlyIncome, investmentBudget, occupation, age, profile, saveProfile]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleIncomeChange = useCallback((text: string) => {
    const num = text.replace(/[^0-9]/g, '');
    if (!num) { setMonthlyIncome(''); return; }
    setMonthlyIncome(Number(num).toLocaleString('tr-TR'));
  }, []);

  const handleBudgetChange = useCallback((text: string) => {
    const num = text.replace(/[^0-9]/g, '');
    if (!num) { setInvestmentBudget(''); return; }
    setInvestmentBudget(Number(num).toLocaleString('tr-TR'));
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Çıkış Yap', style: 'destructive', onPress: () => logout() },
      ]
    );
  }, [logout]);

  const goals = [
    'Emeklilik', 'Ev Alma', 'Eğitim', 'Birikim', 'Pasif Gelir', 'Kısa Vadeli Kazanç',
  ];

  const totalAnalyses = analysisHistory.length;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={[styles.headerSection, { opacity: fadeAnim }]}>
              <View style={styles.headerRow}>
                <Text style={styles.title}>Profil</Text>
                <View style={styles.headerActions}>
                  {profile && !isEditing && (
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={handleEdit}
                      activeOpacity={0.7}
                    >
                      <Edit3 color={Colors.dark.primary} size={18} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                  >
                    <LogOut color={Colors.dark.danger} size={18} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {profile?.name
                      ? profile.name.charAt(0).toUpperCase()
                      : '?'}
                  </Text>
                </View>
                {profile && (
                  <View style={styles.avatarInfo}>
                    <Text style={styles.avatarName}>{profile.name}</Text>
                    {profile.email ? (
                      <Text style={styles.avatarEmail}>{profile.email}</Text>
                    ) : null}
                    {profile.occupation ? (
                      <Text style={styles.avatarOccupation}>{profile.occupation}</Text>
                    ) : null}
                  </View>
                )}
              </View>

              {profile && !isEditing && (
                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <BarChart3 color={Colors.dark.primary} size={18} />
                    <Text style={styles.statValue}>{totalAnalyses}</Text>
                    <Text style={styles.statLabel}>Analiz</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Shield
                      color={
                        profile.riskTolerance === 'low'
                          ? Colors.dark.riskLow
                          : profile.riskTolerance === 'medium'
                          ? Colors.dark.riskMedium
                          : Colors.dark.riskHigh
                      }
                      size={18}
                    />
                    <Text style={styles.statValue}>
                      {riskLabels[profile.riskTolerance]}
                    </Text>
                    <Text style={styles.statLabel}>Risk</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Clock color={Colors.dark.accent} size={18} />
                    <Text style={styles.statValue}>
                      {new Date(profile.createdAt).toLocaleDateString('tr-TR', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.statLabel}>Üyelik</Text>
                  </View>
                </View>
              )}
            </Animated.View>

            {isEditing ? (
              <Animated.View style={[styles.formSection, { opacity: fadeAnim }]}>
                <Text style={styles.sectionTitle}>
                  {profile?.occupation ? 'Profili Düzenle' : 'Profilinizi Tamamlayın'}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Bilgilerinizi doldurarak size özel yatırım önerileri alın
                </Text>

                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <User color={Colors.dark.textMuted} size={16} />
                    <Text style={styles.inputLabel}>Adınız *</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Adınızı girin"
                    placeholderTextColor={Colors.dark.textMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <Mail color={Colors.dark.textMuted} size={16} />
                    <Text style={styles.inputLabel}>E-posta</Text>
                  </View>
                  <TextInput
                    style={[styles.input, styles.inputDisabled]}
                    value={email}
                    editable={false}
                    placeholderTextColor={Colors.dark.textMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <CalendarDays color={Colors.dark.textMuted} size={16} />
                    <Text style={styles.inputLabel}>Yaşınız</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={age}
                    onChangeText={setAge}
                    placeholder="25"
                    placeholderTextColor={Colors.dark.textMuted}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <Briefcase color={Colors.dark.textMuted} size={16} />
                    <Text style={styles.inputLabel}>Mesleğiniz</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={occupation}
                    onChangeText={setOccupation}
                    placeholder="Yazılım Mühendisi, Doktor, vb."
                    placeholderTextColor={Colors.dark.textMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <Wallet color={Colors.dark.textMuted} size={16} />
                    <Text style={styles.inputLabel}>Aylık Gelir (₺)</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={monthlyIncome}
                    onChangeText={handleIncomeChange}
                    placeholder="30.000"
                    placeholderTextColor={Colors.dark.textMuted}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <PiggyBank color={Colors.dark.textMuted} size={16} />
                    <Text style={styles.inputLabel}>Yatırıma Ayıracağınız Tutar (₺/ay)</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={investmentBudget}
                    onChangeText={handleBudgetChange}
                    placeholder="5.000"
                    placeholderTextColor={Colors.dark.textMuted}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <Shield color={Colors.dark.textMuted} size={16} />
                    <Text style={styles.inputLabel}>Risk Toleransı</Text>
                  </View>
                  <View style={styles.riskRow}>
                    {(['low', 'medium', 'high'] as const).map((level) => {
                      const isActive = riskTolerance === level;
                      const IconComp =
                        level === 'low' ? Shield : level === 'medium' ? TrendingUp : Sparkles;
                      const color =
                        level === 'low'
                          ? Colors.dark.riskLow
                          : level === 'medium'
                          ? Colors.dark.riskMedium
                          : Colors.dark.riskHigh;
                      return (
                        <TouchableOpacity
                          key={level}
                          style={[
                            styles.riskCard,
                            isActive && { borderColor: color, backgroundColor: color + '15' },
                          ]}
                          onPress={() => setRiskTolerance(level)}
                          activeOpacity={0.7}
                        >
                          <IconComp color={isActive ? color : Colors.dark.textMuted} size={18} />
                          <Text style={[styles.riskText, isActive && { color }]}>
                            {riskLabels[level]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <Target color={Colors.dark.textMuted} size={16} />
                    <Text style={styles.inputLabel}>Yatırım Hedefi</Text>
                  </View>
                  <View style={styles.goalsGrid}>
                    {goals.map((goal) => {
                      const isActive = investmentGoal === goal;
                      return (
                        <TouchableOpacity
                          key={goal}
                          style={[styles.goalChip, isActive && styles.goalChipActive]}
                          onPress={() => setInvestmentGoal(goal)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.goalChipText, isActive && styles.goalChipTextActive]}>
                            {goal}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSave}
                  activeOpacity={0.8}
                >
                  <Check color="#fff" size={20} />
                  <Text style={styles.saveBtnText}>Kaydet</Text>
                </TouchableOpacity>
              </Animated.View>
            ) : profile ? (
              <Animated.View style={[styles.detailSection, { opacity: fadeAnim }]}>
                <Text style={styles.sectionTitle}>Bilgileriniz</Text>

                <View style={styles.detailCard}>
                  <DetailRow icon={CalendarDays} label="Yaş" value={profile.age || 'Belirtilmedi'} />
                  <View style={styles.detailDivider} />
                  <DetailRow icon={Briefcase} label="Meslek" value={profile.occupation || 'Belirtilmedi'} />
                  <View style={styles.detailDivider} />
                  <DetailRow
                    icon={Wallet}
                    label="Aylık Gelir"
                    value={profile.monthlyIncome ? `₺${profile.monthlyIncome.toLocaleString('tr-TR')}` : 'Belirtilmedi'}
                  />
                  <View style={styles.detailDivider} />
                  <DetailRow
                    icon={PiggyBank}
                    label="Yatırım Bütçesi"
                    value={profile.investmentBudget ? `₺${profile.investmentBudget.toLocaleString('tr-TR')}/ay` : 'Belirtilmedi'}
                  />
                  <View style={styles.detailDivider} />
                  <DetailRow icon={Target} label="Yatırım Hedefi" value={profile.investmentGoal || 'Belirtilmedi'} />
                  <View style={styles.detailDivider} />
                  <DetailRow icon={Mail} label="E-posta" value={profile.email || 'Belirtilmedi'} />
                </View>
              </Animated.View>
            ) : null}

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ color: string; size: number }>; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Icon color={Colors.dark.textMuted} size={18} />
      <View style={styles.detailTextCol}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerSection: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.dark.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#fff',
  },
  avatarInfo: {
    gap: 3,
  },
  avatarName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  avatarEmail: {
    fontSize: 14,
    color: Colors.dark.textMuted,
  },
  avatarOccupation: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.dark.textMuted,
  },
  formSection: {
    gap: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 4,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
  },
  input: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  riskRow: {
    flexDirection: 'row',
    gap: 10,
  },
  riskCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1.5,
    borderColor: Colors.dark.border,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.dark.textMuted,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  goalChipActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.primaryGlow,
  },
  goalChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
  },
  goalChipTextActive: {
    color: Colors.dark.primary,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.dark.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  detailSection: {
    gap: 16,
  },
  detailCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 0,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  detailTextCol: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  detailDivider: {
    height: 1,
    backgroundColor: Colors.dark.border,
  },
});
