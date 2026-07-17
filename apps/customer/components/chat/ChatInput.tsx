import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';

interface ChatInputProps {
  onSend: (text: string) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, onTyping, disabled }: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    onTyping(false);
  };

  const handleChange = (value: string) => {
    setText(value);
    onTyping(value.length > 0);
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#E9ECEF',
        backgroundColor: '#FFFFFF',
      }}
    >
      <TextInput
        value={text}
        onChangeText={handleChange}
        placeholder="Type a message..."
        placeholderTextColor="#ADB5BD"
        multiline
        maxLength={5000}
        editable={!disabled}
        style={{
          flex: 1,
          backgroundColor: '#F1F3F5',
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 10,
          fontSize: 15,
          maxHeight: 100,
          color: '#1A1A2E',
        }}
      />
      <TouchableOpacity
        onPress={handleSend}
        disabled={!text.trim() || disabled}
        style={{
          marginLeft: 8,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: text.trim() && !disabled ? '#FF6B35' : '#DEE2E6',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        activeOpacity={0.8}
      >
        <Text style={{ fontSize: 18, color: text.trim() && !disabled ? '#FFFFFF' : '#ADB5BD' }}>
          ↑
        </Text>
      </TouchableOpacity>
    </View>
  );
}
