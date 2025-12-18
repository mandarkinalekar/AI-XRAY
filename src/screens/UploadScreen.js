import React, { useState } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, storage, db } from '../firebase';
import styles from '../styles';

export default function UploadScreen({ navigation }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState(null);

  const pickAndUpload = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (res.type !== 'success') return;
      setFileName(res.name);
      setUploading(true);
      setProgress(0);

      const response = await fetch(res.uri);
      const blob = await response.blob();

      const path = `uploads/${auth.currentUser.uid}/${Date.now()}_${res.name}`;
      const storageRef = ref(storage, path);

      const uploadTask = uploadBytesResumable(storageRef, blob);
      uploadTask.on('state_changed', (snapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setProgress(pct);
      }, (err) => {
        throw err;
      }, async () => {
        await addDoc(collection(db, 'uploads'), {
          userId: auth.currentUser.uid,
          fileName: res.name,
          storagePath: path,
          uploadedAt: serverTimestamp(),
        });
        setUploading(false);
        setProgress(0);
        setFileName(null);
        navigation.navigate('Dashboard');
      });

    } catch (e) {
      setUploading(false);
      setProgress(0);
      setFileName(null);
      alert('Upload error: ' + e.message);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickAndUpload} disabled={uploading} style={[styles.button, uploading && styles.buttonDisabled]}>
        {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Pick & Upload File</Text>}
      </TouchableOpacity>

      {fileName ? <Text style={{marginTop:12}}>Uploading: {fileName} ({progress}%)</Text> : <Text style={{marginTop:12,color:'#666'}}>Supported: pick any file</Text>}
    </View>
  );
}
