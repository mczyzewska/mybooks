
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../lib/theme';

interface Props {
  rating?: number;
  onRate?: (rating: number) => void;
  size?: number;
}

export default function StarRating({ rating = 0, onRate, size = 22 }: Props) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onRate?.(star)}
          disabled={!onRate}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: size, color: star <= rating ? COLORS.accent : COLORS.textMuted }}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
});
