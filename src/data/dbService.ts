import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  setDoc, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase";
import { Term, BlogPost, AdSlot, UserProfile } from "../types";
import { TERMS, BLOG_SEED, AD_SLOTS, MOCK_USERS } from "./seedData";

// Helper to seed database if empty
export async function seedDatabaseIfEmpty(): Promise<boolean> {
  let didChange = false;
  try {
    // 1. Seed Ad Slots
    const adSlotsCol = collection(db, "ad_slots");
    const adSnapshot = await getDocs(adSlotsCol);
    if (adSnapshot.empty) {
      console.log("Seeding ad slots...");
      for (const slot of AD_SLOTS) {
        await addDoc(adSlotsCol, slot);
      }
      didChange = true;
    } else {
      // Self-healing: Check if any of our standard slots from AD_SLOTS are missing, and add them
      const existingNames = new Set(adSnapshot.docs.map(docSnap => (docSnap.data().name || "").toLowerCase().trim()));
      for (const slot of AD_SLOTS) {
        const slotNameLower = slot.name.toLowerCase().trim();
        if (!existingNames.has(slotNameLower)) {
          console.log(`Self-healing database: Adding missing ad slot: ${slot.name}`);
          await addDoc(adSlotsCol, slot);
          didChange = true;
        }
      }

      // Deduplicate ad slots if any got duplicated
      const seenAd = new Set<string>();
      const toDeleteAd: string[] = [];
      const updatedAdSnapshot = await getDocs(adSlotsCol);
      updatedAdSnapshot.docs.forEach(docSnap => {
        const name = (docSnap.data().name || "").toLowerCase().trim();
        if (seenAd.has(name)) {
          toDeleteAd.push(docSnap.id);
        } else {
          seenAd.add(name);
        }
      });
      if (toDeleteAd.length > 0) {
        console.log(`Cleaning up ${toDeleteAd.length} duplicate ad slots...`);
        let deleteBatch = writeBatch(db);
        for (const id of toDeleteAd) {
          deleteBatch.delete(doc(db, "ad_slots", id));
        }
        await deleteBatch.commit();
        didChange = true;
      }
    }

    // 2. Seed Slang Terms
    const termsCol = collection(db, "terms");
    const termsSnapshot = await getDocs(termsCol);
    if (termsSnapshot.empty) {
      console.log("Seeding slang terms...");
      // Use batches for efficiency
      let batch = writeBatch(db);
      let count = 0;
      for (const term of TERMS) {
        const docRef = doc(termsCol); // auto ID
        batch.set(docRef, {
          ...term,
          trending: ["FOMO", "GG", "ASAP", "HMU", "SNAFU", "DM", "WFH", "POV"].includes(term.code),
          createdAt: serverTimestamp()
        });
        count++;
        if (count % 40 === 0) { // Firebase batch limit is 500
          await batch.commit();
          batch = writeBatch(db);
        }
      }
      if (count % 40 !== 0) {
        await batch.commit();
      }
      didChange = true;
    } else {
      // Deduplicate existing terms to clean up live database
      const seen = new Set<string>();
      const toDelete: string[] = [];
      
      termsSnapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const code = (data.code || "").toUpperCase().trim();
        const cat = (data.cat || "").toLowerCase().trim();
        const key = `${code}_${cat}`;
        
        if (seen.has(key)) {
          toDelete.push(docSnap.id);
        } else {
          seen.add(key);
        }
      });
      
      if (toDelete.length > 0) {
        console.log(`Found ${toDelete.length} duplicate terms in database. Cleaning up...`);
        let deleteBatch = writeBatch(db);
        let dCount = 0;
        for (const id of toDelete) {
          deleteBatch.delete(doc(db, "terms", id));
          dCount++;
          if (dCount % 40 === 0) {
            await deleteBatch.commit();
            deleteBatch = writeBatch(db);
          }
        }
        if (dCount % 40 !== 0) {
          await deleteBatch.commit();
        }
        console.log("Deduplication of terms complete!");
        didChange = true;
      }

      // Sync missing seed terms that do not yet exist in Firestore
      const currentDbKeys = new Set<string>();
      termsSnapshot.docs.forEach(docSnap => {
        if (!toDelete.includes(docSnap.id)) {
          const data = docSnap.data();
          const code = (data.code || "").toUpperCase().trim();
          const cat = (data.cat || "").toLowerCase().trim();
          currentDbKeys.add(`${code}_${cat}`);
        }
      });

      const missingTerms = TERMS.filter(t => !currentDbKeys.has(`${t.code.toUpperCase().trim()}_${t.cat.toLowerCase().trim()}`));
      if (missingTerms.length > 0) {
        console.log(`Syncing ${missingTerms.length} newly added seed terms to Firestore...`);
        let addBatch = writeBatch(db);
        let aCount = 0;
        for (const term of missingTerms) {
          const docRef = doc(termsCol); // auto ID
          addBatch.set(docRef, {
            ...term,
            trending: ["FOMO", "GG", "ASAP", "HMU", "SNAFU", "DM", "WFH", "POV"].includes(term.code),
            createdAt: serverTimestamp()
          });
          aCount++;
          if (aCount % 40 === 0) {
            await addBatch.commit();
            addBatch = writeBatch(db);
          }
        }
        if (aCount % 40 !== 0) {
          await addBatch.commit();
        }
        console.log(`Successfully synced ${missingTerms.length} new seed terms!`);
        didChange = true;
      }
    }

    // 3. Seed Blog Posts / Sanitize old data
    const blogsCol = collection(db, "blogs");
    const blogsSnapshot = await getDocs(blogsCol);
    if (blogsSnapshot.empty) {
      console.log("Seeding blog posts...");
      for (const blog of BLOG_SEED) {
        await addDoc(blogsCol, {
          ...blog,
          createdAt: serverTimestamp()
        });
      }
      didChange = true;
    } else {
      // Deduplicate blogs if any got duplicated
      const seenBlog = new Set<string>();
      const toDeleteBlog: string[] = [];
      blogsSnapshot.docs.forEach(docSnap => {
        const title = (docSnap.data().title || "").toLowerCase().trim();
        if (seenBlog.has(title)) {
          toDeleteBlog.push(docSnap.id);
        } else {
          seenBlog.add(title);
        }
      });
      if (toDeleteBlog.length > 0) {
        console.log(`Cleaning up ${toDeleteBlog.length} duplicate blog posts...`);
        let deleteBatch = writeBatch(db);
        for (const id of toDeleteBlog) {
          deleteBatch.delete(doc(db, "blogs", id));
        }
        await deleteBatch.commit();
        didChange = true;
      }

      // Sanitize old names from existing blogs
      const sanitizeText = (txt: any): any => {
        if (typeof txt !== "string") return txt;
        return txt
          .replace(/abbrdex/gi, "whatsthatmean")
          .replace(/slangdex/gi, "whatsthatmean")
          .replace(/abbrtex/gi, "whatsthatmean");
      };

      const updateBatch = writeBatch(db);
      let hasUpdates = false;
      blogsSnapshot.docs.forEach(docSnap => {
        if (!toDeleteBlog.includes(docSnap.id)) {
          const data = docSnap.data();
          const originalTitle = data.title || "";
          const originalExcerpt = data.excerpt || "";
          const originalBody = data.body || "";
          const originalSeoTitle = data.seoTitle || "";
          const originalMetaDescription = data.metaDescription || "";

          const newTitle = sanitizeText(originalTitle);
          const newExcerpt = sanitizeText(originalExcerpt);
          const newBody = sanitizeText(originalBody);
          const newSeoTitle = sanitizeText(originalSeoTitle);
          const newMetaDescription = sanitizeText(originalMetaDescription);

          if (
            newTitle !== originalTitle ||
            newExcerpt !== originalExcerpt ||
            newBody !== originalBody ||
            newSeoTitle !== originalSeoTitle ||
            newMetaDescription !== originalMetaDescription
          ) {
            updateBatch.update(doc(db, "blogs", docSnap.id), {
              title: newTitle,
              excerpt: newExcerpt,
              body: newBody,
              seoTitle: newSeoTitle,
              metaDescription: newMetaDescription
            });
            hasUpdates = true;
          }
        }
      });

      if (hasUpdates) {
        console.log("Updating blog posts with 'whatsthatmean' branding in Firestore...");
        await updateBatch.commit();
        didChange = true;
      }
    }

    // 4. Seed User Profiles
    const usersCol = collection(db, "users");
    const usersSnapshot = await getDocs(usersCol);
    if (usersSnapshot.empty) {
      console.log("Seeding user profiles...");
      for (const u of MOCK_USERS) {
        await setDoc(doc(db, "users", u.uid), u);
      }
      didChange = true;
    }
    console.log("Seeding and deduplication checks complete!");
    return didChange;
  } catch (error) {
    console.error("Error checking/seeding database:", error);
    return false;
  }
}

// Terms API
export async function fetchTerms(): Promise<Term[]> {
  const termsCol = collection(db, "terms");
  const q = query(termsCol, orderBy("code", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Term[];
}

export async function addTerm(term: Omit<Term, "id">): Promise<string> {
  const termsCol = collection(db, "terms");
  const docRef = await addDoc(termsCol, {
    ...term,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

export async function updateTerm(id: string, term: Partial<Term>): Promise<void> {
  const termRef = doc(db, "terms", id);
  await updateDoc(termRef, term);
}

export async function deleteTerm(id: string): Promise<void> {
  const termRef = doc(db, "terms", id);
  await deleteDoc(termRef);
}

// Blog Posts API
export async function fetchBlogPosts(): Promise<BlogPost[]> {
  const blogsCol = collection(db, "blogs");
  const q = query(blogsCol, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title || "",
      date: data.date || "Just now",
      excerpt: data.excerpt || "",
      body: data.body || "",
      cat: data.cat || "internet",
      seoTitle: data.seoTitle || "",
      metaDescription: data.metaDescription || "",
      keywords: data.keywords || "",
    };
  }) as BlogPost[];
}

export async function addBlogPost(post: Omit<BlogPost, "id">): Promise<string> {
  const blogsCol = collection(db, "blogs");
  const docRef = await addDoc(blogsCol, {
    ...post,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

export async function deleteBlogPost(id: string): Promise<void> {
  const blogRef = doc(db, "blogs", id);
  await deleteDoc(blogRef);
}

export async function updateBlogPost(id: string, updates: Partial<BlogPost>): Promise<void> {
  const blogRef = doc(db, "blogs", id);
  await updateDoc(blogRef, updates);
}

// Ad Slots API
export async function fetchAdSlots(): Promise<AdSlot[]> {
  const adSlotsCol = collection(db, "ad_slots");
  const snapshot = await getDocs(adSlotsCol);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as AdSlot[];
}

export async function updateAdSlotStatus(id: string, on: boolean): Promise<void> {
  const slotRef = doc(db, "ad_slots", id);
  await updateDoc(slotRef, { on });
}

export async function updateAdSlot(id: string, updates: Partial<AdSlot>): Promise<void> {
  const slotRef = doc(db, "ad_slots", id);
  await updateDoc(slotRef, updates);
}

export async function resetTermsDatabase(newTerms: Term[]): Promise<void> {
  const termsCol = collection(db, "terms");
  const snapshot = await getDocs(termsCol);
  
  // Delete existing terms in small chunks of 40 to prevent exceeding batch operations or rule access limits
  let deleteBatch = writeBatch(db);
  let dCount = 0;
  for (const d of snapshot.docs) {
    deleteBatch.delete(d.ref);
    dCount++;
    if (dCount % 40 === 0) {
      await deleteBatch.commit();
      deleteBatch = writeBatch(db);
    }
  }
  if (dCount % 40 !== 0) {
    await deleteBatch.commit();
  }

  // Add new terms
  let batch = writeBatch(db);
  let count = 0;
  for (const term of newTerms) {
    const docRef = doc(termsCol);
    batch.set(docRef, {
      ...term,
      trending: ["FOMO", "GG", "ASAP", "HMU", "SNAFU", "DM", "WFH", "POV"].includes(term.code),
      createdAt: serverTimestamp()
    });
    count++;
    if (count % 40 === 0) {
      await batch.commit();
      batch = writeBatch(db);
    }
  }
  if (count % 40 !== 0) {
    await batch.commit();
  }
}

// Users API
export async function fetchUserProfiles(): Promise<UserProfile[]> {
  const usersCol = collection(db, "users");
  const snapshot = await getDocs(usersCol);
  return snapshot.docs.map(doc => ({
    uid: doc.id,
    ...doc.data()
  })) as UserProfile[];
}

export async function updateUserProfile(uid: string, profile: Partial<UserProfile>): Promise<void> {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, profile);
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, "users", uid);
  const docSnap = await getDoc(userRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data() as UserProfile;
    if (data.email?.toLowerCase().trim() === "mjnickitim@gmail.com" && data.role !== "Admin") {
      data.role = "Admin";
      await updateDoc(userRef, { role: "Admin" });
    }
    return { uid: docSnap.id, ...data } as UserProfile;
  }
  
  // Backup: query where uid field is matches (for legacy or mock users seed matching)
  const usersCol = collection(db, "users");
  const q = query(usersCol, where("uid", "==", uid));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const legacyDoc = snapshot.docs[0];
  const data = legacyDoc.data() as UserProfile;
  if (data.email?.toLowerCase().trim() === "mjnickitim@gmail.com" && data.role !== "Admin") {
    data.role = "Admin";
    await updateDoc(doc(db, "users", legacyDoc.id), { role: "Admin" });
  }
  return { uid: legacyDoc.id, ...data } as UserProfile;
}

export async function createUserProfile(uid: string, profile: Omit<UserProfile, "uid">): Promise<void> {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    ...profile,
    uid: uid
  });
}

export async function deleteUserProfile(uid: string): Promise<void> {
  const userRef = doc(db, "users", uid);
  await deleteDoc(userRef);
}

// Quiz records
export async function recordQuizScore(uid: string, score: number, streak: number, categoryId: string): Promise<void> {
  const scoresCol = collection(db, "quiz_scores");
  await addDoc(scoresCol, {
    uid,
    score,
    streak,
    categoryId,
    timestamp: serverTimestamp()
  });
}
