import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alarm } from './types';
import { Streak } from './logic';
const K = 'alarms.v1';
export async function loadAlarms(): Promise<Alarm[]> {
  try { return JSON.parse((await AsyncStorage.getItem(K)) || '[]'); } catch { return []; }
}
export async function saveAlarms(a: Alarm[]) { await AsyncStorage.setItem(K, JSON.stringify(a)); }
export async function loadStreak(): Promise<Streak> {
  try { return JSON.parse((await AsyncStorage.getItem('streak.v1')) || '{"count":0,"last":""}'); } catch { return { count: 0, last: '' }; }
}
export async function saveStreak(s: Streak) { await AsyncStorage.setItem('streak.v1', JSON.stringify(s)); }
