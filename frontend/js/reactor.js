class ArcReactor {
    constructor(container) {
        this.container = container;
        this.audioLevel = 0;
        this.state = 'idle';
        this.time = 0;
        this.baseRadius = 1.0;
        
        this.init();
        this.createOrb();
        this.animate();
    }

    init() {
        this.scene = new THREE.Scene();
        
        this.camera = new THREE.PerspectiveCamera(
            50,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.z = 5;

        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true 
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0x111122, 0.3);
        this.scene.add(ambientLight);

        this.pointLight = new THREE.PointLight(0x00d4ff, 2, 15);
        this.pointLight.position.set(0, 0, 2);
        this.scene.add(this.pointLight);

        const dirLight = new THREE.DirectionalLight(0x00ffff, 0.4);
        dirLight.position.set(5, 5, 5);
        this.scene.add(dirLight);

        window.addEventListener('resize', () => this.onResize());
    }

    createOrb() {
        this.createCore();
        this.createOuterLayer();
        this.createGlow();
        this.createParticles();
    }

    createCore() {
        const geometry = new THREE.IcosahedronGeometry(0.4, 4);
        
        this.coreMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00d4ff,
            emissiveIntensity: 0.8,
            metalness: 0.3,
            roughness: 0.2,
            transparent: true,
            opacity: 0.9
        });

        this.core = new THREE.Mesh(geometry, this.coreMaterial);
        this.core.userData.originalPositions = geometry.attributes.position.array.slice();
        this.scene.add(this.core);
    }

    createOuterLayer() {
        const geometry = new THREE.IcosahedronGeometry(1.0, 5);
        
        this.outerMaterial = new THREE.MeshStandardMaterial({
            color: 0x00d4ff,
            emissive: 0x004466,
            emissiveIntensity: 0.3,
            metalness: 0.1,
            roughness: 0.8,
            transparent: true,
            opacity: 0.4,
            wireframe: false
        });

        this.outerLayer = new THREE.Mesh(geometry, this.outerMaterial);
        this.outerLayer.userData.originalPositions = geometry.attributes.position.array.slice();
        this.scene.add(this.outerLayer);
    }

    createGlow() {
        const glowGeometry = new THREE.SphereGeometry(1.2, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00d4ff,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        
        this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.scene.add(this.glow);
    }

    createParticles() {
        const particleCount = 150;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        this.particleData = [];

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 1.8 + Math.random() * 1.2;
            const height = (Math.random() - 0.5) * 2;
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;

            colors[i * 3] = 0;
            colors[i * 3 + 1] = 0.83 + Math.random() * 0.17;
            colors[i * 3 + 2] = 1;

            sizes[i] = 0.02 + Math.random() * 0.03;

            this.particleData.push({
                angle: angle,
                radius: radius,
                height: height,
                speed: 0.2 + Math.random() * 0.5,
                orbitSpeed: 0.1 + Math.random() * 0.3
            });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 0.04,
            vertexColors: true,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    setAudioLevel(level) {
        this.audioLevel = Math.min(1, Math.max(0, level));
    }

    setState(newState) {
        this.state = newState;
    }

    deformGeometry(mesh, time, intensity) {
        const positions = mesh.geometry.attributes.position.array;
        const original = mesh.userData.originalPositions;
        
        if (!original) return;

        for (let i = 0; i < positions.length; i += 3) {
            const x = original[i];
            const y = original[i + 1];
            const z = original[i + 2];
            
            const noise = Math.sin(x * 3 + time) * Math.cos(y * 3 + time * 0.7) * Math.sin(z * 3 + time * 0.5);
            const noise2 = Math.sin(x * 5 + time * 1.3) * Math.cos(y * 4 + time) * 0.3;
            
            const deform = (noise + noise2) * intensity;
            
            const length = Math.sqrt(x * x + y * y + z * z);
            const scale = 1 + deform;
            
            positions[i] = x * scale;
            positions[i + 1] = y * scale;
            positions[i + 2] = z * scale;
        }
        
        mesh.geometry.attributes.position.needsUpdate = true;
        mesh.geometry.computeVertexNormals();
    }

    updateColors() {
        let baseColor, emissiveColor, emissiveIntensity;
        let glowColor, particleColor;

        switch (this.state) {
            case 'listening':
                baseColor = 0x00ff88;
                emissiveColor = 0x00ff88;
                emissiveIntensity = 0.8;
                glowColor = 0x00ff88;
                break;
            case 'processing':
                baseColor = 0x0088ff;
                emissiveColor = 0x4400ff;
                emissiveIntensity = 0.9;
                glowColor = 0x4400ff;
                break;
            case 'speaking':
                baseColor = 0x00d4ff;
                emissiveColor = 0x00d4ff;
                emissiveIntensity = 1.0;
                glowColor = 0x00d4ff;
                break;
            default:
                baseColor = 0x008899;
                emissiveColor = 0x003344;
                emissiveIntensity = 0.4;
                glowColor = 0x003344;
        }

        const targetCoreColor = new THREE.Color(baseColor);
        const targetEmissive = new THREE.Color(emissiveColor);
        
        this.coreMaterial.color.lerp(targetCoreColor, 0.1);
        this.coreMaterial.emissive.lerp(targetEmissive, 0.1);
        this.coreMaterial.emissiveIntensity = THREE.MathUtils.lerp(
            this.coreMaterial.emissiveIntensity, 
            emissiveIntensity * (1 + this.audioLevel * 0.5), 
            0.1
        );

        this.outerMaterial.color.lerp(targetCoreColor, 0.1);
        this.outerMaterial.emissive.lerp(targetEmissive, 0.1);

        this.glow.material.color.lerp(new THREE.Color(glowColor), 0.1);
        
        this.pointLight.color.lerp(targetCoreColor, 0.1);

        const positions = this.particles.geometry.attributes.position.array;
        const colors = this.particles.geometry.attributes.color.array;
        
        for (let i = 0; i < positions.length / 3; i++) {
            colors[i * 3] = colors[i * 3] * 0.95 + targetCoreColor.r * 0.05;
            colors[i * 3 + 1] = colors[i * 3 + 1] * 0.95 + targetCoreColor.g * 0.05;
            colors[i * 3 + 2] = colors[i * 3 + 2] * 0.95 + targetCoreColor.b * 0.05;
        }
        this.particles.geometry.attributes.color.needsUpdate = true;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.time += 0.016;

        let coreIntensity, outerIntensity, particleSpeed, pulseSpeed;
        
        switch (this.state) {
            case 'idle':
                coreIntensity = 0.15;
                outerIntensity = 0.1;
                particleSpeed = 0.3;
                pulseSpeed = 0.5;
                break;
            case 'listening':
                coreIntensity = 0.3 + this.audioLevel * 0.4;
                outerIntensity = 0.25 + this.audioLevel * 0.3;
                particleSpeed = 0.8 + this.audioLevel * 0.5;
                pulseSpeed = 1.5;
                break;
            case 'processing':
                coreIntensity = 0.4;
                outerIntensity = 0.35;
                particleSpeed = 1.2;
                pulseSpeed = 3.0;
                break;
            case 'speaking':
                coreIntensity = 0.35 + this.audioLevel * 0.5;
                outerIntensity = 0.3 + this.audioLevel * 0.4;
                particleSpeed = 1.0 + this.audioLevel * 0.8;
                pulseSpeed = 2.0;
                break;
            default:
                coreIntensity = 0.15;
                outerIntensity = 0.1;
                particleSpeed = 0.3;
                pulseSpeed = 0.5;
        }

        const pulse = Math.sin(this.time * pulseSpeed) * 0.1;
        
        this.deformGeometry(this.core, this.time, coreIntensity + pulse);
        this.deformGeometry(this.outerLayer, this.time * 0.7, outerIntensity);

        const coreScale = 1 + pulse * 0.2 + this.audioLevel * 0.2;
        this.core.scale.setScalar(coreScale);
        
        const outerScale = 1 + pulse * 0.1 + this.audioLevel * 0.15;
        this.outerLayer.scale.setScalar(outerScale);

        this.core.rotation.y += 0.005;
        this.core.rotation.x += 0.003;
        
        this.outerLayer.rotation.y -= 0.003;
        this.outerLayer.rotation.z += 0.002;

        const glowScale = 1.2 + pulse * 0.1 + this.audioLevel * 0.3;
        this.glow.scale.setScalar(glowScale);
        this.glow.material.opacity = 0.1 + this.audioLevel * 0.15 + pulse * 0.05;

        this.updateParticles(particleSpeed);

        const baseIntensity = 1.5;
        const audioBoost = this.audioLevel * 4;
        this.pointLight.intensity = baseIntensity + audioBoost;

        this.updateColors();

        this.renderer.render(this.scene, this.camera);
    }

    updateParticles(speed) {
        const positions = this.particles.geometry.attributes.position.array;
        
        for (let i = 0; i < this.particleData.length; i++) {
            const p = this.particleData[i];
            
            p.angle += p.orbitSpeed * speed * 0.02;
            
            const radiusVariation = Math.sin(this.time * p.speed) * 0.2;
            const radius = p.radius + radiusVariation;
            
            positions[i * 3] = Math.cos(p.angle) * radius;
            positions[i * 3 + 2] = Math.sin(p.angle) * radius;
            positions[i * 3 + 1] = p.height + Math.sin(this.time * p.speed * 2) * 0.2;
        }
        
        this.particles.geometry.attributes.position.needsUpdate = true;
        
        this.particles.rotation.y += 0.001 * speed;
    }

    onResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    getCanvas() {
        return this.renderer.domElement;
    }
}
