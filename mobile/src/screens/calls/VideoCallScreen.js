import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../services/socket';
import api from '../../services/api';

const { width, height } = Dimensions.get('window');

export default function VideoCallScreen({ route, navigation }) {
  const { contact, type, callId: incomingCallId } = route.params;
  const { user } = useAuth();
  
  const [callStatus, setCallStatus] = useState(type === 'incoming' ? 'incoming' : 'calling');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callId, setCallId] = useState(incomingCallId || null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const durationInterval = useRef(null);

  useEffect(() => {
    if (type === 'outgoing') {
      initiateCall();
    }
    
    setupSocketListeners();
    startPulseAnimation();

    return () => {
      removeSocketListeners();
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, []);

  const setupSocketListeners = () => {
    const socket = getSocket();
    if (socket) {
      socket.on('call_accepted', handleCallAccepted);
      socket.on('call_rejected', handleCallRejected);
      socket.on('call_ended', handleCallEnded);
    }
  };

  const removeSocketListeners = () => {
    const socket = getSocket();
    if (socket) {
      socket.off('call_accepted', handleCallAccepted);
      socket.off('call_rejected', handleCallRejected);
      socket.off('call_ended', handleCallEnded);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        })
      ])
    ).start();
  };

  const initiateCall = async () => {
    try {
      const response = await api.post('/communication/calls', {
        receiverId: contact.id,
        type: 'VIDEO'
      });
      setCallId(response.data.call.id);

      // Emitir via socket
      const socket = getSocket();
      if (socket) {
        socket.emit('initiate_call', {
          callId: response.data.call.id,
          receiverId: contact.id,
          callerName: user.name
        });
      }

      // Simular timeout de chamada (30 segundos)
      setTimeout(() => {
        if (callStatus === 'calling') {
          handleEndCall();
        }
      }, 30000);
    } catch (error) {
      console.error('Erro ao iniciar chamada:', error);
      navigation.goBack();
    }
  };

  const handleCallAccepted = (data) => {
    if (data.callId === callId) {
      setCallStatus('connected');
      startDurationTimer();
    }
  };

  const handleCallRejected = (data) => {
    if (data.callId === callId) {
      setCallStatus('rejected');
      setTimeout(() => navigation.goBack(), 2000);
    }
  };

  const handleCallEnded = (data) => {
    if (data.callId === callId) {
      setCallStatus('ended');
      setTimeout(() => navigation.goBack(), 1500);
    }
  };

  const startDurationTimer = () => {
    durationInterval.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const handleAcceptCall = async () => {
    try {
      await api.post(`/communication/calls/${callId}/answer`);
      
      const socket = getSocket();
      if (socket) {
        socket.emit('accept_call', { callId });
      }

      setCallStatus('connected');
      startDurationTimer();
    } catch (error) {
      console.error('Erro ao atender chamada:', error);
    }
  };

  const handleRejectCall = async () => {
    try {
      await api.post(`/communication/calls/${callId}/reject`);
      
      const socket = getSocket();
      if (socket) {
        socket.emit('reject_call', { callId });
      }

      navigation.goBack();
    } catch (error) {
      console.error('Erro ao rejeitar chamada:', error);
      navigation.goBack();
    }
  };

  const handleEndCall = async () => {
    try {
      if (callId) {
        await api.post(`/communication/calls/${callId}/end`);
        
        const socket = getSocket();
        if (socket) {
          socket.emit('end_call', { callId });
        }
      }
    } catch (error) {
      console.error('Erro ao encerrar chamada:', error);
    } finally {
      navigation.goBack();
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'calling':
        return 'Chamando...';
      case 'incoming':
        return 'Chamada recebida';
      case 'connected':
        return formatDuration(callDuration);
      case 'rejected':
        return 'Chamada rejeitada';
      case 'ended':
        return 'Chamada encerrada';
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={styles.background}
      >
        {/* Remote Video Placeholder */}
        <View style={styles.remoteVideoContainer}>
          <LinearGradient
            colors={contact.role === 'JANITOR' ? ['#f59e0b', '#d97706'] : ['#3b82f6', '#2563eb']}
            style={styles.avatarLarge}
          >
            <Animated.View style={{ transform: [{ scale: callStatus === 'calling' || callStatus === 'incoming' ? pulseAnim : 1 }] }}>
              <Text style={styles.avatarTextLarge}>
                {contact.name?.charAt(0).toUpperCase()}
              </Text>
            </Animated.View>
          </LinearGradient>
        </View>

        {/* Contact Info */}
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{contact.name}</Text>
          <Text style={styles.contactRole}>
            {contact.role === 'JANITOR' ? 'Zelador' : 
             contact.role === 'VISITOR' ? 'Visitante' :
             contact.unit ? `${contact.unit.block?.name} - Apt. ${contact.unit.number}` : 'Morador'}
          </Text>
          <Text style={styles.callStatus}>{getStatusText()}</Text>
        </View>

        {/* Local Video Placeholder */}
        {callStatus === 'connected' && !isVideoOff && (
          <View style={styles.localVideoContainer}>
            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              style={styles.localVideo}
            >
              <Text style={styles.localVideoText}>
                {user?.name?.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controlsContainer}>
          {callStatus === 'incoming' ? (
            // Incoming call controls
            <View style={styles.incomingControls}>
              <TouchableOpacity
                style={[styles.controlButton, styles.rejectButton]}
                onPress={handleRejectCall}
              >
                <Ionicons name="close" size={32} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, styles.acceptButton]}
                onPress={handleAcceptCall}
              >
                <Ionicons name="videocam" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : callStatus === 'connected' ? (
            // Connected call controls
            <View style={styles.connectedControls}>
              <View style={styles.topControls}>
                <TouchableOpacity
                  style={[styles.smallControlButton, isMuted && styles.activeControl]}
                  onPress={() => setIsMuted(!isMuted)}
                >
                  <Ionicons 
                    name={isMuted ? 'mic-off' : 'mic'} 
                    size={24} 
                    color={isMuted ? '#ef4444' : '#fff'} 
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallControlButton, isVideoOff && styles.activeControl]}
                  onPress={() => setIsVideoOff(!isVideoOff)}
                >
                  <Ionicons 
                    name={isVideoOff ? 'videocam-off' : 'videocam'} 
                    size={24} 
                    color={isVideoOff ? '#ef4444' : '#fff'} 
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallControlButton, !isSpeakerOn && styles.activeControl]}
                  onPress={() => setIsSpeakerOn(!isSpeakerOn)}
                >
                  <Ionicons 
                    name={isSpeakerOn ? 'volume-high' : 'volume-off'} 
                    size={24} 
                    color={!isSpeakerOn ? '#ef4444' : '#fff'} 
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.controlButton, styles.endButton]}
                onPress={handleEndCall}
              >
                <Ionicons name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
              </TouchableOpacity>
            </View>
          ) : (
            // Calling/Ended controls
            <TouchableOpacity
              style={[styles.controlButton, styles.endButton]}
              onPress={handleEndCall}
            >
              <Ionicons name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  background: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 60
  },
  remoteVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarLarge: {
    width: 150,
    height: 150,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10
  },
  avatarTextLarge: {
    color: '#fff',
    fontSize: 64,
    fontWeight: 'bold'
  },
  contactInfo: {
    alignItems: 'center',
    marginBottom: 40
  },
  contactName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  contactRole: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 8
  },
  callStatus: {
    fontSize: 18,
    color: '#3b82f6'
  },
  localVideoContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  localVideo: {
    width: 100,
    height: 140,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  localVideoText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold'
  },
  controlsContainer: {
    alignItems: 'center'
  },
  incomingControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 60
  },
  connectedControls: {
    alignItems: 'center'
  },
  topControls: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 20
  },
  controlButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center'
  },
  smallControlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  activeControl: {
    backgroundColor: 'rgba(255,255,255,0.3)'
  },
  acceptButton: {
    backgroundColor: '#10b981'
  },
  rejectButton: {
    backgroundColor: '#ef4444'
  },
  endButton: {
    backgroundColor: '#ef4444'
  }
});
