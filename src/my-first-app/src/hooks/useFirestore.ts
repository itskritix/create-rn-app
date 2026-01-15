import firestore from "@react-native-firebase/firestore";

export function useFirestore() {
  const getDoc = async <T>(collection: string, docId: string): Promise<T | null> => {
    const doc = await firestore().collection(collection).doc(docId).get();
    return doc.exists ? (doc.data() as T) : null;
  };

  const setDoc = async <T extends object>(
    collection: string,
    docId: string,
    data: T
  ) => {
    await firestore().collection(collection).doc(docId).set(data);
  };

  const addDoc = async <T extends object>(collection: string, data: T) => {
    const ref = await firestore().collection(collection).add(data);
    return ref.id;
  };

  const deleteDoc = async (collection: string, docId: string) => {
    await firestore().collection(collection).doc(docId).delete();
  };

  const query = <T>(collection: string) => {
    return firestore().collection(collection) as FirebaseFirestoreTypes.CollectionReference<T>;
  };

  return { getDoc, setDoc, addDoc, deleteDoc, query };
}

import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
