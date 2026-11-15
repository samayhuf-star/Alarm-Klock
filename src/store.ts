import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alarm } from './types';
const K = 'alarms.v1';
export async function loadAlarms(): Promise<Alarm[]> {
  try { return JSON.parse((await AsyncStorage.getItem(K)) || '[]'); } catch { return []; }
}
export async function saveAlarms(a: Alarm[]) { await AsyncStorage.setItem(K, JSON.stringify(a)); }
