import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

// --- SCENE et FOG ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x160d10);
scene.fog = new THREE.Fog(0x160d10, 6, 25);

// --- CAMERA ---
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 0.5, 5.5);

// --- RENDERER ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- LUMIERES ---
const mainLight = new THREE.DirectionalLight(0xffffff, 1.8);
mainLight.position.set(4, 5, 6);
scene.add(mainLight);
scene.add(new THREE.AmbientLight(0x66333a, 1.2));

// --- TEXTURE DYNAMIQUE (PARTIAL UPDATE) ---
const textureSize = 512;
const data = new Uint8Array(textureSize * textureSize * 4);
for (let i = 0; i < data.length; i += 4) {
    data[i] = 40;
    data[i + 1] = 40;
    data[i + 2] = 45;
    data[i + 3] = 255;
}
const boxTexture = new THREE.DataTexture(data, textureSize, textureSize);
boxTexture.colorSpace = THREE.SRGBColorSpace;
boxTexture.needsUpdate = true;

const patchSize = 32;
const patchData = new Uint8Array(patchSize * patchSize * 4);
const patchTexture = new THREE.DataTexture(patchData, patchSize, patchSize);
patchTexture.colorSpace = THREE.SRGBColorSpace;

const patchPosition = new THREE.Vector2();
const patchColor = new THREE.Color();

function updateRandomPatch() {
    patchColor.setHex(Math.random() * 0xffffff);
    const r = Math.floor(patchColor.r * 255);
    const g = Math.floor(patchColor.g * 255);
    const b = Math.floor(patchColor.b * 255);

    for (let i = 0; i < patchData.length; i += 4) {
        patchData[i] = r;
        patchData[i + 1] = g;
        patchData[i + 2] = b;
        patchData[i + 3] = 255;
    }
    patchTexture.needsUpdate = true;

    const maxTiles = textureSize / patchSize;
    patchPosition.x = Math.floor(Math.random() * maxTiles) * patchSize;
    patchPosition.y = Math.floor(Math.random() * maxTiles) * patchSize;

    renderer.copyTextureToTexture(patchTexture, boxTexture, null, patchPosition);
}

// --- CUBE TEXTURE (DYNAMIQUE) ---
const boxGeo = new THREE.BoxGeometry(1.1, 1.1, 1.1);
const boxMat = new THREE.MeshStandardMaterial({ map: boxTexture });
const box = new THREE.Mesh(boxGeo, boxMat);
box.position.set(-1.3, 0, 0);
scene.add(box);

// --- MODELE 3D (EPEE ROUGE) ---
let model = null;
const objLoader = new OBJLoader();
objLoader.load(
    './Sting-Sword-lowpoly.obj',
    (obj) => {
        obj.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({ color: 0xd62839 });
            }
        });
        obj.scale.set(0.05, 0.05, 0.05);
        obj.position.set(1.4, -0.2, 0);
        obj.rotation.set(-Math.PI / 2, 0, 0);
        scene.add(obj);
        model = obj;
    },
    undefined,
    (err) => console.error(err)
);

// --- PARTICULES ---
const nbParticles = 1500;
const coords = new Float32Array(nbParticles * 3);
for (let i = 0; i < nbParticles * 3; i++) {
    coords[i] = (Math.random() - 0.5) * 22;
}
const partGeo = new THREE.BufferGeometry();
partGeo.setAttribute("position", new THREE.BufferAttribute(coords, 3));
const partMat = new THREE.PointsMaterial({ color: 0xff4d5a, size: 0.06 });
const particleSystem = new THREE.Points(partGeo, partMat);
scene.add(particleSystem);

// --- CAPTEURS SMARTPHONE ---
window.addEventListener('deviceorientation', (e) => {
    if (!model) return;
    const alpha = e.alpha ? THREE.MathUtils.degToRad(e.alpha) : 0;
    const beta = e.beta ? THREE.MathUtils.degToRad(e.beta) : 0;
    const gamma = e.gamma ? THREE.MathUtils.degToRad(e.gamma) : 0;
    model.rotation.set(beta, gamma, alpha);
}, true);

// --- REDIMENSIONNEMENT ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- BOUCLE D'ANIMATION ---
function animate() {
    requestAnimationFrame(animate);

    updateRandomPatch();

    box.rotation.x += 0.008;
    box.rotation.y += 0.012;

    if (model) {
        model.rotation.y += 0.015;
    }

    const posArray = particleSystem.geometry.attributes.position.array;
    for (let i = 1; i < posArray.length; i += 3) {
        posArray[i] -= 0.07;
        if (posArray[i] < -11) posArray[i] = 11;
    }
    particleSystem.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
}
animate();