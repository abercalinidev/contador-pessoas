// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [peopleCount, setPeopleCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [facing, setFacing] = useState('back'); // 'back' ou 'front'
  const cameraRef = useRef(null);

  // Solicita permissão ao iniciar
  useEffect(() => {
    if (permission?.granted === false) {
      requestPermission();
    }
  }, []);

  // Captura frames a cada 1 segundo quando a câmera estiver pronta
  useEffect(() => {
    if (!cameraReady || !showCamera) return;

    const interval = setInterval(() => {
      captureFrame();
    }, 1000);

    return () => clearInterval(interval);
  }, [cameraReady, showCamera]);

  const captureFrame = async () => {
    if (!cameraRef.current || sending) return;

    try {
      setSending(true);

      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.3,
      });

      const response = await axios.post('http://192.168.0.107:8000/process', {
        image: photo.base64,
      });

      setPeopleCount(response.data.people || 0);
    } catch (error) {
      console.log('Erro ao enviar frame:', error.message);
    } finally {
      setSending(false);
    }
  };

  const toggleFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  // Tela de permissão
  if (!permission || permission.granted === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Checando permissão da câmera...</Text>
      </View>
    );
  }

  if (permission.granted === false) {
    return (
      <View style={styles.centered}>
        <Text>Permissão da câmera negada. Por favor, habilite nas configurações.</Text>
      </View>
    );
  }

  // Tela inicial
  if (!showCamera) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Contador de Pessoas</Text>
        <Button title="Abrir Câmera" onPress={() => setShowCamera(true)} />
      </View>
    );
  }

  // Tela da câmera
  return (
    <View style={{ flex: 1 }}>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        cameraType={facing} // usa string 'back' ou 'front'
        onCameraReady={() => setCameraReady(true)}
      />

      <View style={styles.overlay}>
        <Text style={styles.text}>Pessoas detectadas: {peopleCount}</Text>
      </View>

      <View style={styles.buttons}>
        <Button title="Fechar Câmera" onPress={() => setShowCamera(false)} />
        <Button title="Trocar Câmera" onPress={toggleFacing} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderRadius: 8,
  },
  text: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  buttons: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});
