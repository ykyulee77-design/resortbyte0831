import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface CompanyInfoDoc {
  name?: string;
  companyName?: string;
  address?: string;
  companyAddress?: string;
  contactPhone?: string;
  phone?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  benefits?: string[];
  [key: string]: any;
}

export const useCompanyInfo = (employerId?: string) => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfoDoc | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!employerId) return;
    setLoading(true);
    setError(null);
    try {
      const ref = doc(db, 'companyInfo', employerId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setCompanyInfo(snap.data() as CompanyInfoDoc);
      } else {
        setCompanyInfo(null);
      }
    } catch (e: any) {
      setError(e?.message || '회사 정보 로딩 실패');
    } finally {
      setLoading(false);
    }
  }, [employerId]);

  const save = useCallback(
    async (data: CompanyInfoDoc) => {
      if (!employerId) return;
      const ref = doc(db, 'companyInfo', employerId);
      await setDoc(ref, { ...data, employerId, updatedAt: new Date() }, { merge: true });
      await fetch();
    },
    [employerId, fetch],
  );

  const update = useCallback(
    async (data: CompanyInfoDoc) => {
      if (!employerId) return;
      const ref = doc(db, 'companyInfo', employerId);
      await updateDoc(ref, { ...data, updatedAt: new Date() });
      await fetch();
    },
    [employerId, fetch],
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { companyInfo, loading, error, refresh: fetch, save, update };
};


