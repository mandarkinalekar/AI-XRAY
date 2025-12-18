import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Linking } from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { db, storage, auth } from '../firebase';
import dayjs from 'dayjs';
import { signOut } from 'firebase/auth';
import styles, { colors } from '../styles';

export default function DashboardScreen({ navigation }) {
  const [uploads, setUploads] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'uploads'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('uploadedAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUploads(items);
    });
    return unsub;
  }, []);

  const openFile = async (item) => {
    try {
      const url = await getDownloadURL(ref(storage, item.storagePath));
      Linking.openURL(url);
    } catch (e) {
      alert('Could not open file: ' + e.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.navigate('Upload')} style={{...styles.button, paddingHorizontal:14}}>
          <Text style={styles.buttonText}>Upload</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => signOut(auth)} style={{padding:8}}>
          <Text style={{color: colors.danger}}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={uploads}
        keyExtractor={(item) => item.id}
        renderItem={({item}) => (
          <TouchableOpacity onPress={() => openFile(item)} style={styles.card}>
            <Text style={styles.fileName}>{item.fileName}</Text>
            <Text style={styles.fileDate}>{item.uploadedAt?.toDate ? dayjs(item.uploadedAt.toDate()).format('YYYY-MM-DD HH:mm') : 'Processing...'}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{color:'#666'}}>No uploads yet.</Text>}
      />
    </View>
  );
}
