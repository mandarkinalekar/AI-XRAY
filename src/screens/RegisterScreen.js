import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import styles, { colors } from '../styles';
import { isValidEmail } from '../utils/validators';

function passwordStrength(pw) {
  if (!pw) return { label: 'Too short', color: '#ef4444' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: 'Weak', color: '#f97316' };
  if (score === 2) return { label: 'Medium', color: '#f59e0b' };
  return { label: 'Strong', color: '#10b981' };
}

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
    setError('');
    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (!isValidEmail(email)) { setError('Please enter a valid email.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (confirm !== password) { setError('Passwords do not match.'); return; }
    if (!agree) { setError('Please accept the terms and conditions.'); return; }

    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), password);
      // set display name and send verification email
      await updateProfile(res.user, { displayName: name.trim() });
      await sendEmailVerification(res.user);
      Alert.alert('Verification sent', 'A verification email has been sent to your address. Please verify before logging in.');
      await signOut(auth);
      navigation.navigate('Login');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = passwordStrength(password);
  const isDisabled = loading || !name.trim() || !isValidEmail(email) || password.length < 8 || confirm !== password || !agree;

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Full name"
        value={name}
        onChangeText={setName}
        style={styles.input}
        autoCapitalize="words"
      />

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View>
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{position:'absolute',right:10,top:12}}>
          <Text style={{color: colors.primary}}>{showPassword ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Confirm password"
        value={confirm}
        onChangeText={setConfirm}
        style={styles.input}
        secureTextEntry
        autoCapitalize="none"
      />

      <Text style={{color: pwStrength.color, marginBottom: 8}}>Password strength: {pwStrength.label}</Text>

      <View style={{flexDirection:'row',alignItems:'center',marginBottom:8}}>
        <TouchableOpacity onPress={() => setAgree(!agree)} style={{marginRight:8}}>
          <Text style={{fontSize:18}}>{agree ? '☑' : '☐'}</Text>
        </TouchableOpacity>
        <Text style={{color: colors.muted}}>I agree to the Terms & Conditions</Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        onPress={onRegister}
        disabled={isDisabled}
        style={[styles.button, isDisabled && styles.buttonDisabled]}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{marginTop:12,alignItems:'center'}}>
        <Text style={{color: colors.muted}}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}
