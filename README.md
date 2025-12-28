# WebGL2 Mini Game Engine

A lightweight **WebGL2-based mini game engine** developed as a course / academic project.  
The engine demonstrates core real-time rendering concepts, scene management, lighting models, camera controllers, and a GUI-driven workflow using **lil-gui**.

---

## ✨ Features

### Rendering

- WebGL2 rendering pipeline
- Phong & Blinn-Phong shading (toggleable)
- Directional Light + Point Light with attenuation
- Texture mapping with runtime texture upload
- Dual viewport rendering (Editor View + Game View)

### Scene & Objects

- Multiple entities in a single scene
- Supported mesh types:
  - OBJ (external & uploaded)
  - Cube
  - Sphere
  - Cylinder
  - Prism
- Per-entity transform:
  - Position
  - Rotation
  - Scale
- Runtime mesh-type switching

### Cameras

- **FirstPersonController** (Editor / Engine view)
- **ThirdPersonController** (Game / Orbit view)
- Active entity tracking for orbit camera

### GUI (lil-gui)

- Add / remove entities
- Select active object
- Upload OBJ files at runtime
- Upload textures at runtime
- View current texture name
- Toggle texture usage
- Toggle Blinn-Phong vs Phong
- Per-object transform controls
- Lighting & material controls
- Auto-rotate active object

---

## 🖼️ Texture Upload System

The engine supports **runtime texture upload** directly from the GUI.

**How it works:**

1. Click **🖼️ Upload Texture** in the GUI
2. Select any image file (`.png`, `.jpg`, etc.)
3. The texture is uploaded to GPU
4. Rendering switches to the new texture automatically
5. GUI updates the _Current Texture_ label

> The displayed texture name updates even if the visual texture changes dynamically.

---

## 🧱 Project Structure

```
src/
├── core/
│   ├── GLContext.js
│   ├── Renderer.js
│   ├── ShaderProgram.js
│   ├── TextureLoader.js
│   ├── Time.js
│   └── Material.js
│
├── geometry/
│   └── PrimitiveFactory.js
│
├── loaders/
│   ├── OBJLoader.js
│   └── GLTFLoader.js
│
├── math/
│   └── transform.js
│
├── scene/
│   ├── Camera.js
│   ├── Scene.js
│   ├── Node.js
│   ├── Entity.js
│   └── lights/
│       ├── Light.js
│       ├── DirectionalLight.js
│       └── PointLight.js
│
├── scene/controllers/
│   ├── FirstPersonController.js
│   └── ThirdPersonController.js
│
├── shaders/
│   ├── phong.vert.glsl
│   └── phong.frag.glsl
│
├── ui/
│   ├── GUI.js
│   └── Inspector.js
│
├── config.js
└── main.js
```

---

## 🎮 Controls

### Camera Controls

**First Person (Editor View):**

- `W / A / S / D` – Move
- Mouse – Look around

**Third Person (Game View):**

- Mouse drag – Orbit
- Scroll – Zoom

### GUI

- Scene management via **Scene** panel
- Active object editing via **Active Object** panel
- Lighting & material tuning via dedicated folders

---

## 💡 Shading Models

- **Phong Illumination**
- **Blinn-Phong Illumination**

Toggle via GUI:

```
Use Blinn-Phong ✔ / ✖
```

---

## 🛠️ Technologies Used

- **WebGL2**
- **JavaScript (ES Modules)**
- **glMatrix**
- **lil-gui**
- **OBJ Loader**
- **HTML5 Canvas**

---

## 🚀 How to Run

Because ES Modules are used, you must run a local server:

```bash
# Python
python3 -m http.server

# or Node
npx serve
```

Then open:

```
http://localhost:8000
```

---

## 📦 Status

✔ Core rendering  
✔ Scene system  
✔ GUI controls  
✔ Runtime OBJ upload  
✔ Runtime texture upload  
✔ Dual viewport

---

## 👤 Author

**Aykut Alp Gürler**  
Computer Engineering Student  
WebGL / Graphics Programming Project

---

## 📜 License

This project is for **educational purposes**.  
You are free to inspect, modify, and learn from the code.
