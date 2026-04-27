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
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [newProdName, setNewProdName] = useState("");
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdCat, setNewProdCat] = useState("");
  const [newProdImage, setNewProdImage] = useState("");

  const startEditingCategory = (category: any) => {
    setEditingCategoryId(category.id);
    setNewCatTitle(category.title);
    setNewCatImage(category.imageUrl || "");
  };

  const cancelEditingCategory = () => {
    setEditingCategoryId(null);
    setNewCatTitle("");
    setNewCatImage("");
  };

  const startEditingProduct = (product: any) => {
    setEditingProductId(product.id);
    setNewProdName(product.name);
    setNewProdDesc(product.desc || "");
    setNewProdPrice(product.price.toString());
    setNewProdCat(product.categoryId);
    setNewProdImage(product.imageUrl || "");
  };

  const cancelEditing = () => {
    setEditingProductId(null);
    setNewProdName("");
    setNewProdDesc("");
    setNewProdPrice("");
    setNewProdCat("");
    setNewProdImage("");
  };

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
      const fetchedCats = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const sortedCats = fetchedCats.map((c: any, i) => ({ ...c, order: typeof c.order === 'number' ? c.order : i })).sort((a, b) => a.order - b.order);
      setCategories(sortedCats);

      const prodSnap = await getDocs(collection(db, "products"));
      const fetchedProds = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const sortedProds = fetchedProds.map((p: any, i) => ({ ...p, order: typeof p.order === 'number' ? p.order : i })).sort((a, b) => a.order - b.order);
      setProducts(sortedProds);
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

  const saveCategory = async () => {
    if (!newCatTitle) return;
    try {
      if (editingCategoryId) {
        await updateDoc(doc(db, "categories", editingCategoryId), {
          title: newCatTitle,
          imageUrl: newCatImage
        });
      } else {
        await addDoc(collection(db, "categories"), {
          title: newCatTitle,
          imageUrl: newCatImage,
          gradient: "linear-gradient(90deg, rgba(115, 20, 35, 0.9) 0%, rgba(115, 20, 35, 0.65) 50%, rgba(0,0,0,0.3) 100%)",
          order: categories.length
        });
      }
      cancelEditingCategory();
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Hata oluştu.");
    }
  };

  const deleteCategory = async (id: string) => {
    if (confirm("Kategoriyi silerseniz içindeki ürünler menüde çıkmayabilir. Emin misiniz?")) {
      try {
        await deleteDoc(doc(db, "categories", id));
        fetchData();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const saveProduct = async () => {
    if (!newProdName || !newProdPrice || !newProdCat) return;
    
    try {
      const currentPrice = Number(newProdPrice);
      
      if (editingProductId) {
        // Editing existing product
        const existingProduct = products.find(p => p.id === editingProductId);
        if (!existingProduct) return;
        
        const updateData: any = {
          name: newProdName,
          desc: newProdDesc,
          price: currentPrice,
          categoryId: newProdCat,
          imageUrl: newProdImage
        };
        
        // Price history logic
        if (existingProduct.price !== currentPrice) {
          const historyEntry = {
            oldPrice: existingProduct.price,
            date: new Date().toISOString()
          };
          updateData.priceHistory = [...(existingProduct.priceHistory || []), historyEntry];
        }
        
        await updateDoc(doc(db, "products", editingProductId), updateData);
      } else {
        // Adding new product
        await addDoc(collection(db, "products"), {
          name: newProdName,
          desc: newProdDesc,
          price: currentPrice,
          categoryId: newProdCat,
          imageUrl: newProdImage,
          priceHistory: [],
          order: products.filter(p => p.categoryId === newProdCat).length
        });
      }
      
      cancelEditing();
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

  const toggleVisibility = async (product: any) => {
    try {
      const currentVisibility = product.isVisible !== false; // defaults to true
      await updateDoc(doc(db, "products", product.id), {
        isVisible: !currentVisibility
      });
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Hata oluştu.");
    }
  };

  const setTrending = async (productId: string) => {
    try {
      const currentlyTrending = products.find(p => p.isTrending);
      if (currentlyTrending && currentlyTrending.id !== productId) {
        await updateDoc(doc(db, "products", currentlyTrending.id), {
          isTrending: false
        });
      }
      
      const targetProduct = products.find(p => p.id === productId);
      if (targetProduct) {
        await updateDoc(doc(db, "products", productId), {
          isTrending: !targetProduct.isTrending
        });
      }
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Hata oluştu.");
    }
  };

  const moveCategory = async (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= categories.length) return;
    try {
      const catA = categories[index];
      const catB = categories[index + direction];
      
      const newOrderA = catB.order !== undefined ? catB.order : index + direction;
      const newOrderB = catA.order !== undefined ? catA.order : index;

      await updateDoc(doc(db, "categories", catA.id), { order: newOrderA });
      await updateDoc(doc(db, "categories", catB.id), { order: newOrderB });
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Sıralama değiştirilirken hata oluştu.");
    }
  };

  const moveProduct = async (product: any, direction: -1 | 1) => {
    try {
      const categoryProducts = products.filter(p => p.categoryId === product.categoryId);
      const index = categoryProducts.findIndex(p => p.id === product.id);
      if (index + direction < 0 || index + direction >= categoryProducts.length) return;
      
      const prodA = categoryProducts[index];
      const prodB = categoryProducts[index + direction];
      
      const newOrderA = prodB.order !== undefined ? prodB.order : index + direction;
      const newOrderB = prodA.order !== undefined ? prodA.order : index;

      await updateDoc(doc(db, "products", prodA.id), { order: newOrderA });
      await updateDoc(doc(db, "products", prodB.id), { order: newOrderB });
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Sıralama değiştirilirken hata oluştu.");
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
        <h3>{editingCategoryId ? "Kategoriyi Düzenle" : "Yeni Kategori Ekle"}</h3>
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
        {newCatImage && (
          <div style={{ marginBottom: '15px' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#aaa' }}>Önizleme:</p>
            <img 
              src={newCatImage} 
              alt="Önizleme" 
              style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover', borderRadius: '8px' }} 
              onError={(e) => (e.currentTarget.style.display = 'none')} 
              onLoad={(e) => (e.currentTarget.style.display = 'block')} 
            />
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={saveCategory} className="admin-btn">
            {editingCategoryId ? "Kategoriyi Güncelle" : "Kategori Ekle"}
          </button>
          {editingCategoryId && (
            <button onClick={cancelEditingCategory} className="admin-btn" style={{ background: '#555' }}>İptal</button>
          )}
        </div>
      </div>

      <div className="admin-card">
        <h3>Mevcut Kategoriler</h3>
        {categories.map((c, index) => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #444', padding: '10px 0' }}>
            <div><strong>{c.title}</strong></div>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={() => moveCategory(index, -1)} disabled={index === 0} className="admin-btn" style={{ background: '#555', padding: '5px 10px', opacity: index === 0 ? 0.3 : 1 }}>▲</button>
              <button onClick={() => moveCategory(index, 1)} disabled={index === categories.length - 1} className="admin-btn" style={{ background: '#555', padding: '5px 10px', opacity: index === categories.length - 1 ? 0.3 : 1 }}>▼</button>
              <button onClick={() => startEditingCategory(c)} className="admin-btn" style={{ background: '#1976d2', padding: '5px 10px' }}>Düzenle</button>
              <button onClick={() => deleteCategory(c.id)} className="admin-btn" style={{ background: '#d32f2f', padding: '5px 10px' }}>Sil</button>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-card">
        <h3>{editingProductId ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}</h3>
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
        {newProdImage && (
          <div style={{ marginBottom: '15px' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#aaa' }}>Önizleme:</p>
            <img 
              src={newProdImage} 
              alt="Önizleme" 
              style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover', borderRadius: '8px' }} 
              onError={(e) => (e.currentTarget.style.display = 'none')} 
              onLoad={(e) => (e.currentTarget.style.display = 'block')} 
            />
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={saveProduct} className="admin-btn">
            {editingProductId ? "Güncelle" : "Ürün Ekle"}
          </button>
          {editingProductId && (
            <button onClick={cancelEditing} className="admin-btn" style={{ background: '#555' }}>İptal</button>
          )}
        </div>
      </div>

      <div className="admin-card">
        <h3>Mevcut Ürünler</h3>
        {categories.map(c => {
          const categoryProducts = products.filter(p => p.categoryId === c.id);
          if (categoryProducts.length === 0) return null;
          
          return (
            <div key={c.id} style={{ marginBottom: '30px' }}>
              <h4 style={{ borderBottom: '2px solid #555', paddingBottom: '10px', color: '#e0e0e0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                {c.imageUrl && <img src={c.imageUrl} alt={c.title} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />}
                {c.title}
              </h4>
              {categoryProducts.map((p, index) => (
                <div key={p.id} style={{ borderBottom: '1px solid #333', padding: '15px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ opacity: p.isVisible === false ? 0.5 : 1, display: 'flex', gap: '15px', alignItems: 'center' }}>
                      {p.imageUrl && <img src={p.imageUrl} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />}
                      <div>
                        <strong>{p.name}</strong> - {p.price} ₺ {p.isVisible === false && <span style={{color: '#ed6c02'}}>(Gizlendi)</span>} {p.isTrending && <span style={{color: '#ffb300'}}>⭐ Trend</span>}
                        {p.priceHistory && p.priceHistory.length > 0 && (
                          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '5px' }}>
                            <strong>Fiyat Geçmişi:</strong>
                            <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
                              {p.priceHistory.map((history: any, idx: number) => (
                                <li key={idx}>
                                  {new Date(history.date).toLocaleDateString('tr-TR')} tarihinde {history.oldPrice} ₺ idi.
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '300px', alignItems: 'flex-start' }}>
                      <button onClick={() => moveProduct(p, -1)} disabled={index === 0} className="admin-btn" style={{ background: '#555', padding: '5px 10px', opacity: index === 0 ? 0.3 : 1 }}>▲</button>
                      <button onClick={() => moveProduct(p, 1)} disabled={index === categoryProducts.length - 1} className="admin-btn" style={{ background: '#555', padding: '5px 10px', opacity: index === categoryProducts.length - 1 ? 0.3 : 1 }}>▼</button>
                      <button onClick={() => setTrending(p.id)} className="admin-btn" style={{ background: p.isTrending ? '#ffb300' : '#444', color: p.isTrending ? '#000' : '#fff', padding: '5px 10px' }}>
                        {p.isTrending ? "Trendi Kaldır" : "Trend Yap"}
                      </button>
                      <button onClick={() => toggleVisibility(p)} className="admin-btn" style={{ background: p.isVisible === false ? '#2e7d32' : '#ed6c02', padding: '5px 10px' }}>
                        {p.isVisible === false ? "Göster" : "Gizle"}
                      </button>
                      <button onClick={() => startEditingProduct(p)} className="admin-btn" style={{ background: '#1976d2', padding: '5px 10px' }}>Düzenle</button>
                      <button onClick={() => deleteProduct(p.id)} className="admin-btn" style={{ background: '#d32f2f', padding: '5px 10px' }}>Sil</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        {products.filter(p => !categories.find(c => c.id === p.categoryId)).length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ borderBottom: '2px solid #555', paddingBottom: '10px', color: '#e0e0e0' }}>Kategorisiz Ürünler</h4>
            {products.filter(p => !categories.find(c => c.id === p.categoryId)).map(p => (
                <div key={p.id} style={{ borderBottom: '1px solid #333', padding: '15px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ opacity: p.isVisible === false ? 0.5 : 1, display: 'flex', gap: '15px', alignItems: 'center' }}>
                      {p.imageUrl && <img src={p.imageUrl} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />}
                      <div>
                        <strong>{p.name}</strong> - {p.price} ₺ {p.isVisible === false && <span style={{color: '#ed6c02'}}>(Gizlendi)</span>} {p.isTrending && <span style={{color: '#ffb300'}}>⭐ Trend</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '250px', alignItems: 'flex-start' }}>
                      <button onClick={() => setTrending(p.id)} className="admin-btn" style={{ background: p.isTrending ? '#ffb300' : '#444', color: p.isTrending ? '#000' : '#fff', padding: '5px 10px' }}>
                        {p.isTrending ? "Trendi Kaldır" : "Trend Yap"}
                      </button>
                      <button onClick={() => toggleVisibility(p)} className="admin-btn" style={{ background: p.isVisible === false ? '#2e7d32' : '#ed6c02', padding: '5px 10px' }}>
                        {p.isVisible === false ? "Göster" : "Gizle"}
                      </button>
                      <button onClick={() => startEditingProduct(p)} className="admin-btn" style={{ background: '#1976d2', padding: '5px 10px' }}>Düzenle</button>
                      <button onClick={() => deleteProduct(p.id)} className="admin-btn" style={{ background: '#d32f2f', padding: '5px 10px' }}>Sil</button>
                    </div>
                  </div>
                </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
