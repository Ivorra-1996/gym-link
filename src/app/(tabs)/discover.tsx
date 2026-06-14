import { Filter, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import UserCard from '@/components/UserCard';
import {
  borderWidth,
  twColors,
  twFonts,
} from '@/constants/tailwind-runtime-theme';

const users = [
  {
    name: 'Valentina',
    age: 24,
    gym: 'SmartFit Centro',
    distance: '0.8 km',
    avatar: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=400&h=400&fit=crop',
    interests: ['CrossFit', 'Yoga'],
  },
  {
    name: 'Mateo',
    age: 27,
    gym: 'BodyTech Norte',
    distance: '1.2 km',
    avatar: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=400&fit=crop',
    interests: ['Powerlifting', 'Nutrición'],
  },
  {
    name: 'Camila',
    age: 22,
    gym: 'SmartFit Centro',
    distance: '0.5 km',
    avatar: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop',
    interests: ['Running', 'HIIT'],
  },
  {
    name: 'Andrés',
    age: 29,
    gym: "Gold's Gym",
    distance: '2.1 km',
    avatar: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop',
    interests: ['Bodybuilding', 'Coach'],
  },
];

const categories = ['Todos', 'Gym Crush 💪', 'Entrenadores', 'Nutricionistas', 'Cerca'];

const Discover = () => {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Descubrir</Text>
              <View style={styles.locationRow}>
                <MapPin size={10} color={twColors.muted} />
                <Text style={styles.locationText}>Cerca de ti</Text>
              </View>
            </View>
            <Pressable style={styles.filterButton}>
              <Filter size={16} color={twColors.foreground} />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsRow}
          >
            {categories.map((cat, i) => (
              <Pressable
                key={cat}
                onPress={() => setActiveCategory(i)}
                style={[styles.pill, activeCategory === i && styles.pillActive]}
              >
                <Text style={[styles.pillText, activeCategory === i && styles.pillTextActive]}>
                  {cat}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.grid}>
            {users.map((u, i) => (
              <Animated.View
                key={u.name}
                entering={FadeInUp.delay(80 + i * 80)}
                style={styles.cardWrapper}
              >
                <UserCard {...u} />
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: twColors.background },
  scroll: { flex: 1 },
  scrollContent: { alignItems: 'center', paddingBottom: 24 },
  content: {
    width: '100%',
    maxWidth: 512,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 96,
    gap: 20,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontSize: 20, fontFamily: twFonts.bold, color: twColors.foreground },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locationText: { fontSize: 11, fontFamily: twFonts.regular, color: twColors.muted },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillsRow: { gap: 8, paddingRight: 4 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: twColors.card2,
    borderWidth: borderWidth.default,
    borderColor: 'transparent',
  },
  pillActive: { backgroundColor: twColors.primary, borderColor: twColors.primary },
  pillText: { fontSize: 12, fontFamily: twFonts.medium, color: twColors.mutedForeground },
  pillTextActive: { color: twColors.background },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cardWrapper: { width: '48%' },
});

export default Discover;
