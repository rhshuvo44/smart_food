import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Header } from '../../components/common/header';
import { Button } from '../../components/common/button';
import { Input } from '../../components/common/input';
import { colors, spacing, shadows } from '../../constants';

export default function PaymentScreen() {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const handleAdd = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <Header title="Add Card" showBack />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.cardPreview}>
          <View style={styles.cardInner}>
            <View style={styles.cardTop}>
              <Text style={styles.cardBrand}>VISA</Text>
              <Text style={styles.cardType}>💳</Text>
            </View>
            <Text style={styles.cardNumber}>
              {cardNumber || '•••• •••• •••• ••••'}
            </Text>
            <View style={styles.cardBottom}>
              <Text style={styles.cardExpiry}>{expiry || 'MM/YY'}</Text>
              <Text style={styles.cardCvv}>{cvv ? '•••' : 'CVV'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.form}>
          <Input
            label="Cardholder Name"
            value={cardName}
            onChangeText={setCardName}
            placeholder="John Doe"
          />
          <Input
            label="Card Number"
            value={cardNumber}
            onChangeText={(t) => setCardNumber(t.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19))}
            placeholder="4242 4242 4242 4242"
            keyboardType="phone-pad"
          />
          <View style={styles.row}>
            <View style={styles.half}>
              <Input label="Expiry" value={expiry} onChangeText={setExpiry} placeholder="MM/YY" />
            </View>
            <View style={styles.half}>
              <Input label="CVV" value={cvv} onChangeText={(t) => setCvv(t.replace(/\D/g, '').slice(0, 3))} placeholder="123" />
            </View>
          </View>
        </View>

        <Button title="Add Card" onPress={handleAdd} variant="primary" style={styles.addButton} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { paddingBottom: spacing.xxl },
  cardPreview: {
    margin: spacing.md,
    height: 200,
    backgroundColor: '#1A1A2E',
    borderRadius: spacing.lg,
    padding: spacing.lg,
    ...shadows.lg,
  },
  cardInner: { flex: 1, justifyContent: 'space-between' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBrand: { fontSize: 24, fontWeight: '700', color: colors.white, letterSpacing: 2 },
  cardType: { fontSize: 32 },
  cardNumber: { fontSize: 22, fontWeight: '600', color: colors.white, letterSpacing: 2, textAlign: 'center' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  cardExpiry: { fontSize: 14, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  cardCvv: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  form: { padding: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  addButton: { marginHorizontal: spacing.md, marginTop: spacing.md },
});
