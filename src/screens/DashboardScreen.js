import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Linking, Image, Alert, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { db, storage, auth } from '../firebase';
import dayjs from 'dayjs';
import { signOut } from 'firebase/auth';
import styles, { colors } from '../styles';

// NOTE: requires `expo-image-picker`, `expo-document-picker`, and `expo-image-manipulator`
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';

export default function DashboardScreen({ navigation }) {
  const [uploads, setUploads] = useState([]);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [pendingUpload, setPendingUpload] = useState(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'uploads'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('uploadedAt', 'desc')
    );
    const unsub = onSnapshot(q, async (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // fetch download URLs so we can show thumbnails
      const withUrls = await Promise.all(
        docs.map(async (item) => {
          try {
            const url = await getDownloadURL(ref(storage, item.storagePath));
            return { ...item, downloadURL: url };
          } catch (e) {
            return { ...item, downloadURL: null };
          }
        })
      );
      setUploads(withUrls);
    });
    return unsub;
  }, []);

  const openFile = async (item) => {
    try {
      const url = item.downloadURL || (await getDownloadURL(ref(storage, item.storagePath)));
      Linking.openURL(url);
    } catch (e) {
      Alert.alert('Error', 'Could not open file: ' + e.message);
    }
  };

  const askAddImage = () => {
    Alert.alert('Add Image', 'Choose source', [
      { text: 'Photos', onPress: pickFromPhotos },
      { text: 'Files', onPress: pickFromFiles },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickFromPhotos = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission required', 'Please allow photo access to choose images.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
      if (result.cancelled || result.canceled) return;
      // Newer Expo returns assets array
      const asset = result.assets ? result.assets[0] : result;
      setPendingUpload({ uri: asset.uri, name: asset.fileName || asset.uri.split('/').pop(), mimeType: asset.type || 'image' });
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }; 

  const pickFromFiles = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
      if (res.type === 'cancel') return;
      setPendingUpload({ uri: res.uri, name: res.name || res.name, mimeType: res.mimeType || 'image' });
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }; 

  const uploadUri = async (uri, name = `image_${Date.now()}.jpg`, mimeType = 'image') => {
    setLoadingUpload(true);
    try {
      let uploadUriToUse = uri;
      let finalName = name;

      // If this is an image, attempt to compress/resize to reduce upload size
      if (mimeType && mimeType.toString().startsWith('image')) {
        try {
          const maxWidth = 1024; // target max width
          const manipResult = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: maxWidth } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
          );
          uploadUriToUse = manipResult.uri;
          // ensure filename ends with .jpg
          if (!finalName.toLowerCase().endsWith('.jpg') && !finalName.toLowerCase().endsWith('.jpeg')) {
            finalName = `${finalName.replace(/\.[^/.]+$/, '')}.jpg`;
          }
        } catch (e) {
          // If manipulation fails, continue with original URI
          console.warn('Image manipulation failed, uploading original:', e.message);
        }
      }

      const response = await fetch(uploadUriToUse);
      const blob = await response.blob();
      const storageRef = ref(storage, `uploads/${auth.currentUser.uid}/${Date.now()}_${finalName}`);
      const uploadTask = uploadBytesResumable(storageRef, blob);

      uploadTask.on('state_changed', (snap) => {
        // Could compute progress: snap.bytesTransferred / snap.totalBytes
      });

      await uploadTask;
      const storagePath = storageRef.fullPath;
      const docRef = await addDoc(collection(db, 'uploads'), {
        userId: auth.currentUser.uid,
        fileName: finalName,
        storagePath,
        uploadedAt: serverTimestamp(),
        imageType: mimeType,
        analysis: 'Pending'
      });
      // We'll pick up this doc via snapshot listener which fetches downloadURL
    } catch (e) {
      Alert.alert('Upload failed', e.message);
    } finally {
      setLoadingUpload(false);
    }
  };

  const confirmUpload = async () => {
    if (!pendingUpload) return;
    const { uri, name, mimeType } = pendingUpload;
    // close modal and start upload
    setPendingUpload(null);
    await uploadUri(uri, name, mimeType);
  };

  const cancelUpload = () => setPendingUpload(null);

  const analyzeImage = async (item) => {
    setAnalyzingId(item.id);
    try {
      // Placeholder analysis - replace with real ML call or cloud function if available
      const analysisResult = 'No issues detected';
      await updateDoc(doc(db, 'uploads', item.id), { analysis: analysisResult });
      Alert.alert('Analysis complete', analysisResult);
    } catch (e) {
      Alert.alert('Analysis failed', e.message);
    } finally {
      setAnalyzingId(null);
    }
  }; 

  const renderHeader = () => (
    <View style={localStyles.headerRow}>
      <View style={{flexDirection: 'row', alignItems:'center'}}>
        <TouchableOpacity onPress={askAddImage} style={{...styles.button, paddingHorizontal:14}}>
          <Text style={styles.buttonText}>Add Image</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Upload')} style={{...styles.button, marginLeft:8, paddingHorizontal:14}}>
          <Text style={styles.buttonText}>Upload File</Text>
        </TouchableOpacity>
      </View>

      <View style={{flexDirection:'row', alignItems:'center'}}>
        <TouchableOpacity onPress={() => signOut(auth)} style={{padding:8}}>
          <Text style={{color: colors.danger}}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTableHeader = () => (
    <View style={localStyles.tableHeader}>
      <Text style={[localStyles.cell, localStyles.colImage]}>Uploaded Image</Text>
      <Text style={[localStyles.cell, localStyles.colDate]}>Date & Time</Text>
      <Text style={[localStyles.cell, localStyles.colType]}>Image Type</Text>
      <Text style={[localStyles.cell, localStyles.colAnalysis]}>Image Analysis</Text>
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={localStyles.tableRow}>
      <TouchableOpacity onPress={() => openFile(item)} style={[localStyles.cell, localStyles.colImage]}>
        {item.downloadURL ? (
          <Image source={{ uri: item.downloadURL }} style={localStyles.thumb} />
        ) : (
          <View style={localStyles.thumbPlaceholder}><Text style={{color:'#777'}}>No preview</Text></View>
        )}
      </TouchableOpacity>

      <Text style={[localStyles.cell, localStyles.colDate]}>{item.uploadedAt?.toDate ? dayjs(item.uploadedAt.toDate()).format('YYYY-MM-DD HH:mm') : 'Processing...'}</Text>

      <Text style={[localStyles.cell, localStyles.colType]}>{item.imageType || 'Unknown'}</Text>

      <View style={[localStyles.cell, localStyles.colAnalysis, {flexDirection:'row', alignItems:'center'}]}>
        <Text style={{flex:1}}>{item.analysis || 'Pending'}</Text>
        <TouchableOpacity onPress={() => analyzeImage(item)} disabled={analyzingId === item.id} style={{padding:6}}>
          {analyzingId === item.id ? <ActivityIndicator /> : <Text style={{color: colors.primary}}>Analyze</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      <Modal visible={!!pendingUpload} transparent animationType="slide" onRequestClose={cancelUpload}>
        <View style={localStyles.modalContainer}>
          <View style={localStyles.modalContent}>
            {pendingUpload?.uri ? <Image source={{ uri: pendingUpload.uri }} style={localStyles.modalImage} /> : null}
            <Text style={{marginTop:8}} numberOfLines={2}>{pendingUpload?.name}</Text>
            <View style={localStyles.modalButtons}>
              <TouchableOpacity onPress={cancelUpload} style={[styles.button, {backgroundColor:'#ccc', marginRight:8}]}> 
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmUpload} style={styles.button} disabled={loadingUpload}>
                {loadingUpload ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirm Upload</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{marginTop:12}}>
        {renderTableHeader()}
        {loadingUpload ? <ActivityIndicator style={{marginTop:12}} /> : null}
        <FlatList
          data={uploads}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          ListEmptyComponent={<View style={localStyles.emptyRow}><Text style={{color:'#666'}}>No uploads yet.</Text></View>}
        />
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tableHeader: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tableRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', alignItems: 'center' },
  cell: { paddingHorizontal: 8, justifyContent: 'center' },
  colImage: { flex: 2 },
  colDate: { flex: 2 },
  colType: { flex: 1 },
  colAnalysis: { flex: 2 },
  thumb: { width: 80, height: 60, borderRadius: 4, resizeMode: 'cover' },
  thumbPlaceholder: { width: 80, height: 60, borderRadius: 4, backgroundColor: '#fafafa', justifyContent: 'center', alignItems: 'center' },
  emptyRow: { padding: 16, alignItems: 'center' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { width: '90%', backgroundColor: '#fff', padding: 16, borderRadius: 8, alignItems: 'center' },
  modalImage: { width: 200, height: 150, borderRadius: 6, resizeMode: 'cover' },
  modalButtons: { flexDirection: 'row', marginTop: 12 }
});
