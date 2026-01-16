/**
 * Serviço de WebRTC para chamadas de vídeo/áudio
 */

// Configuração dos servidores ICE (STUN/TURN)
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ]
};

class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.socket = null;
    this.callId = null;
    this.onRemoteStream = null;
    this.onConnectionStateChange = null;
    this.onIceConnectionStateChange = null;
  }

  /**
   * Inicializar o serviço com o socket
   */
  init(socket) {
    this.socket = socket;
    this.setupSocketListeners();
  }

  /**
   * Configurar listeners do socket para WebRTC
   */
  setupSocketListeners() {
    if (!this.socket) return;

    // Receber oferta SDP
    this.socket.on('webrtc_offer', async (data) => {
      console.log('[WebRTC] Oferta recebida');
      await this.handleOffer(data.offer, data.fromSocketId);
    });

    // Receber resposta SDP
    this.socket.on('webrtc_answer', async (data) => {
      console.log('[WebRTC] Resposta recebida');
      await this.handleAnswer(data.answer);
    });

    // Receber candidato ICE
    this.socket.on('webrtc_ice_candidate', async (data) => {
      console.log('[WebRTC] Candidato ICE recebido');
      await this.handleIceCandidate(data.candidate);
    });

    // Peer desconectou
    this.socket.on('peer_disconnected', () => {
      console.log('[WebRTC] Peer desconectou');
      this.cleanup();
    });

    // Toggle de áudio do peer
    this.socket.on('peer_audio_toggle', (data) => {
      console.log('[WebRTC] Peer áudio:', data.muted ? 'mutado' : 'ativo');
    });

    // Toggle de vídeo do peer
    this.socket.on('peer_video_toggle', (data) => {
      console.log('[WebRTC] Peer vídeo:', data.enabled ? 'ativo' : 'desligado');
    });
  }

  /**
   * Obter stream de mídia local (câmera e microfone)
   */
  async getLocalStream(video = true, audio = true) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false,
        audio: audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      });

      return this.localStream;
    } catch (error) {
      console.error('[WebRTC] Erro ao obter mídia local:', error);
      throw error;
    }
  }

  /**
   * Criar conexão peer
   */
  createPeerConnection() {
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // Adicionar tracks locais
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    // Configurar stream remoto
    this.remoteStream = new MediaStream();

    // Quando receber track remoto
    this.peerConnection.ontrack = (event) => {
      console.log('[WebRTC] Track remoto recebido');
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream.addTrack(track);
      });
      
      if (this.onRemoteStream) {
        this.onRemoteStream(this.remoteStream);
      }
    };

    // Quando gerar candidato ICE
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('webrtc_ice_candidate', {
          callId: this.callId,
          candidate: event.candidate
        });
      }
    };

    // Mudança de estado da conexão
    this.peerConnection.onconnectionstatechange = () => {
      console.log('[WebRTC] Estado da conexão:', this.peerConnection.connectionState);
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(this.peerConnection.connectionState);
      }
    };

    // Mudança de estado ICE
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('[WebRTC] Estado ICE:', this.peerConnection.iceConnectionState);
      if (this.onIceConnectionStateChange) {
        this.onIceConnectionStateChange(this.peerConnection.iceConnectionState);
      }
    };

    return this.peerConnection;
  }

  /**
   * Criar e enviar oferta (para quem inicia a chamada)
   */
  async createOffer(callId, targetSocketId = null) {
    this.callId = callId;
    
    if (!this.peerConnection) {
      this.createPeerConnection();
    }

    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      await this.peerConnection.setLocalDescription(offer);

      if (this.socket) {
        this.socket.emit('webrtc_offer', {
          callId,
          offer,
          targetSocketId
        });
      }

      return offer;
    } catch (error) {
      console.error('[WebRTC] Erro ao criar oferta:', error);
      throw error;
    }
  }

  /**
   * Processar oferta recebida e criar resposta
   */
  async handleOffer(offer, fromSocketId) {
    if (!this.peerConnection) {
      this.createPeerConnection();
    }

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      if (this.socket) {
        this.socket.emit('webrtc_answer', {
          callId: this.callId,
          answer,
          targetSocketId: fromSocketId
        });
      }

      return answer;
    } catch (error) {
      console.error('[WebRTC] Erro ao processar oferta:', error);
      throw error;
    }
  }

  /**
   * Processar resposta recebida
   */
  async handleAnswer(answer) {
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('[WebRTC] Erro ao processar resposta:', error);
      throw error;
    }
  }

  /**
   * Processar candidato ICE recebido
   */
  async handleIceCandidate(candidate) {
    try {
      if (this.peerConnection && candidate) {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('[WebRTC] Erro ao adicionar candidato ICE:', error);
    }
  }

  /**
   * Mutar/desmutar áudio
   */
  toggleAudio(muted) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });

      if (this.socket) {
        this.socket.emit('toggle_audio', {
          callId: this.callId,
          muted
        });
      }
    }
  }

  /**
   * Ligar/desligar vídeo
   */
  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });

      if (this.socket) {
        this.socket.emit('toggle_video', {
          callId: this.callId,
          enabled
        });
      }
    }
  }

  /**
   * Entrar na sala de chamada
   */
  joinCall(callId) {
    this.callId = callId;
    if (this.socket) {
      this.socket.emit('join_call', { callId });
    }
  }

  /**
   * Limpar recursos
   */
  cleanup() {
    // Parar tracks locais
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Fechar peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
    this.callId = null;
  }
}

// Exportar instância única
const webrtcService = new WebRTCService();
export default webrtcService;
