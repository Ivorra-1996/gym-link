import {
    borderWidth,
    twColors,
    twRadius,
} from "@/constants/tailwind-runtime-theme";
import React from "react";
import { Animated, Easing, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

export default function Spinner() {
  const spinnerSize = twRadius.lg * 5.5;
  const viewBoxSize = 24;
  const center = viewBoxSize / 2;
  const strokeWidth = borderWidth.thick * 2;
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.28;

  const rotate = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    let isMounted = true;

    const runSpin = () => {
      rotate.setValue(0);

      Animated.timing(rotate, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && isMounted) {
          runSpin();
        }
      });
    };

    runSpin();

    return () => {
      isMounted = false;
      rotate.stopAnimation();
      rotate.setValue(0);
    };
  }, [rotate]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View
      style={{
        width: "100%",
        height: "92.5%",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Svg
          width={spinnerSize}
          height={spinnerSize}
          viewBox="0 0 24 24"
          fill="none"
        >
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={twColors.muted}
            strokeWidth={strokeWidth}
          />
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={twColors.primary}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            transform={`rotate(-90 ${center} ${center})`}
          />
        </Svg>
      </Animated.View>
      <Text style={{ color: twColors.muted }}>Loading...</Text>
    </View>
  );
}
