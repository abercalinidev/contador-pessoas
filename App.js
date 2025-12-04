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

  const [cameraWidth, setCameraWidth] = useState(0);
  const [cameraHeight, setCameraHeight] = useState(0);
  const [boxes, setBoxes] = useState([]); // Armazena coordenadas das pessoas

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

      // Contagem de pessoas
      setPeopleCount(response.data.people || 0);

      // Recebe caixas do servidor (opcional)
      const detectedBoxes = response.data.boxes || []; // precisa do backend enviar boxes [x1,y1,x2,y2]
      
      // Normaliza para a tela
      const scaleX = cameraWidth / photo.width;
      const scaleY = cameraHeight / photo.height;

      const normalizedBoxes = detectedBoxes.map(box => ({
        x: box[0] * scaleX,
        y: box[1] * scaleY,
        width: (box[2] - box[0]) * scaleX,
        height: (box[3] - box[1]) * scaleY,
      }));

      setBoxes(normalizedBoxes);

    } catch (error) {
      console.log('Erro ao enviar frame:', error.message);
    } finally {
      setSending(false);
    }
  };

  const toggleFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  // Permissão
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
        cameraType={facing}
        onCameraReady={() => setCameraReady(true)}
        onLayout={e => {
          setCameraWidth(e.nativeEvent.layout.width);
          setCameraHeight(e.nativeEvent.layout.height);
        }}
      />

      {/* Retângulos das pessoas */}
      {boxes.map((box, index) => (
        <View
          key={index}
          style={{
            position: 'absolute',
            left: box.x,
            top: box.y,
            width: box.width,
            height: box.height,
            borderWidth: 2,
            borderColor: 'red',
            borderRadius: 4,
          }}
        />
      ))}

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
