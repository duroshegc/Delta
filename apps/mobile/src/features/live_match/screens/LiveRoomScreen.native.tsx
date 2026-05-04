import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  AudioSession,
  isTrackReference,
  LiveKitRoom,
  useRoomContext,
  useTracks,
  VideoTrack,
} from '@livekit/react-native';
import { Track } from 'livekit-client';
import { AppColors, BorderRadius, Spacing, Typography } from '../../../core/theme';
import { LiveMatchStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<LiveMatchStackParamList, 'LiveRoom'>;

export const LiveRoomScreen: React.FC<Props> = ({ navigation, route }) => {
  useEffect(() => {
    AudioSession.startAudioSession();
    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);

  return (
    <LiveKitRoom
      serverUrl={route.params.serverUrl}
      token={route.params.token}
      connect
      audio
      video
      options={{ adaptiveStream: { pixelDensity: 'screen' } }}
    >
      <RoomContent roomName={route.params.roomName} onLeave={() => navigation.popToTop()} />
    </LiveKitRoom>
  );
};

const RoomContent: React.FC<{ roomName: string; onLeave: () => void }> = ({ roomName, onLeave }) => {
  const room = useRoomContext();
  const tracks = useTracks([Track.Source.Camera]);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);

  const sortedTracks = useMemo(
    () =>
      [...tracks].sort((a, b) => {
        const aLocal = isTrackReference(a) && a.participant.isLocal ? 1 : 0;
        const bLocal = isTrackReference(b) && b.participant.isLocal ? 1 : 0;
        return aLocal - bLocal;
      }),
    [tracks],
  );

  const toggleCamera = async () => {
    const next = !cameraEnabled;
    setCameraEnabled(next);
    await room.localParticipant.setCameraEnabled(next).catch(() => setCameraEnabled(!next));
  };

  const toggleMic = async () => {
    const next = !micEnabled;
    setMicEnabled(next);
    await room.localParticipant.setMicrophoneEnabled(next).catch(() => setMicEnabled(!next));
  };

  const leave = async () => {
    await room.disconnect().catch(() => undefined);
    onLeave();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Live room</Text>
          <Text style={styles.roomName} numberOfLines={1}>
            {roomName}
          </Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>

      <FlatList
        data={sortedTracks}
        keyExtractor={(item, index) =>
          isTrackReference(item)
            ? `${item.participant.identity}-${item.publication.source}`
            : `placeholder-${index}`
        }
        renderItem={({ item }) => (
          <View style={styles.videoTile}>
            {isTrackReference(item) ? (
              <VideoTrack trackRef={item} style={styles.video} />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>Waiting for camera</Text>
              </View>
            )}
            {isTrackReference(item) && (
              <View style={styles.nameTag}>
                <Text style={styles.nameTagText}>
                  {item.participant.isLocal ? 'You' : item.participant.name || 'Partner'}
                </Text>
              </View>
            )}
          </View>
        )}
        contentContainerStyle={styles.videoList}
      />

      <View style={styles.controls}>
        <ControlButton label={micEnabled ? 'Mute' : 'Unmute'} onPress={toggleMic} />
        <ControlButton label={cameraEnabled ? 'Camera off' : 'Camera on'} onPress={toggleCamera} />
        <ControlButton label="End" danger onPress={leave} />
      </View>
    </View>
  );
};

const ControlButton: React.FC<{ label: string; danger?: boolean; onPress: () => void }> = ({
  label,
  danger,
  onPress,
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.control, danger && styles.controlDanger, pressed && styles.pressed]}
  >
    <Text style={[styles.controlText, danger && styles.controlTextDanger]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.black },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: { ...Typography.caption, color: AppColors.textMuted, textTransform: 'uppercase' },
  roomName: { ...Typography.h3, color: AppColors.white, maxWidth: 240 },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: AppColors.liveGlow,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  liveDot: { width: 8, height: 8, borderRadius: BorderRadius.full, backgroundColor: AppColors.live },
  liveText: { ...Typography.caption, color: AppColors.live },
  videoList: { padding: Spacing.md, gap: Spacing.md },
  videoTile: {
    height: 280,
    backgroundColor: AppColors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  video: { flex: 1 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.surface2 },
  placeholderText: { ...Typography.body, color: AppColors.textSecondary },
  nameTag: {
    position: 'absolute',
    left: Spacing.md,
    bottom: Spacing.md,
    backgroundColor: 'rgba(10, 10, 15, 0.72)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  nameTagText: { ...Typography.caption, color: AppColors.white },
  controls: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.lg,
    backgroundColor: AppColors.black,
  },
  control: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: AppColors.surface,
  },
  controlDanger: { backgroundColor: AppColors.dangerBg },
  controlText: { ...Typography.label, color: AppColors.textPrimary },
  controlTextDanger: { color: AppColors.danger },
  pressed: { opacity: 0.82 },
});
