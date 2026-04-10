import React from 'react';
import { View, Text, TextInput } from 'react-native';

interface SeveritySliderProps {
  value: number;
  onValueChange: (value: number) => void;
}

export default function SeveritySlider({ value, onValueChange }: SeveritySliderProps) {
  return (
    <View className="py-4">
      <View className="bg-gray-100 rounded-xl h-2 w-full overflow-hidden">
        <View 
          style={{ width: `${(value / 10) * 100}%` }} 
          className="bg-green-600 h-full"
        />
      </View>
      <View className="flex-row justify-between mt-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <View key={num} className="items-center">
             <Text 
               onPress={() => onValueChange(num)}
               className={`w-6 h-6 text-center leading-6 rounded-md cursor-pointer ${value === num ? 'bg-green-600 text-white font-bold' : 'text-gray-400'}`}
             >
               {num}
             </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
