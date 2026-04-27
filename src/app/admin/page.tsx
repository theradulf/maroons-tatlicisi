"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [newCatTitle, setNewCatTitle] = useState("");
  const [newCatImage, setNewCatImage] = useState("");

  const [newProdName, setNewProdName] = useState("");
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdCat, setNewProdCat] = useState("");
  const [newProdImage, setNewProdImage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchData();
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    try {
      const catSnap = await getDocs(collection(db, "categories"));
      setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const prodSnap = await getDocs(collection(db, "products"));
      setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.log("Hata: Veriler çekilemedi. Firebase ayarlarınızı kontrol edin.", e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      alert("Giriş başarısız: " + error.message);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const addCategory = async () => {
    if (!newCatTitle) return;
    try {
      await addDoc(collection(db, "categories"), {
        title: newCatTitle,
        imageUrl: newCatImage,
        gradient: "linear-gradient(90deg, rgba(115, 20, 35, 0.9) 0%, rgba(115, 20, 35, 0.65) 50%, rgba(0,0,0,0.3) 100%)"
      });
      setNewCatTitle("");
      setNewCatImage("");
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Hata oluştu.");
    }
  };

  const addProduct = async () => {
    if (!newProdName || !newProdPrice || !newProdCat) return;
    try {
      await addDoc(collection(db, "products"), {
        name: newProdName,
        desc: newProdDesc,
        price: Number(newProdPrice),
        categoryId: newProdCat,
        imageUrl: newProdImage
      });
      setNewProdName("");
      setNewProdDesc("");
      setNewProdPrice("");
      setNewProdImage("");
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Hata oluştu.");
    }
  };

  const deleteProduct = async (id: string) => {
    if (confirm("Emin misiniz?")) {
      try {
        await deleteDoc(doc(db, "products", id));
        fetchData();
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (!user) {
    return (
      <div className="admin-container" style={{ marginTop: '100px', textAlign: 'center' }}>
        <h2>Yönetim Paneli Girişi</h2>
        <form onSubmit={handleLogin} style={{ maxWidth: '300px', margin: '20px auto' }}>
          <input 
            type="email" 
            placeholder="E-posta" 
            className="admin-input" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
          />
          <input 
            type="password" 
            placeholder="Şifre" 
            className="admin-input" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />
          <button type="submit" className="admin-btn" style={{ width: '100%' }}>Giriş Yap</button>
        </form>
        <p style={{ color: '#888', fontSize: '12px' }}>Firebase ayarlarını yapana kadar bu ekran çalışmayacaktır.</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Yönetim Paneli</h2>
        <button onClick={handleLogout} className="admin-btn">Çıkış Yap</button>
      </div>

      <div className="admin-card">
        <h3>Yeni Kategori Ekle</h3>
        <input 
          placeholder="Kategori Adı" 
          className="admin-input" 
          value={newCatTitle} 
          onChange={e => setNewCatTitle(e.target.value)} 
        />
        <input 
          placeholder="Kategori Resim URL (veya Firebase Storage linki)" 
          className="admin-input" 
          value={newCatImage} 
          onChange={e => setNewCatImage(e.target.value)} 
        />
        <button onClick={addCategory} className="admin-btn">Kategori Ekle</button>
      </div>

      <div className="admin-card">
        <h3>Yeni Ürün Ekle</h3>
        <select className="admin-input" value={newProdCat} onChange={e => setNewProdCat(e.target.value)}>
          <option value="">-- Kategori Seçin --</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <input 
          placeholder="Ürün Adı" 
          className="admin-input" 
          value={newProdName} 
          onChange={e => setNewProdName(e.target.value)} 
        />
        <input 
          placeholder="Açıklama" 
          className="admin-input" 
          value={newProdDesc} 
          onChange={e => setNewProdDesc(e.target.value)} 
        />
        <input 
          type="number" 
          placeholder="Fiyat (₺)" 
          className="admin-input" 
          value={newProdPrice} 
          onChange={e => setNewProdPrice(e.target.value)} 
        />
        <input 
          placeholder="Ürün Resim URL" 
          className="admin-input" 
          value={newProdImage} 
          onChange={e => setNewProdImage(e.target.value)} 
        />
        <button onClick={addProduct} className="admin-btn">Ürün Ekle</button>
      </div>

      <div className="admin-card">
        <h3>Mevcut Ürünler</h3>
        {products.map(p => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #444', padding: '10px 0' }}>
            <div>
              <strong>{p.name}</strong> - {p.price} ₺
            </div>
            <button onClick={() => deleteProduct(p.id)} className="admin-btn" style={{ background: '#d32f2f', padding: '5px 10px' }}>Sil</button>
          </div>
        ))}
      </div>
    </div>
  );
}
