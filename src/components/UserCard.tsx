import { Image } from "expo-image";
import { Dumbbell, Heart, MapPin } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import {
    borderWidth,
    twColors,
    twFonts,
    twRadius,
} from "../constants/tailwind-runtime-theme";

interface UserCardProps {
  name: string;
  age: number;
  gym: string;
  distance: string;
  avatar: string;
  interests: string[];
}

const UserCard = ({
  name,
  age,
  gym,
  distance,
  avatar,
  interests,
}: UserCardProps) => {
  const [liked, setLiked] = useState(false);
  const scale = useSharedValue(1);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.card, animatedCardStyle]}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.9, { damping: 24, stiffness: 1000 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 24, stiffness: 1000 });
        }}
      >
        <View style={styles.mediaWrap}>
          <Image
            source={{ uri: avatar }}
            contentFit="cover"
            style={styles.avatar}
          />
          <View style={styles.overlay} />

          <Pressable
            onPress={() => setLiked((value) => !value)}
            style={styles.likeButton}
          >
            <Heart
              size={16}
              color={liked ? twColors.destructive : twColors.foreground}
              fill={liked ? twColors.destructive : "transparent"}
            />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>
              {name}, {age}
            </Text>
            <View style={styles.distanceRow}>
              <MapPin size={10} />
              <Text style={styles.distanceText}>{distance}</Text>
            </View>
          </View>

          <Text style={styles.gymText}>
            <Dumbbell size={10} color={twColors.muted} />
            {gym}
          </Text>

          <View style={styles.tagsWrap}>
            {interests.map((tag) => (
              <View key={tag} style={styles.tagPill}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: twColors.card,
    borderWidth: borderWidth.default,
    borderColor: twColors.border,
    borderRadius: twRadius.md,
    overflow: "hidden",
  },
  mediaWrap: {
    position: "relative",
    height: 170,
    backgroundColor: twColors.muted,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.15)",
  },
  likeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "rgba(30,41,59,0.72)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 10,
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    flex: 1,
    color: twColors.foreground,
    fontSize: 13,
    fontFamily: twFonts.bold,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    color: twColors.accent,
  },
  distanceText: {
    color: twColors.accent,
    fontSize: 10,
    fontFamily: twFonts.regular,
  },
  gymText: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    color: twColors.muted,
    fontSize: 10,
    fontFamily: twFonts.regular,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: twColors.primary + "1A",
  },
  tagText: {
    color: twColors.primary,
    fontSize: 10,
    fontFamily: twFonts.medium,
  },
});

export default UserCard;
