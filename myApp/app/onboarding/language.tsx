import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Globe } from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { Language } from '../../constants/translations';

const LANGUAGES = [
  { id: 'english', label: 'English' },
  { id: 'tamil', label: 'தமிழ் (Tamil)' },
  { id: 'hindi', label: 'हिन्दी (Hindi)' },
  { id: 'bengali', label: 'বাংলা (Bengali)' },
];

export default function LanguageScreen() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [selected, setSelected] = useState<Language>(language);

  const handleContinue = async () => {
    try {
      router.push('/onboarding/location');
    } catch (e) {
      console.error('Failed to save language', e);
    }
  };

  const handleSelect = async (langId: Language) => {
    setSelected(langId);
    await setLanguage(langId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View className="bg-white p-3 rounded-full shadow-sm">
           <Globe size={24} color="#059669" />
        </View>
        <Text style={styles.title}>CivicIntel</Text>
        <Text style={styles.subtitle}>{t.selectLanguage}</Text>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.id}
            activeOpacity={0.8}
            onPress={() => handleSelect(lang.id as Language)}
            style={[
              styles.langItem,
              selected === lang.id ? styles.langItemSelected : null
            ]}
          >
            <Text style={[
              styles.langText,
              selected === lang.id ? styles.langTextSelected : null
            ]}>
              {lang.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>{t.continue}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdfa',
    padding: 24,
  },
  header: {
    marginTop: 60,
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  list: {
    flex: 1,
  },
  langItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  langItemSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  langText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  langTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  footer: {
    paddingBottom: 40,
    paddingTop: 20,
  },
  button: {
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
