
import { User, PersonalTransaction, Investment, CalendarEvent, Plan, BillingCycle, Language, CreditCard, CreditTransaction, Subscription, SystemNotification } from '../types';
import { db, auth } from './firebase';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    setDoc
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const api = {
    login: async (credentials: any) => {
        // This is a placeholder as the user will likely use Firebase Auth directly now.
        // But let's keep it for compatibility if needed.
        return { error: false, message: "Use Firebase Auth directly." };
    },
    createUser: async (user: Omit<User, 'id'>, userId?: string) => {
        const uid = userId || auth.currentUser?.uid;
        if (!uid) throw new Error("No user ID provided.");
        const userRef = doc(db, 'users', uid);
        try {
            await setDoc(userRef, { ...user });
            return { error: false, success: true, message: "Sucesso" };
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, 'users/' + uid);
            return { error: true, success: false, message: "Erro ao criar usuário" };
        }
    },
    getMe: async (token: string): Promise<User | null> => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) return null;
        const userRef = doc(db, 'users', uid);
        try {
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                return { ...userSnap.data(), id: userSnap.id } as User;
            }
            return null;
        } catch (error) {
            handleFirestoreError(error, OperationType.GET, 'users/' + uid);
            return null;
        }
    },
    updateLanguage: async (language: Language, token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) throw new Error("Unauthorized");
        const userRef = doc(db, 'users', uid);
        try {
            await updateDoc(userRef, { language });
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, 'users/' + uid);
        }
    },
    updatePlan: async (plan: Plan, cycle: BillingCycle, token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) throw new Error("Unauthorized");
        const userRef = doc(db, 'users', uid);
        try {
            await updateDoc(userRef, { plan, billingCycle: cycle });
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, 'users/' + uid);
        }
    },
    getTransactions: async (token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) return [];
        const q = query(collection(db, 'transactions'), where('userId', '==', uid));
        try {
            const snap = await getDocs(q);
            return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as PersonalTransaction));
        } catch (error) {
            handleFirestoreError(error, OperationType.LIST, 'transactions');
            return [];
        }
    },
    createTransaction: async (transaction: Omit<PersonalTransaction, 'id'> & { id?: string }, token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) {
            console.error("Tentativa de criar transação sem UID.");
            throw new Error("Usuário não autenticado no sistema.");
        }
        try {
            const { id, ...data } = transaction;
            const payload = { 
                ...data, 
                amount: Number(data.amount),
                userId: uid,
                createdAt: data.createdAt || new Date().toISOString()
            };
            console.log("Saving Transaction:", payload);
            
            if (id) {
                await updateDoc(doc(db, 'transactions', id), payload);
                return { error: false, id };
            } else {
                const docRef = await addDoc(collection(db, 'transactions'), payload);
                console.log("Transaction created with ID:", docRef.id);
                return { error: false, id: docRef.id };
            }
        } catch (error) {
            console.error("Erro no api.createTransaction:", error);
            handleFirestoreError(error, OperationType.CREATE, 'transactions');
        }
    },
    deleteTransaction: async (id: string, token: string) => {
        try {
            await deleteDoc(doc(db, 'transactions', id));
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, 'transactions/' + id);
        }
    },
    getInvestments: async (token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) return [];
        const q = query(collection(db, 'investments'), where('userId', '==', uid));
        try {
            const snap = await getDocs(q);
            return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Investment));
        } catch (error) {
            handleFirestoreError(error, OperationType.LIST, 'investments');
            return [];
        }
    },
    createInvestment: async (investment: Omit<Investment, 'id'> & { id?: string }, token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) throw new Error("Unauthorized");
        try {
            const { id, ...data } = investment;
            if (id) {
                await updateDoc(doc(db, 'investments', id), { ...data, userId: uid });
                return { error: false, id };
            } else {
                const docRef = await addDoc(collection(db, 'investments'), { ...data, userId: uid });
                return { error: false, id: docRef.id };
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'investments');
        }
    },
    withdrawInvestment: async (id: string, token: string) => {
        // Implement logical withdrawal or just mark as zero
        try {
            await updateDoc(doc(db, 'investments', id), { currentValue: 0 });
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, 'investments/' + id);
        }
    },
    deleteInvestment: async (id: string, token: string) => {
        try {
            await deleteDoc(doc(db, 'investments', id));
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, 'investments/' + id);
        }
    },
    getCalendarEvents: async (token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) return [];
        const q = query(collection(db, 'calendar'), where('userId', '==', uid));
        try {
            const snap = await getDocs(q);
            return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as CalendarEvent));
        } catch (error) {
            handleFirestoreError(error, OperationType.LIST, 'calendar');
            return [];
        }
    },
    createCalendarEvent: async (event: Omit<CalendarEvent, 'id'> & { id?: string }, token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) throw new Error("Unauthorized");
        try {
            const { id, ...data } = event;
            if (id) {
                await updateDoc(doc(db, 'calendar', id), { ...data, userId: uid });
                return { error: false, id };
            } else {
                const docRef = await addDoc(collection(db, 'calendar'), { ...data, userId: uid });
                return { error: false, id: docRef.id };
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'calendar');
        }
    },
    toggleCalendarEvent: async (id: string, done: boolean, token: string) => {
        try {
            await updateDoc(doc(db, 'calendar', id), { done });
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, 'calendar/' + id);
        }
    },
    deleteCalendarEvent: async (id: string, token: string) => {
        try {
            await deleteDoc(doc(db, 'calendar', id));
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, 'calendar/' + id);
        }
    },
    updatePassword: async (data: {currentPassword: string, newPassword: string}, token: string) => {
        // In Firebase, password update is done via auth.currentUser.updatePassword
        // This would require different logic. For now return placeholder or error.
        return { error: true, message: "Use Firebase Auth to update password." };
    },
    updateAvatar: async (data: {avatar: string}, token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) throw new Error("Unauthorized");
        try {
            await updateDoc(doc(db, 'users', uid), { avatar: data.avatar });
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, 'users/' + uid);
        }
    },
    getAllUsers: async (token: string) => {
        // Admin only?
        try {
            const snap = await getDocs(collection(db, 'users'));
            return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
        } catch (error) {
            handleFirestoreError(error, OperationType.LIST, 'users');
            return [];
        }
    },
    toggleUserStatus: async (data: {targetEmail: string, status: string}, token: string) => {
        // Find user by email
        const q = query(collection(db, 'users'), where('email', '==', data.targetEmail));
        try {
            const snap = await getDocs(q);
            if (!snap.empty) {
                const docRef = doc(db, 'users', snap.docs[0].id);
                await updateDoc(docRef, { subscriptionStatus: data.status });
                return { error: false };
            }
            return { error: true, message: "User not found." };
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, 'users (toggleStatus)');
        }
    },
    updateUser: async (uid: string, data: Partial<User>) => {
        try {
            await updateDoc(doc(db, 'users', uid), data);
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, 'users/' + uid);
        }
    },
    getCreditCards: async (token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) return [];
        const q = query(collection(db, 'credit_cards'), where('userId', '==', uid));
        try {
            const snap = await getDocs(q);
            return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as CreditCard));
        } catch (error) {
            handleFirestoreError(error, OperationType.LIST, 'credit_cards');
            return [];
        }
    },
    createCreditCard: async (card: Omit<CreditCard, 'id'> & { id?: string }, token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) throw new Error("Unauthorized");
        try {
            const { id, ...data } = card;
            if (id) {
                await updateDoc(doc(db, 'credit_cards', id), { ...data, userId: uid });
                return { error: false, id };
            } else {
                const docRef = await addDoc(collection(db, 'credit_cards'), { ...data, userId: uid });
                return { error: false, id: docRef.id };
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'credit_cards');
        }
    },
    deleteCreditCard: async (id: string, token: string) => {
        try {
            await deleteDoc(doc(db, 'credit_cards', id));
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, 'credit_cards/' + id);
        }
    },
    getCreditTransactions: async (token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) return [];
        const q = query(collection(db, 'credit_transactions'), where('userId', '==', uid));
        try {
            const snap = await getDocs(q);
            return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as CreditTransaction));
        } catch (error) {
            handleFirestoreError(error, OperationType.LIST, 'credit_transactions');
            return [];
        }
    },
    createCreditTransaction: async (transaction: Omit<CreditTransaction, 'id'> & { id?: string }, token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) throw new Error("Unauthorized");
        try {
            const { id, ...data } = transaction;
            if (id) {
                await updateDoc(doc(db, 'credit_transactions', id), { ...data, userId: uid });
                return { error: false, id };
            } else {
                const docRef = await addDoc(collection(db, 'credit_transactions'), { ...data, userId: uid });
                return { error: false, id: docRef.id };
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'credit_transactions');
        }
    },
    deleteCreditTransaction: async (id: string, token: string) => {
        try {
            await deleteDoc(doc(db, 'credit_transactions', id));
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, 'credit_transactions/' + id);
        }
    },
    saveAiConversation: async (data: { messages: any[], lastUpdate: string }, token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) throw new Error("Unauthorized");
        const docRef = doc(db, 'ai_conversations', uid);
        try {
            await setDoc(docRef, { ...data, userId: uid });
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, 'ai_conversations/' + uid);
        }
    },
    getSubscriptions: async (token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) return [];
        const q = query(collection(db, 'subscriptions'), where('userId', '==', uid));
        try {
            const snap = await getDocs(q);
            return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Subscription));
        } catch (error) {
            handleFirestoreError(error, OperationType.LIST, 'subscriptions');
            return [];
        }
    },
    createSubscription: async (subscription: Omit<Subscription, 'id'> & { id?: string }, token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) throw new Error("Unauthorized");
        try {
            const { id, ...data } = subscription;
            if (id) {
                await updateDoc(doc(db, 'subscriptions', id), { ...data, userId: uid });
                return { error: false, id };
            } else {
                const docRef = await addDoc(collection(db, 'subscriptions'), { ...data, userId: uid });
                return { error: false, id: docRef.id };
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'subscriptions');
        }
    },
    deleteSubscription: async (id: string, token: string) => {
        try {
            await deleteDoc(doc(db, 'subscriptions', id));
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, 'subscriptions/' + id);
        }
    },
    createNotification: async (notification: Omit<SystemNotification, 'id'>, token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) throw new Error("Unauthorized");
        try {
            const docRef = await addDoc(collection(db, 'notifications'), { ...notification });
            return { error: false, id: docRef.id };
        } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'notifications');
        }
    },
    deleteNotification: async (id: string, token: string) => {
        try {
            await deleteDoc(doc(db, 'notifications', id));
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, 'notifications/' + id);
        }
    }
};
