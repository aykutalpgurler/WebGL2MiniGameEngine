## WebGL2 Mini Game Engine

BBM 414 – Computer Graphics Laboratory, Project 2025–2026. Sıfırdan WebGL2 ile (Three.js/Babylon/A-Frame yok) sahne editörü + render motoru. Tek canvas üzerinde çift viewport (sol FPS, sağ orbit), procedural primitifler, OBJ/glTF yükleme, Phong/Blinn-Phong aydınlatma, lil-gui ile sahne düzenleme içerir.

### İçindekiler
- Hızlı Başlangıç (çalıştırma)
- Kontroller (sol FPS / sağ Orbit)
- GUI kullanımı
- Hızlı demo senaryosu
- Özellik listesi (core + bonus)
- Mimarinin özeti
- Dizin yapısı
- Rendering pipeline ve shaderlar
- Sorun giderme / bilinen kısıtlar
- Akademik not

### Hızlı Başlangıç (çalıştırma)
1) Yerel HTTP sunucusu aç (fetch/CORS için zorunlu):
   - `python3 -m http.server 8000`
   - veya VS Code Live Server / başka basit HTTP server.
2) Tarayıcıda `http://localhost:8000` aç (`index.html` yüklenir).
3) Canvas’a tıkla → pointer lock alırsın (sol viewport kontrolü). GUI’ye tıklamak için tekrar canvas dışına/GUI’ye tıkla.

### Kontroller
- **Sol (Engine / FPS):** WASD hareket, E/Q dikey, fare ile bakış, Shift sprint. Pointer lock açıkken çalışır.
- **Sağ (Game / Orbit):** Sağ yarıya tıkla → fare sürükle (LMB orbit, RMB/MMB pan), scroll ile zoom. Hedef aktif objeye kilitlenir.
- **Genel:** GUI lil-gui paneli; pointer lock devredeyken de tıklanabilir.

### GUI kullanımı (lil-gui)
- **Scene:** OBJ yükle (dosya seç), Spawn Type, Add Entity, Quick Add (Cube/Sphere/Cylinder/Prism), Remove Active, Active Object dropdown, Use Texture, Use Blinn-Phong, Animation (auto-rotate active, rotate speed).
- **Active Object:** Mesh tipi değiştir (OBJ/Cube/Sphere/Cylinder/Prism), Transform (Position/Rotation/Scale).
- **Lighting:** Directional (dir/intensity), Point (pos/intensity/attenuation constant-linear-quadratic).
- **Material:** Ka (ambient), Ks (specular), shininess. (Kd/texture shader’da; useTexture ile aç/kapa.)
- **Inspector (opsiyonel):** `src/ui/Inspector.js` fps/entity/camera overlay (isteğe bağlı eklenebilir).

### Hızlı demo senaryosu
1) Server’ı başlat, sayfayı aç.  
2) Pointer lock al → WASD + fare ile gez (sol).  
3) Sağ viewport’ta aktif objeyi orbit/zoom yap.  
4) GUI’den yeni primitif ekle, aktif objeyi değiştir.  
5) OBJ yükle (ör: `assets/models/FinalBaseMesh.obj` veya kendi dosyan).  
6) Işık/malzeme parametrelerini değiştir, Blinn-Phong/texture toggle et.  
7) Auto-rotate active ile sağ/sol viewport farkını göster.  

### Özellik listesi
- **Geometri:** Cube, Sphere (UV), Cylinder, Prism – `src/geometry/*` ve `PrimitiveFactory`.
- **Model yükleme:** OBJ (dosya + runtime upload), UV/normals/triangulation; glTF (ilk primitive, data URI/harici buffer, normal hesaplama).
- **Texture:** Albedo map (`Texture2D` + `TextureLoader`), GUI’den aç/kapa.
- **Aydınlatma:** Phong/Blinn toggle; Directional + Point (attenuation parametreleri GUI’de).
- **Kameralar:** Perspective; FirstPersonController (pointer lock + WASD), ThirdPersonController (orbit/pan/zoom hedef = aktif obje).
- **Viewport:** Aynı sahneyi iki kez çizmek için scissor + viewport (sol/sağ).
- **Sahne düzenleme:** lil-gui ile mesh ekle/sil/seç, mesh tipini değiştir, transform/ışık/malzeme ayarı, auto-rotate aktif obje.

### Mimarinin özeti
- **Giriş/render döngüsü:** `src/main.js` — kamera güncelleme, çift viewport, uniform set etme, mesh çizimi.
- **Çekirdek:** `src/core/GLContext.js`, `Renderer.js`, `ShaderProgram.js`, `Mesh.js`, `Texture2D.js`, `TextureLoader.js`, `Time.js`, `Material.js`.
- **Geometri:** `src/geometry/*` primitif üreticiler (+ `PrimitiveFactory`).
- **Sahne/graph:** `src/scene/*` (Camera, Node, Entity, Scene, Lights), transform yardımcıları `src/math/transform.js`.
- **Kontroller:** `FirstPersonController`, `ThirdPersonController`.
- **Yükleyiciler:** `OBJLoader` (pozisyon/norm/UV, triangulation, eksik normali hesaplar), `GLTFLoader` (ilk primitive, eksik normali hesaplar).
- **UI:** `GUI.js` (sahne yönetimi), `Inspector.js` (overlay).
- **Shaderlar:** `src/shaders/phong.vert.glsl`, `phong.frag.glsl` (Directional + Point, Phong/Blinn toggle, albedo map), `unlit` varyantı.

### Dizin yapısı (özet)
```
.
├── index.html                  # canvas + vendor scriptleri
├── assets/
│   ├── models/FinalBaseMesh.obj
│   └── textures/pink-textured-background.jpg
├── src/
│   ├── main.js                 # giriş/render loop
│   ├── config.js               # temel ayarlar
│   ├── core/                   # GL yardımcıları, Material
│   ├── geometry/               # primitif üreticiler
│   ├── loaders/                # OBJ/glTF
│   ├── math/transform.js       # transform yardımcıları
│   ├── scene/                  # Camera, Node/Entity/Scene, Lights, Controllers
│   ├── shaders/                # phong/unlit shaderlar
│   └── ui/GUI.js, Inspector.js # GUI ve overlay
└── vendor/
    ├── gl-matrix-min.js
    └── lil-gui.min.js
```

### Rendering pipeline (özet)
1) WebGL2 context (`GLContext`) → depth test + cull ayarı.  
2) Shader program (`ShaderProgram`) derleme/link.  
3) Mesh oluşturma (`Mesh`) → VAO/VBO/EBO yükleme.  
4) Frame’de: `Time.update()`, kontrolleri güncelle, aktif hedefi orbit kameraya aktar.  
5) Scissor/viewport ile sol FPS, sağ Orbit sahnesi çizilir; ışık ve materyal uniform’ları set edilir; texture bind edilir.  
6) OBJ/glTF load: parse → unified vertex/index buffer; eksik normaller hesaplanır.  

### Sorun giderme / bilinen kısıtlar
- **CORS/hata:** Dosyayı doğrudan açma; HTTP server üzerinden çalıştır.  
- **OBJ MTL:** MTL okunmuyor; tek albedo texture + shader uniform’ları kullanılıyor.  
- **UV’siz modeller:** Texture mapping bozuk görünebilir; `Use Texture` kapatılabilir.  
- **glTF:** Yalnızca ilk primitive alınır; çoklu mesh için genişletilmeli.  
- **Performans:** Büyük OBJ/glTF dosyaları FPS düşürebilir.  

### Akademik not
- Harici render motoru yok; yalnızca gl-matrix ve lil-gui kullanıldı.  
- Çift viewport aynı sahneyi farklı kameralardan çiziyor; ışık/malzeme durumu ortak.  
