import { SafeAreaView, View, Text } from 'react-native';
import { colors as C, fonts as F } from '../../src/theme/colors';

export default function FamilyScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{
          fontFamily: F.heading,
          fontSize: 28,
          color: 'rgba(255,248,231,0.92)',
          letterSpacing: -0.5,
        }}>
          Family Hub
        </Text>
      </View>
    </SafeAreaView>
  );
}
