import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import MapView, { Polygon } from 'react-native-maps';
import api from '../../services/api';


interface DeliveryZone {
  id: string;
  name: string;
  boundary: {
    type: 'Polygon';
    coordinates: Array<Array<[number, number]>>;
  };
  baseFee: number;
  feePerKm: number;
  estimatedMinutes: number;
  isActive: boolean;
}

interface ZoneForm {
  name: string;
  baseFee: string;
  feePerKm: string;
  estimatedMinutes: string;
}

const emptyForm: ZoneForm = { name: '', baseFee: '', feePerKm: '', estimatedMinutes: '' };

export function ZoneManagementView() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [form, setForm] = useState<ZoneForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const fetchZones = useCallback(async () => {
    try {
      const response = await api.get('/delivery/zones');
      if (response.data.success) {
        setZones(response.data.data.zones);
      }
    } catch {
      setZones([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const handleSave = useCallback(async () => {
    if (!form.name || !form.baseFee || !form.feePerKm || !form.estimatedMinutes) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: form.name,
        baseFee: parseFloat(form.baseFee),
        feePerKm: parseFloat(form.feePerKm),
        estimatedMinutes: parseInt(form.estimatedMinutes, 10),
      };

      if (editingZone) {
        await api.put(`/delivery/zones/${editingZone.id}`, payload);
      } else {
        await api.post('/delivery/zones', payload);
      }

      setShowForm(false);
      setEditingZone(null);
      setForm(emptyForm);
      fetchZones();
    } catch {
      Alert.alert('Error', 'Failed to save zone');
    } finally {
      setIsSaving(false);
    }
  }, [form, editingZone, fetchZones]);

  const handleDelete = useCallback(
    async (zone: DeliveryZone) => {
      Alert.alert('Delete Zone', `Deactivate "${zone.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/delivery/zones/${zone.id}`);
              fetchZones();
            } catch {
              Alert.alert('Error', 'Failed to deactivate zone');
            }
          },
        },
      ]);
    },
    [fetchZones],
  );

  const handleEdit = useCallback((zone: DeliveryZone) => {
    setEditingZone(zone);
    setForm({
      name: zone.name,
      baseFee: zone.baseFee.toString(),
      feePerKm: zone.feePerKm.toString(),
      estimatedMinutes: zone.estimatedMinutes.toString(),
    });
    setShowForm(true);
  }, []);

  if (isLoading) return <Text style={{ textAlign: 'center', marginTop: 40, color: '#6C757D' }}>Loading zones...</Text>;

  const region = { latitude: 23.8103, longitude: 90.4125, latitudeDelta: 0.1, longitudeDelta: 0.1 };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Delivery Zones ({zones.length})</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            setEditingZone(null);
            setForm(emptyForm);
            setShowForm(true);
          }}
        >
          <Text style={styles.addBtnText}>+ New Zone</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.formPanel}>
          <Text style={styles.formTitle}>{editingZone ? 'Edit Zone' : 'New Zone'}</Text>

          <TextInput
            style={styles.input}
            placeholder="Zone Name"
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Base Fee ($)"
              value={form.baseFee}
              onChangeText={(v) => setForm({ ...form, baseFee: v })}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Fee/km ($)"
              value={form.feePerKm}
              onChangeText={(v) => setForm({ ...form, feePerKm: v })}
              keyboardType="decimal-pad"
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Est. Minutes"
            value={form.estimatedMinutes}
            onChangeText={(v) => setForm({ ...form, estimatedMinutes: v })}
            keyboardType="number-pad"
          />

          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setShowForm(false);
                setEditingZone(null);
                setForm(emptyForm);
              }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
              <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <MapView style={styles.map} region={region}>
        {zones
          .filter((z) => z.boundary?.coordinates?.[0])
          .map((zone) => (
            <Polygon
              key={zone.id}
              coordinates={zone.boundary.coordinates[0].map(([lng, lat]) => ({
                latitude: lat,
                longitude: lng,
              }))}
              fillColor={zone.isActive ? 'rgba(255, 107, 53, 0.15)' : 'rgba(108, 117, 125, 0.1)'}
              strokeColor={zone.isActive ? '#FF6B35' : '#6C757D'}
              strokeWidth={2}
              tappable
              onPress={() => handleEdit(zone)}
            />
          ))}
      </MapView>

      <FlatList
        data={zones}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.zoneCard}>
            <View style={styles.zoneInfo}>
              <Text style={styles.zoneName}>{item.name}</Text>
              <Text style={styles.zoneDetails}>
                ${item.baseFee.toFixed(2)} + ${item.feePerKm.toFixed(2)}/km · ~
                {item.estimatedMinutes}min
              </Text>
              <Text style={[styles.zoneStatus, item.isActive ? styles.active : styles.inactive]}>
                {item.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
            <View style={styles.zoneActions}>
              <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              {item.isActive && (
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                  <Text style={styles.deleteBtnText}>Disable</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1A1A2E' },
  addBtn: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  formPanel: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#F8F9FA',
    marginBottom: 8,
  },
  row: { flexDirection: 'row', gap: 8 },
  halfInput: { flex: 1 },
  formActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#6C757D' },
  saveBtn: {
    flex: 2,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#FF6B35',
  },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  map: { height: 250 },
  list: { flex: 1 },
  listContent: { padding: 16 },
  zoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  zoneInfo: { flex: 1 },
  zoneName: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  zoneDetails: { fontSize: 13, color: '#6C757D', marginBottom: 4 },
  zoneStatus: { fontSize: 12, fontWeight: '600' },
  active: { color: '#28A745' },
  inactive: { color: '#DC3545' },
  zoneActions: { gap: 4 },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
  },
  editBtnText: { fontSize: 12, fontWeight: '600', color: '#007AFF' },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FFF5F5',
  },
  deleteBtnText: { fontSize: 12, fontWeight: '600', color: '#DC3545' },
});
