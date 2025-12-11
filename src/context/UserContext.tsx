import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { firestore } from '../config/firebase';
import { useAuth } from './AuthContext';

export type UserData = {
  xp: number;
  caughtPokemon: string[]; // Array of Pokemon IDs
  seenPokemon: string[]; // Array of Pokemon IDs
  currentStreak: number;
  lastActiveDate: string; // ISO date string
  selectedRegion: number;
  achievements: string[];
  username?: string;
  dailyGoalTarget?: number;
  dailyGoalProgress?: number;
};

type UserContextType = {
  userData: UserData | null;
  loading: boolean;
  updateXP: (amount: number) => Promise<void>;
  addCaughtPokemon: (pokemonId: string) => Promise<void>;
  addSeenPokemon: (pokemonId: string) => Promise<void>;
  updateStreak: () => Promise<void>;
  updateRegion: (regionId: number) => Promise<void>;
  updateDailyGoalProgress: (increment?: number) => Promise<void>;
  refreshUserData: () => Promise<void>;
};

const defaultUserData: UserData = {
  xp: 0,
  caughtPokemon: [],
  seenPokemon: [],
  currentStreak: 0,
  lastActiveDate: new Date().toISOString(),
  selectedRegion: 5, // Default to Unova
  achievements: [],
  username: '',
  dailyGoalTarget: 3,
  dailyGoalProgress: 0,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

type UserProviderProps = {
  children: ReactNode;
};

export const UserProvider = ({ children }: UserProviderProps) => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    if (!user) {
      setUserData(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      console.log('🔍 Fetching user data from Firestore for user:', user.uid);
      console.log('📧 User email:', user.email);
      
      const userDocRef = firestore().collection('users').doc(user.uid);
      const userDoc = await userDocRef.get();
      
      if (userDoc.exists) {
        console.log('✅ User document found in Firestore');
        const data = userDoc.data();
        console.log('📊 Raw Firestore data:', data);
        console.log('📊 Data type:', typeof data);
        console.log('📊 Data keys:', data ? Object.keys(data) : 'no keys');
        
        if (data && Object.keys(data).length > 0) {
          // Merge with default data to ensure all fields exist
          const mergedData: UserData = {
            ...defaultUserData,
            ...data,
            // Ensure arrays exist and are arrays
            caughtPokemon: Array.isArray(data.caughtPokemon) ? data.caughtPokemon : defaultUserData.caughtPokemon,
            seenPokemon: Array.isArray(data.seenPokemon) ? data.seenPokemon : defaultUserData.seenPokemon,
            achievements: Array.isArray(data.achievements) ? data.achievements : defaultUserData.achievements,
            // Ensure numbers are numbers
            xp: typeof data.xp === 'number' ? data.xp : defaultUserData.xp,
            currentStreak: typeof data.currentStreak === 'number' ? data.currentStreak : defaultUserData.currentStreak,
            selectedRegion: typeof data.selectedRegion === 'number' ? data.selectedRegion : defaultUserData.selectedRegion,
            // Ensure strings are strings
            lastActiveDate: typeof data.lastActiveDate === 'string' ? data.lastActiveDate : defaultUserData.lastActiveDate,
            username: typeof data.username === 'string' ? data.username : defaultUserData.username,
            dailyGoalTarget:
              typeof data.dailyGoalTarget === 'number'
                ? data.dailyGoalTarget
                : defaultUserData.dailyGoalTarget,
            dailyGoalProgress:
              typeof data.dailyGoalProgress === 'number'
                ? data.dailyGoalProgress
                : defaultUserData.dailyGoalProgress,
          };
          console.log('📊 Merged user data:', mergedData);
          setUserData(mergedData);
        } else {
          console.warn('⚠️ Document exists but is empty or undefined. Recreating with default data...');
          // Document exists but is empty - recreate it
          try {
            await userDocRef.set(defaultUserData);
            console.log('✅ Recreated user document with default data');
            setUserData(defaultUserData);
          } catch (recreateError: any) {
            console.error('❌ Error recreating document:', recreateError);
            setUserData(defaultUserData);
          }
        }
      } else {
        // Create new user document with default data
        console.log('📝 User document NOT found. Creating new document...');
        console.log('📋 Default data:', defaultUserData);
        
        try {
          await userDocRef.set(defaultUserData);
          console.log('✅✅✅ User document created successfully in Firestore!');
          console.log('📊 Document path: users/', user.uid);
          console.log('📝 Document data:', defaultUserData);
          setUserData(defaultUserData);
        } catch (createError: any) {
          console.error('❌❌❌ CRITICAL: Error creating user document:', createError);
          console.error('Error code:', createError?.code);
          console.error('Error message:', createError?.message);
          console.error('Error details:', JSON.stringify(createError, null, 2));
          
          if (createError?.code === 'permission-denied') {
            console.error('⚠️⚠️⚠️ PERMISSION DENIED!');
            console.error('Check your Firestore security rules:');
            console.error('match /users/{userId} {');
            console.error('  allow read, write: if request.auth != null && request.auth.uid == userId;');
            console.error('}');
            console.error('Make sure the rules are PUBLISHED (click Publish button)');
          } else if (createError?.code === 'unavailable') {
            console.error('⚠️ Firestore is unavailable. Check your internet connection.');
          }
          
          // Still set default data locally
          setUserData(defaultUserData);
        }
      }
    } catch (error: any) {
      console.error('❌ Error in fetchUserData:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      
      // Set default data so app doesn't crash
      setUserData(defaultUserData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setUserData(null);
      setLoading(false);
    }
  }, [user]);

  const updateXP = async (amount: number) => {
    if (!user) return;

    const newXP = (userData?.xp || 0) + amount;
    try {
      await firestore().collection('users').doc(user.uid).update({ xp: newXP });
    } catch (error) {
      console.error('Error updating XP in Firestore:', error);
    }
    setUserData(prev => prev ? { ...prev, xp: newXP } : null);
  };

  const addCaughtPokemon = async (pokemonId: string) => {
    if (!user || !userData) return;

    if (userData.caughtPokemon.includes(pokemonId)) return;

    const newCaught = [...userData.caughtPokemon, pokemonId];
    // Also add to seen if not already there
    const newSeen = userData.seenPokemon.includes(pokemonId)
      ? userData.seenPokemon
      : [...userData.seenPokemon, pokemonId];

    // Update local state first (optimistic update)
    setUserData(prev => prev ? {
      ...prev,
      caughtPokemon: newCaught,
      seenPokemon: newSeen,
    } : null);

    // Then sync to Firestore
    try {
      const userDocRef = firestore().collection('users').doc(user.uid);
      const userDoc = await userDocRef.get();
      
      if (userDoc.exists) {
        // Document exists, update it
        await userDocRef.update({
          caughtPokemon: newCaught,
          seenPokemon: newSeen,
        });
        console.log('✅ Updated caught Pokemon in Firestore');
      } else {
        // Document doesn't exist, create it with current userData + new data
        const dataToSet = {
          ...defaultUserData,
          ...userData,
          caughtPokemon: newCaught,
          seenPokemon: newSeen,
        };
        await userDocRef.set(dataToSet);
        console.log('✅ Created user document with caught Pokemon in Firestore');
      }
    } catch (error: any) {
      console.error('❌ Error updating caught Pokemon in Firestore:', error);
      console.error('Error code:', error?.code);
      if (error?.code === 'permission-denied') {
        console.error('⚠️ Permission denied. Check Firestore security rules.');
      } else if (error?.code === 'not-found') {
        console.error('⚠️ User document not found. Trying to create it...');
        try {
          await firestore().collection('users').doc(user.uid).set({
            ...defaultUserData,
            ...userData,
            caughtPokemon: newCaught,
            seenPokemon: newSeen,
          });
          console.log('✅ Created user document after not-found error');
        } catch (createError: any) {
          console.error('❌ Failed to create document:', createError);
        }
      }
    }
  };

  const addSeenPokemon = async (pokemonId: string) => {
    if (!user || !userData) return;

    if (userData.seenPokemon.includes(pokemonId)) return;

    const newSeen = [...userData.seenPokemon, pokemonId];
    
    // Update local state first (optimistic update)
    setUserData(prev => prev ? { ...prev, seenPokemon: newSeen } : null);
    
    // Then sync to Firestore
    try {
      const userDocRef = firestore().collection('users').doc(user.uid);
      const userDoc = await userDocRef.get();
      
      if (userDoc.exists) {
        // Document exists, update it
        await userDocRef.update({
          seenPokemon: newSeen,
        });
        console.log('✅ Updated seen Pokemon in Firestore');
      } else {
        // Document doesn't exist, create it with current userData + new seen
        const dataToSet = {
          ...defaultUserData,
          ...userData,
          seenPokemon: newSeen,
        };
        await userDocRef.set(dataToSet);
        console.log('✅ Created user document with seen Pokemon in Firestore');
      }
    } catch (error: any) {
      console.error('❌ Error updating seen Pokemon in Firestore:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      if (error?.code === 'permission-denied') {
        console.error('⚠️ Permission denied. Make sure Firestore security rules are set up.');
      } else if (error?.code === 'not-found') {
        console.error('⚠️ User document not found. Trying to create it...');
        // Try to create the document
        try {
          await firestore().collection('users').doc(user.uid).set({
            ...defaultUserData,
            ...userData,
            seenPokemon: newSeen,
          });
          console.log('✅ Created user document after not-found error');
        } catch (createError: any) {
          console.error('❌ Failed to create document:', createError);
        }
      }
    }
  };

  const updateDailyGoalProgress = async (increment: number = 1) => {
    if (!user || !userData) return;
    const target = userData.dailyGoalTarget ?? defaultUserData.dailyGoalTarget ?? 3;
    const current = userData.dailyGoalProgress ?? defaultUserData.dailyGoalProgress ?? 0;
    const next = Math.min(target, current + increment);

    setUserData(prev => (prev ? { ...prev, dailyGoalProgress: next } : null));

    try {
      await firestore().collection('users').doc(user.uid).update({
        dailyGoalProgress: next,
      });
    } catch (error: any) {
      console.error('❌ Error updating daily goal progress in Firestore:', error);
    }
  };

  const updateStreak = async () => {
    if (!user || !userData) return;

    const today = new Date().toISOString().split('T')[0];
    const lastActive = userData.lastActiveDate.split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = userData.currentStreak;

    if (lastActive === today) {
      // Already active today, no change
      return;
    } else if (lastActive === yesterdayStr) {
      // Continuing streak
      newStreak += 1;
    } else {
      // Streak broken, reset to 1
      newStreak = 1;
    }

    try {
      await firestore().collection('users').doc(user.uid).update({
        currentStreak: newStreak,
        lastActiveDate: today,
      });
    } catch (error) {
      console.error('Error updating streak in Firestore:', error);
    }

    setUserData(prev => prev ? {
      ...prev,
      currentStreak: newStreak,
      lastActiveDate: today,
    } : null);
  };

  const updateRegion = async (regionId: number) => {
    if (!user) return;

    try {
      await firestore().collection('users').doc(user.uid).update({
        selectedRegion: regionId,
      });
    } catch (error) {
      console.error('Error updating region in Firestore:', error);
    }

    setUserData(prev => prev ? { ...prev, selectedRegion: regionId } : null);
  };

  const refreshUserData = async () => {
    try {
      await fetchUserData();
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  return (
    <UserContext.Provider
      value={{
        userData,
        loading,
        updateXP,
        addCaughtPokemon,
        addSeenPokemon,
        updateStreak,
        updateRegion,
        updateDailyGoalProgress,
        refreshUserData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

