import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { useWedding } from '../contexts/WeddingContext';
import { weddingApi } from '../api/wedding';
import type { GuestType, FamilyRelationship, RelationshipTier } from '../types';

// Picker component for dropdowns
const Picker = ({ label, value, onChange, options, enabled = true }: any) => (
  <View style={styles.pickerContainer}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.pickerButtons}>
      {options.map((option: any) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.pickerButton,
            value === option.value && styles.pickerButtonActive,
          ]}
          onPress={() => enabled && onChange(option.value)}
          disabled={!enabled}
        >
          <Text
            style={[
              styles.pickerButtonText,
              value === option.value && styles.pickerButtonTextActive,
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const GUEST_TYPES = [
  { value: 'family', label: 'Family' },
  { value: 'friend', label: 'Friend' },
  { value: 'coworker', label: 'Coworker' },
  { value: 'neighbor', label: 'Neighbor' },
  { value: 'other', label: 'Other' },
];

const FIRST_TIER = [
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'sister', label: 'Sister' },
  { value: 'brother', label: 'Brother' },
  { value: 'daughter', label: 'Daughter' },
  { value: 'son', label: 'Son' },
  { value: 'grandmother', label: 'Grandmother' },
  { value: 'grandfather', label: 'Grandfather' },
];

const SECOND_TIER = [
  { value: 'aunt', label: 'Aunt' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'niece', label: 'Niece' },
  { value: 'nephew', label: 'Nephew' },
];

const THIRD_TIER = [
  { value: 'great_aunt', label: 'Great Aunt' },
  { value: 'great_uncle', label: 'Great Uncle' },
  { value: 'second_cousin', label: '2nd Cousin' },
  { value: 'cousin_once_removed', label: 'Cousin Once Removed' },
  { value: 'distant_relative', label: 'Distant Relative' },
];

const RELATIONSHIP_TIERS = [
  { value: 'first', label: '1st Tier' },
  { value: 'second', label: '2nd Tier' },
  { value: 'third', label: '3rd Tier' },
];

const AddGuestScreen = ({ navigation }: any) => {
  const { currentWedding } = useWedding();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [guestType, setGuestType] = useState<GuestType>('friend');
  const [familyRelationship, setFamilyRelationship] = useState<FamilyRelationship | ''>('');
  const [relationshipTier, setRelationshipTier] = useState<RelationshipTier | ''>('');
  const [canBringPlusOne, setCanBringPlusOne] = useState(false);
  const [plusOneName, setPlusOneName] = useState('');
  const [canBringChildren, setCanBringChildren] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGuestTypeChange = (type: GuestType) => {
    setGuestType(type);
    if (type !== 'family') {
      setFamilyRelationship('');
      setRelationshipTier('');
    }
  };

  const handleRelationshipChange = (relationship: FamilyRelationship) => {
    setFamilyRelationship(relationship);
    // Auto-set tier based on relationship
    if (FIRST_TIER.some(r => r.value === relationship)) {
      setRelationshipTier('first');
    } else if (SECOND_TIER.some(r => r.value === relationship)) {
      setRelationshipTier('second');
    } else if (THIRD_TIER.some(r => r.value === relationship)) {
      setRelationshipTier('third');
    }
  };

  const getRelationshipOptions = () => {
    switch (relationshipTier) {
      case 'first': return FIRST_TIER;
      case 'second': return SECOND_TIER;
      case 'third': return THIRD_TIER;
      default: return [...FIRST_TIER, ...SECOND_TIER, ...THIRD_TIER];
    }
  };

  const handleAddGuest = async () => {
    if (!firstName || !lastName || !email) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    if (!currentWedding) {
      Alert.alert('Error', 'No wedding selected');
      return;
    }

    setLoading(true);
    try {
      await weddingApi.createGuest({
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || undefined,
        address: address || undefined,
        notes: notes || undefined,
        guest_type: guestType,
        family_relationship: guestType === 'family' && familyRelationship ? familyRelationship : undefined,
        relationship_tier: guestType === 'family' && relationshipTier ? relationshipTier : undefined,
        can_bring_plus_one: canBringPlusOne,
        plus_one_name: plusOneName || undefined,
        can_bring_children: canBringChildren,
        wedding: currentWedding.id,
      });
      
      Alert.alert('Success', `${firstName} has been added to your guest list!`);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add guest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Guest Information</Text>
      
      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="John"
            editable={!loading}
          />
        </View>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Smith"
            editable={!loading}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="john@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        </View>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 (555) 123-4567"
            keyboardType="phone-pad"
            editable={!loading}
          />
        </View>
      </View>

      <View style={styles.separator} />

      <Text style={styles.sectionTitle}>Guest Category</Text>
      
      <Picker
        label="Guest Type *"
        value={guestType}
        onChange={handleGuestTypeChange}
        options={GUEST_TYPES}
        enabled={!loading}
      />

      {guestType === 'family' && (
        <View style={styles.familySection}>
          <Text style={styles.familyTitle}>👨‍👩‍👧‍👦 Family Details</Text>
          
          <Picker
            label="Relationship Tier"
            value={relationshipTier}
            onChange={setRelationshipTier}
            options={RELATIONSHIP_TIERS}
            enabled={!loading}
          />
          
          <Picker
            label="Relationship"
            value={familyRelationship}
            onChange={handleRelationshipChange}
            options={getRelationshipOptions()}
            enabled={!loading}
          />
        </View>
      )}

      <View style={styles.separator} />

      <Text style={styles.label}>Address</Text>
      <TextInput
        style={styles.input}
        value={address}
        onChangeText={setAddress}
        placeholder="123 Main St, City, State 12345"
        editable={!loading}
      />

      <View style={styles.separator} />

      <View style={styles.switchRow}>
        <View style={styles.switchLabel}>
          <Text style={styles.label}>Allow Plus One</Text>
          <Text style={styles.sublabel}>Guest can bring a companion</Text>
        </View>
        <Switch
          value={canBringPlusOne}
          onValueChange={setCanBringPlusOne}
          disabled={loading}
        />
      </View>

      {canBringPlusOne && (
        <View style={styles.indented}>
          <Text style={styles.label}>Plus One Name (if known)</Text>
          <TextInput
            style={styles.input}
            value={plusOneName}
            onChangeText={setPlusOneName}
            placeholder="Jane Smith"
            editable={!loading}
          />
        </View>
      )}

      <View style={styles.separator} />

      <View style={styles.switchRow}>
        <View style={styles.switchLabel}>
          <Text style={styles.label}>Allow Children</Text>
          <Text style={styles.sublabel}>Guest can bring their children</Text>
        </View>
        <Switch
          value={canBringChildren}
          onValueChange={setCanBringChildren}
          disabled={loading}
        />
      </View>

      <View style={styles.separator} />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Any additional notes about this guest..."
        multiline
        numberOfLines={4}
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleAddGuest}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Adding...' : '✓ Add Guest'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sublabel: {
    fontSize: 14,
    color: '#666',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    marginBottom: 15,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
  },
  pickerContainer: {
    marginBottom: 15,
  },
  pickerButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  pickerButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  pickerButtonText: {
    fontSize: 14,
    color: '#333',
  },
  pickerButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  familySection: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B9D',
    marginBottom: 15,
  },
  familyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B9D',
    marginBottom: 15,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  switchLabel: {
    flex: 1,
  },
  indented: {
    paddingLeft: 15,
    borderLeftWidth: 2,
    borderLeftColor: '#FF6B9D',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default AddGuestScreen;
