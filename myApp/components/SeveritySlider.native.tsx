import React from 'react';
import Slider from '@react-native-community/slider';

interface SeveritySliderProps {
  value: number;
  onValueChange: (value: number) => void;
}

export default function SeveritySlider({ value, onValueChange }: SeveritySliderProps) {
  return (
    <Slider
      style={{ width: '100%', height: 40 }}
      minimumValue={1}
      maximumValue={10}
      step={1}
      value={value}
      onValueChange={onValueChange}
      minimumTrackTintColor="#059669"
      maximumTrackTintColor="#d1d5db"
      thumbTintColor="#059669"
    />
  );
}
