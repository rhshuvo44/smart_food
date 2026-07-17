import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Switch,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Loading } from '../../components/common/loading';
import { ErrorState } from '../../components/common/error-state';
import { EmptyState } from '../../components/common/empty-state';
import { colors, spacing, borderRadius } from '../../constants';
import api from '../../services/api';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  dietaryTags: string[];
  preparationTime: number;
  imageUrl?: string;
  isAvailable: boolean;
}

const DIETARY_OPTIONS = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nuts'];

const DEFAULT_CATEGORIES = ['All', 'Appetizers', 'Main', 'Desserts', 'Beverages', 'Sides'];

const MOCK_MENU: MenuItem[] = [
  {
    id: '1',
    name: 'Margherita Pizza',
    description: 'Classic tomato sauce, mozzarella, and fresh basil',
    price: 12.0,
    category: 'Main',
    dietaryTags: ['vegetarian'],
    preparationTime: 20,
    imageUrl: '',
    isAvailable: true,
  },
  {
    id: '2',
    name: 'Caesar Salad',
    description: 'Romaine lettuce, croutons, parmesan with Caesar dressing',
    price: 8.5,
    category: 'Appetizers',
    dietaryTags: ['vegetarian'],
    preparationTime: 10,
    imageUrl: '',
    isAvailable: true,
  },
  {
    id: '3',
    name: 'Grilled Salmon',
    description: 'Atlantic salmon with lemon butter sauce and seasonal vegetables',
    price: 22.0,
    category: 'Main',
    dietaryTags: ['gluten-free', 'dairy-free'],
    preparationTime: 25,
    imageUrl: '',
    isAvailable: true,
  },
  {
    id: '4',
    name: 'Tiramisu',
    description: 'Classic Italian coffee-flavored layered dessert',
    price: 6.0,
    category: 'Desserts',
    dietaryTags: ['vegetarian'],
    preparationTime: 5,
    imageUrl: '',
    isAvailable: false,
  },
  {
    id: '5',
    name: 'Fresh Orange Juice',
    description: 'Freshly squeezed orange juice',
    price: 4.5,
    category: 'Beverages',
    dietaryTags: ['vegan', 'gluten-free', 'dairy-free'],
    preparationTime: 3,
    imageUrl: '',
    isAvailable: true,
  },
  {
    id: '6',
    name: 'Bruschetta',
    description: 'Toasted bread topped with tomatoes, garlic, and basil',
    price: 7.0,
    category: 'Appetizers',
    dietaryTags: ['vegan'],
    preparationTime: 10,
    imageUrl: '',
    isAvailable: true,
  },
];

interface MenuFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  dietaryTags: string[];
  preparationTime: string;
  imageUrl: string;
  isAvailable: boolean;
}

const EMPTY_FORM: MenuFormData = {
  name: '',
  description: '',
  price: '',
  category: 'Main',
  dietaryTags: [],
  preparationTime: '15',
  imageUrl: '',
  isAvailable: true,
};

export default function MenuScreen() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<MenuFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{ success: boolean; data: MenuItem[] }>(
        '/restaurants/me/menu',
      );
      const items = response.data.data;
      setMenuItems(items);
      const cats = [...new Set(items.map((i) => i.category))];
      setCategories(['All', ...cats]);
    } catch {
      setMenuItems(MOCK_MENU);
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMenu();
    }, [fetchMenu]),
  );

  const filteredItems =
    activeCategory === 'All' ? menuItems : menuItems.filter((i) => i.category === activeCategory);

  const openAddModal = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      dietaryTags: [...item.dietaryTags],
      preparationTime: item.preparationTime.toString(),
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable,
    });
    setModalVisible(true);
  };

  const toggleDietaryTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      dietaryTags: prev.dietaryTags.includes(tag)
        ? prev.dietaryTags.filter((t) => t !== tag)
        : [...prev.dietaryTags, tag],
    }));
  };

  const validateForm = (): boolean => {
    if (!form.name.trim()) {
      Alert.alert('Validation', 'Item name is required.');
      return false;
    }
    if (!form.price.trim() || isNaN(Number(form.price)) || Number(form.price) <= 0) {
      Alert.alert('Validation', 'Please enter a valid price.');
      return false;
    }
    if (
      !form.preparationTime.trim() ||
      isNaN(Number(form.preparationTime)) ||
      Number(form.preparationTime) < 1
    ) {
      Alert.alert('Validation', 'Please enter a valid preparation time.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        category: form.category,
        dietaryTags: form.dietaryTags,
        preparationTime: Number(form.preparationTime),
        imageUrl: form.imageUrl || undefined,
        isAvailable: form.isAvailable,
      };

      if (editingItem) {
        await api.put(`/menu-items/${editingItem.id}`, payload);
      } else {
        await api.post('/restaurants/me/menu', payload);
      }
      setModalVisible(false);
      fetchMenu();
    } catch {
      Alert.alert('Error', 'Failed to save menu item.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/menu-items/${id}`);
      setDeleteConfirm(null);
      fetchMenu();
    } catch {
      Alert.alert('Error', 'Failed to delete menu item.');
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      await api.patch(`/menu-items/${item.id}/availability`, { isAvailable: !item.isAvailable });
      setMenuItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i)),
      );
    } catch {
      Alert.alert('Error', 'Failed to update availability.');
    }
  };

  if (loading) return <Loading message="Loading menu..." />;
  if (error && menuItems.length === 0) return <ErrorState message={error} onRetry={fetchMenu} />;

  return (
    <View style={styles.container}>
      {/* Category Tabs */}
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryTab, activeCategory === item && styles.activeCategoryTab]}
              onPress={() => setActiveCategory(item)}
            >
              <Text
                style={[styles.categoryText, activeCategory === item && styles.activeCategoryText]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Menu Items */}
      {filteredItems.length === 0 ? (
        <EmptyState title="No Items" subtitle="Add your first menu item." icon="🍽️" />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.menuCard}>
              <View style={styles.menuHeader}>
                <View style={styles.menuInfo}>
                  <Text style={styles.menuName}>{item.name}</Text>
                  <Text style={styles.menuDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
                <Text style={styles.menuPrice}>${item.price.toFixed(2)}</Text>
              </View>

              <View style={styles.menuTags}>
                {item.dietaryTags.map((tag) => (
                  <View key={tag} style={styles.dietaryTag}>
                    <Text style={styles.dietaryTagText}>{tag}</Text>
                  </View>
                ))}
                <View
                  style={[
                    styles.dietaryTag,
                    { backgroundColor: item.isAvailable ? '#E8F5E9' : '#FFEBEE' },
                  ]}
                >
                  <Text
                    style={[
                      styles.dietaryTagText,
                      { color: item.isAvailable ? colors.success : colors.error },
                    ]}
                  >
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </Text>
                </View>
              </View>

              <View style={styles.menuActions}>
                <Switch
                  value={item.isAvailable}
                  onValueChange={() => toggleAvailability(item)}
                  trackColor={{ false: colors.border, true: colors.success + '60' }}
                  thumbColor={item.isAvailable ? colors.success : colors.textSecondary}
                />
                <View style={styles.actionBtns}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => setDeleteConfirm(item.id)}
                  >
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingItem ? 'Edit Item' : 'Add Item'}</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.fieldLabel}>Name *</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
              placeholder="Item name"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.description}
              onChangeText={(t) => setForm((f) => ({ ...f, description: t }))}
              placeholder="Item description"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.fieldLabel}>Price *</Text>
            <TextInput
              style={styles.input}
              value={form.price}
              onChangeText={(t) => setForm((f) => ({ ...f, price: t }))}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
            />

            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categorySelector}
            >
              {DEFAULT_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, form.category === cat && styles.activeCategoryChip]}
                  onPress={() => setForm((f) => ({ ...f, category: cat }))}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      form.category === cat && styles.activeCategoryChipText,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Dietary Tags</Text>
            <View style={styles.tagsContainer}>
              {DIETARY_OPTIONS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagChip, form.dietaryTags.includes(tag) && styles.activeTagChip]}
                  onPress={() => toggleDietaryTag(tag)}
                >
                  <Text
                    style={[
                      styles.tagChipText,
                      form.dietaryTags.includes(tag) && styles.activeTagChipText,
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Preparation Time (minutes) *</Text>
            <TextInput
              style={styles.input}
              value={form.preparationTime}
              onChangeText={(t) => setForm((f) => ({ ...f, preparationTime: t }))}
              placeholder="15"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
            />

            <Text style={styles.fieldLabel}>Image URL</Text>
            <TextInput
              style={styles.input}
              value={form.imageUrl}
              onChangeText={(t) => setForm((f) => ({ ...f, imageUrl: t }))}
              placeholder="https://example.com/image.jpg"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
            />

            <View style={styles.availabilityRow}>
              <Text style={styles.fieldLabel}>Available</Text>
              <Switch
                value={form.isAvailable}
                onValueChange={(v) => setForm((f) => ({ ...f, isAvailable: v }))}
                trackColor={{ false: colors.border, true: colors.success + '60' }}
                thumbColor={form.isAvailable ? colors.success : colors.textSecondary}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Item'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Delete Confirmation */}
      <Modal visible={deleteConfirm !== null} transparent animationType="fade">
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteModal}>
            <Text style={styles.deleteTitle}>Delete Item?</Text>
            <Text style={styles.deleteMessage}>This action cannot be undone.</Text>
            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={styles.deleteCancelBtn}
                onPress={() => setDeleteConfirm(null)}
              >
                <Text style={styles.deleteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirmBtn}
                onPress={() => deleteConfirm && handleDelete(deleteConfirm)}
              >
                <Text style={styles.deleteConfirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  categoryContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryList: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  activeCategoryTab: { backgroundColor: colors.primary },
  categoryText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  activeCategoryText: { color: '#FFFFFF', fontWeight: '600' },
  listContent: { padding: spacing.md, paddingBottom: 100 },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  menuHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  menuInfo: { flex: 1, marginRight: spacing.md },
  menuName: { fontSize: 16, fontWeight: '600', color: colors.text },
  menuDescription: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  menuPrice: { fontSize: 16, fontWeight: '700', color: colors.primary },
  menuTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: spacing.sm },
  dietaryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  dietaryTagText: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  menuActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtns: { flexDirection: 'row', gap: spacing.sm },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary + '15',
  },
  editBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.error + '15',
  },
  deleteBtnText: { fontSize: 13, fontWeight: '600', color: colors.error },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: { elevation: 6 },
    }),
  },
  fabText: { fontSize: 28, color: '#FFFFFF', fontWeight: '300', lineHeight: 30 },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.primary,
  },
  modalCancel: { color: '#FFFFFF', fontSize: 16 },
  modalTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  modalContent: { padding: spacing.lg, paddingBottom: 60 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: '#FFFFFF',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  categorySelector: { marginTop: spacing.sm },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  activeCategoryChip: { backgroundColor: colors.primary },
  categoryChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  activeCategoryChipText: { color: '#FFFFFF' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeTagChip: { backgroundColor: colors.primary + '15', borderColor: colors.primary },
  tagChipText: { fontSize: 12, color: colors.textSecondary },
  activeTagChipText: { color: colors.primary, fontWeight: '600' },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveBtn: {
    backgroundColor: colors.secondary,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  deleteOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  deleteModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '80%',
    maxWidth: 320,
  },
  deleteTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  deleteMessage: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.lg },
  deleteActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  deleteCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  deleteCancelText: { fontSize: 14, fontWeight: '600', color: colors.text },
  deleteConfirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    backgroundColor: colors.error,
  },
  deleteConfirmText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
});
