# BBM 414 – WebGL2 Mini Game Engine

This project is a **WebGL 2.0 based mini game engine** developed from scratch as part of the **BBM 414 – Computer Graphics** course.  
No high-level 3D engine (Three.js, Babylon.js, A-Frame, etc.) is used.

The engine supports **procedural geometry**, **OBJ model loading**, **texture mapping**, **Phong / Blinn-Phong lighting**, **camera controllers**, **GUI-based scene editing**, and **dual viewport rendering** as a bonus feature.

---

## Features

### Core Features

- WebGL 2.0 rendering pipeline
- Custom shader system (Vertex + Fragment shaders)
- Procedural mesh generation:
  - Cube
  - Sphere
  - Cylinder
  - Prism
- OBJ model loading (`.obj`)
  - File-based loading
  - Runtime upload via GUI
- Texture mapping with UV coordinates
- Phong and Blinn-Phong illumination models
- Directional Light
- Point Light with attenuation
- Material system (Ka, Ks, shininess)
- First-person camera controller
- Interactive GUI using **lil-gui**

### Bonus Features

- Dual viewport rendering:
  - Left: Engine View (First Person Camera)
  - Right: Game View (Third Person / Orbit Camera)
- Third-person orbit camera following active object
- Runtime object creation and deletion
- Active object transform editing (position, rotation, scale)
- Mesh type switching for active entity
- Auto-rotation for active object

---

## How to Run

Because ES Modules and `fetch()` are used, the project **must be served over HTTP**.

### Option 1: Python

```bash
python3 -m http.server 8000
```

Open in browser:

```
http://localhost:8000
```

### Option 2: VS Code Live Server

- Install **Live Server**
- Right click `index.html`
- Select **Open with Live Server**

---

## Controls

### Engine View (Left Viewport – First Person)

- Click on canvas to enable pointer lock
- Mouse: look around
- `W` / `A` / `S` / `D`: movement
- `Shift`: faster movement

### Game View (Right Viewport – Third Person)

- Mouse / touchpad drag: orbit around target
- Scroll / pinch: zoom
- Camera automatically follows the active object

---

## GUI Overview

### Scene Panel

- Upload OBJ file
- Select spawn type
- Add entity
- Remove active entity
- Select active object
- Toggle texture usage
- Toggle Blinn-Phong shading
- Auto-rotate active object

### Active Object Panel

- Change mesh type
- Transform editing:
  - Position
  - Rotation (radians)
  - Scale

### Lighting Panels

- Directional light direction & intensity
- Point light position, intensity, attenuation

### Material Panel

- Ambient coefficient (Ka)
- Specular coefficient (Ks)
- Shininess

---

## Project Structure

```
.
├── assets
│   ├── models
│   └── textures
├── index.html
├── README.md
├── src
│   ├── core
│   ├── geometry
│   ├── loaders
│   ├── scene
│   ├── shaders
│   └── ui
└── vendor
```

Some files (Scene graph, Light classes, GLTF loader, Inspector) are intentionally left as **placeholders** for future extensions and are not required for the core project.

---

## Rendering Pipeline

1. WebGL2 context creation
2. Shader compilation and linking
3. Mesh data upload (VAO, VBO, IBO)
4. Per-frame update:
   - Time update
   - Camera controller update
   - Left viewport render
   - Right viewport render

Dual viewport rendering is implemented using `gl.viewport()` and `gl.scissor()`.

---

## Shaders

### Vertex Shader

- Model → View → Projection transformation
- Normal transformation
- UV forwarding

### Fragment Shader

- Phong / Blinn-Phong lighting
- Directional + point light contribution
- Optional texture sampling

---

## Limitations

- `.mtl` material files are not parsed
- Only a single albedo texture is used
- Scene graph abstraction is not fully implemented (not required)

---

## Submission Notes

Project is submitted as:

```
b<studentNumber>.zip
└── Project_2025
```

Include:

- `index.html`
- `src/`
- `assets/`
- `vendor/`

---

## Demo Checklist

- Dual viewport visible
- First-person camera movement
- Third-person orbit camera
- Add primitive meshes
- Upload OBJ model
- Transform objects via GUI
- Modify lights and materials
- Toggle texture and shading model

---

## Dependencies

- **WebGL 2.0**
- **glMatrix** (math utilities)
- **lil-gui** (GUI)

No external 3D rendering engine is used.
