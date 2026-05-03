import React from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppColors, BorderRadius, Spacing, Typography } from '../../../core/theme';
import { useProfileStore } from '../store';

interface Props {
  /** Cap (Hinge-style 6-grid by default). */
  max?: number;
}

export const PhotoGrid: React.FC<Props> = ({ max = 6 }) => {
  const profile = useProfileStore((s) => s.profile);
  const uploadPhoto = useProfileStore((s) => s.uploadPhoto);
  const removePhoto = useProfileStore((s) => s.removePhoto);
  const uploading = useProfileStore((s) => s.uploadingPhoto);

  const photos = profile?.photos ?? [];
  const slots = Array.from({ length: max }, (_, i) => photos[i] ?? null);

  const onPickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photo permission needed', 'Enable photo access to add a profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return;
    try {
      await uploadPhoto(result.assets[0].uri);
    } catch (err: any) {
      Alert.alert('Upload failed', err?.response?.data?.message ?? err.message);
    }
  };

  const onRemove = (id: string) =>
    Alert.alert('Remove photo?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removePhoto(id);
          } catch (err: any) {
            Alert.alert('Could not remove', err?.response?.data?.message ?? err.message);
          }
        },
      },
    ]);

  return (
    <View style={styles.grid}>
      {slots.map((photo, i) => (
        <View key={photo?.id ?? `slot-${i}`} style={styles.slot}>
          {photo ? (
            <Pressable
              onLongPress={() => onRemove(photo.id)}
              style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
            >
              <Image source={{ uri: photo.url }} style={styles.image} />
            </Pressable>
          ) : (
            <Pressable
              onPress={onPickPhoto}
              disabled={uploading}
              style={({ pressed }) => [styles.tile, styles.empty, pressed && styles.pressed]}
            >
              {uploading && i === photos.length ? (
                <ActivityIndicator color={AppColors.primary} />
              ) : (
                <Text style={styles.plus}>＋</Text>
              )}
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  slot: { width: '31.5%', aspectRatio: 1 },
  tile: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    backgroundColor: AppColors.surface2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    borderWidth: 1,
    borderColor: AppColors.surface3,
    borderStyle: 'dashed',
  },
  pressed: { opacity: 0.85 },
  image: { width: '100%', height: '100%' },
  plus: {
    ...Typography.display,
    color: AppColors.textMuted,
  },
});
