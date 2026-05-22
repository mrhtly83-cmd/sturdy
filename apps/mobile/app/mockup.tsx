import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Animated, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Assuming Expo vector icons

// Mocking the theme tokens for the standalone mockup
const colors = {
  background: '#0d0b08',
  surfaceResting: 'rgba(255,255,255,0.04)',
  surfaceFocused: 'rgba(255,255,255,0.08)',
  borderResting: 'rgba(255,255,255,0.07)',
  borderFocused: 'rgba(200, 136, 58, 0.3)', // Subtle amber glow
  text: '#FFFFFF',
  textSub: '#A09D9A',
  amber: '#C8883A',
  amberGradientEnd: '#E8A855',
  sage: '#8AA060',
};

const fonts = {
  heading: 'Fraunces_600SemiBold_Italic',
  body: 'DMSans_400Regular',
  label: 'DMSans_500Medium',
};

const PLACEHOLDERS = [
  "Ask Sturdy anything...",
  "Why is bedtime suddenly a battle?",
  "Am I being too strict about screen time?",
  "How do I prepare him for a new baby?",
];

export default function AskSturdyMockup() {
  const [isFocused, setIsFocused] = useState(false);
  const [inputText, setInputText] = useState('');
  
  // Placeholder rotation logic
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isFocused || inputText.length > 0) return; // Stop rotating if typing
    
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true })
      ]).start();
      
      setTimeout(() => {
        setPlaceholderIdx((prev) => (prev + 1) % PLACEHOLDERS.length);
      }, 400); // Change text when fully faded out
      
    }, 4000); // Rotate every 4 seconds

    return () => clearInterval(interval);
  }, [isFocused, inputText]);

  return (
    <View style={styles.container}>
      {/* Contextual Header */}
      <Text style={styles.greeting}>Good evening, Mike.</Text>
      <Text style={styles.subhead}>WHAT'S ON YOUR MIND?</Text>

      {/* The "Thinking Space" Input 
        Replaces the single-line pill with a breathing multi-line area 
      */}
      <Animated.View style={[
        styles.inputCard,
        {
          backgroundColor: isFocused ? colors.surfaceFocused : colors.surfaceResting,
          borderColor: isFocused ? colors.borderFocused : colors.borderResting,
        }
      ]}>
        <Animated.View style={{ opacity: fadeAnim, position: 'absolute', top: 16, left: 16, right: 60, pointerEvents: 'none' }}>
           {!inputText && (
             <Text style={styles.placeholderText}>{PLACEHOLDERS[placeholderIdx]}</Text>
           )}
        </Animated.View>

        <TextInput
          style={styles.textInput}
          multiline={true}
          value={inputText}
          onChangeText={setInputText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={colors.amber}
        />

        {/* Submit Button aligned to bottom right */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.submitButton, { opacity: inputText.length > 0 ? 1 : 0.5 }]}
            disabled={inputText.length === 0}
          >
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Mocking the newly shipped QuotaBar below it */}
      <View style={styles.quotaContainer}>
        <View style={styles.quotaRow}>
          <Text style={styles.quotaText}>12 of 50 scripts used</Text>
          <Text style={styles.quotaText}>Resets Jun 1</Text>
        </View>
        <View style={styles.quotaTrack}>
          <View style={[styles.quotaFill, { width: '24%' }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    paddingTop: 80,
  },
  greeting: {
    fontFamily: fonts.heading,
    fontSize: 28,
    color: colors.text,
    marginBottom: 4,
  },
  subhead: {
    fontFamily: fonts.label,
    fontSize: 12,
    color: colors.textSub,
    letterSpacing: 1.2,
    marginBottom: 24,
  },
  inputCard: {
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 120, // Forces the box to look like a journal space immediately
    padding: 16,
    paddingBottom: 60, // Make room for the absolute positioned button
    position: 'relative',
  },
  textInput: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
    minHeight: 80,
    maxHeight: 160,
    textAlignVertical: 'top', // Crucial for Android multi-line
  },
  placeholderText: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textSub,
    lineHeight: 24,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  submitButton: {
    backgroundColor: colors.amber,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quotaContainer: {
    marginTop: 16,
    paddingHorizontal: 4,
  },
  quotaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quotaText: {
    fontFamily: fonts.label,
    fontSize: 11,
    color: colors.textSub,
  },
  quotaTrack: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 1,
  },
  quotaFill: {
    height: 2,
    backgroundColor: colors.amber,
    borderRadius: 1,
  },
});