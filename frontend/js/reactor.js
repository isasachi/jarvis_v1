class ArcReactor {
    constructor(container) {
        this.container = container;
        this.audioLevel = 0;
        this.state = 'idle';
        this.time = 0;
        
        this.init();
        this.createReactor();
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
        this.camera.position.z = 4;

        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true 
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        this.pointLight = new THREE.PointLight(0x00d4ff, 2, 15);
        this.pointLight.position.set(0, 0, 2);
        this.scene.add(this.pointLight);

        const ambientLight = new THREE.AmbientLight(0x001122, 0.5);
        this.scene.add(ambientLight);

        window.addEventListener('resize', () => this.onResize());
    }

    createReactor() {
        this.createCore();
        this.createOuterRing();
        this.createMiddleRings();
        this.createGlowSphere();
        this.createParticles();
    }

    createCore() {
        const geometry = new THREE.SphereGeometry(0.3, 32, 32);
        
        this.coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1
        });

        this.core = new THREE.Mesh(geometry, this.coreMaterial);
        this.scene.add(this.core);

        const innerGlowGeometry = new THREE.SphereGeometry(0.4, 32, 32);
        const innerGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00d4ff,
            transparent: true,
            opacity: 0.5,
            side: THREE.BackSide
        });
        this.innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
        this.scene.add(this.innerGlow);
    }

    createOuterRing() {
        const outerGeometry = new THREE.TorusGeometry(1.0, 0.08, 16, 100);
        const outerMaterial = new THREE.MeshBasicMaterial({
            color: 0x00d4ff,
            transparent: true,
            opacity: 0.9
        });
        
        this.outerRing = new THREE.Mesh(outerGeometry, outerMaterial);
        this.scene.add(this.outerRing);

        const outerGlowGeometry = new THREE.TorusGeometry(1.0, 0.2, 16, 100);
        const outerGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00d4ff,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        this.outerRingGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
        this.scene.add(this.outerRingGlow);

        this.createRingSpikes(this.outerRing, 12);
    }

    createRingSpikes(ring, count) {
        const spikeGroup = new THREE.Group();
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            
            const spikeGeometry = new THREE.ConeGeometry(0.06, 0.25, 8);
            const spikeMaterial = new THREE.MeshBasicMaterial({
                color: 0x00d4ff,
                transparent: true,
                opacity: 0.8
            });
            
            const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
            spike.position.x = Math.cos(angle) * 1.0;
            spike.position.y = Math.sin(angle) * 1.0;
            spike.rotation.z = angle + Math.PI / 2;
            
            spikeGroup.add(spike);
        }
        
        this.scene.add(spikeGroup);
        this.ringSpikes = spikeGroup;
    }

    createMiddleRings() {
        this.middleRings = [];
        
        const ringConfigs = [
            { radius: 0.7, tube: 0.04, speed: 1.2, tilt: 0 },
            { radius: 0.5, tube: 0.03, speed: -0.8, tilt: Math.PI / 4 },
            { radius: 0.35, tube: 0.025, speed: 0.6, tilt: -Math.PI / 6 }
        ];

        ringConfigs.forEach((config, index) => {
            const geometry = new THREE.TorusGeometry(config.radius, config.tube, 16, 64);
            const material = new THREE.MeshBasicMaterial({
                color: 0x00d4ff,
                transparent: true,
                opacity: 0.7 - index * 0.15
            });
            
            const ring = new THREE.Mesh(geometry, material);
            ring.rotation.x = Math.PI / 2;
            ring.rotation.y = config.tilt;
            ring.userData = { speed: config.speed, tilt: config.tilt };
            
            this.middleRings.push(ring);
            this.scene.add(ring);
        });
    }

    createGlowSphere() {
        const glowGeometry = new THREE.SphereGeometry(1.4, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00d4ff,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
        });
        
        this.glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
        this.scene.add(this.glowSphere);
    }

    createParticles() {
        const particleCount = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        this.particleData = [];

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.8 + Math.random() * 0.8;
            const height = (Math.random() - 0.5) * 0.3;
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;

            colors[i * 3] = 0;
            colors[i * 3 + 1] = 0.83;
            colors[i * 3 + 2] = 1;

            this.particleData.push({
                angle: angle,
                radius: radius,
                height: height,
                speed: 0.5 + Math.random() * 1,
                offset: Math.random() * Math.PI * 2
            });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.03,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
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

    updateColors() {
        let baseColor, emissiveColor;

        switch (this.state) {
            case 'listening':
                baseColor = new THREE.Color(0x00ff88);
                emissiveColor = 0x00ff88;
                break;
            case 'processing':
                baseColor = new THREE.Color(0xff6b00);
                emissiveColor = 0xff6b00;
                break;
            case 'speaking':
                baseColor = new THREE.Color(0x00d4ff);
                emissiveColor = 0x00d4ff;
                break;
            default:
                baseColor = new THREE.Color(0x00d4ff);
                emissiveColor = 0x00d4ff;
        }

        this.coreMaterial.color.lerp(baseColor, 0.15);
        this.innerGlow.material.color.lerp(baseColor, 0.15);
        
        this.outerRing.material.color.lerp(baseColor, 0.15);
        this.outerRingGlow.material.color.lerp(baseColor, 0.15);
        
        if (this.ringSpikes) {
            this.ringSpikes.children.forEach(spike => {
                spike.material.color.lerp(baseColor, 0.15);
            });
        }

        this.middleRings.forEach(ring => {
            ring.material.color.lerp(baseColor, 0.15);
        });

        this.glowSphere.material.color.lerp(baseColor, 0.15);
        this.pointLight.color.lerp(baseColor, 0.15);
        
        const intensity = 1.5 + this.audioLevel * 2;
        this.pointLight.intensity = intensity;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.time += 0.016;

        let pulseSpeed, rotationSpeed, particleSpeed;
        
        switch (this.state) {
            case 'idle':
                pulseSpeed = 0.5;
                rotationSpeed = 0.3;
                particleSpeed = 0.3;
                break;
            case 'listening':
                pulseSpeed = 1.5;
                rotationSpeed = 0.8;
                particleSpeed = 0.8;
                break;
            case 'processing':
                pulseSpeed = 3.0;
                rotationSpeed = 1.5;
                particleSpeed = 1.5;
                break;
            case 'speaking':
                pulseSpeed = 2.0;
                rotationSpeed = 1.0;
                particleSpeed = 1.0;
                break;
            default:
                pulseSpeed = 0.5;
                rotationSpeed = 0.3;
                particleSpeed = 0.3;
        }

        const pulse = Math.sin(this.time * pulseSpeed);
        const audioPulse = this.audioLevel * 0.3;

        const coreScale = 1 + pulse * 0.1 + audioPulse;
        this.core.scale.setScalar(coreScale);
        this.innerGlow.scale.setScalar(coreScale * 1.2);

        this.outerRing.rotation.z += 0.005 * rotationSpeed;
        this.outerRingGlow.rotation.z += 0.005 * rotationSpeed;
        
        const outerRingPulse = 1 + pulse * 0.05 + audioPulse;
        this.outerRing.scale.setScalar(outerRingPulse);
        this.outerRingGlow.scale.setScalar(outerRingPulse);

        if (this.ringSpikes) {
            this.ringSpikes.rotation.z += 0.005 * rotationSpeed;
        }

        this.middleRings.forEach((ring, i) => {
            const data = ring.userData;
            ring.rotation.z += data.speed * 0.01 * rotationSpeed;
            ring.rotation.x = Math.PI / 2 + Math.sin(this.time + i) * 0.1;
        });

        this.updateParticles(particleSpeed);

        const glowScale = 1 + pulse * 0.08 + audioPulse;
        this.glowSphere.scale.setScalar(glowScale);
        this.glowSphere.material.opacity = 0.08 + this.audioLevel * 0.12;

        this.renderer.render(this.scene, this.camera);
    }

    updateParticles(speed) {
        const positions = this.particles.geometry.attributes.position.array;
        const colors = this.particles.geometry.attributes.color.array;
        
        let baseColor;
        switch (this.state) {
            case 'listening': baseColor = { r: 0, g: 1, b: 0.53 }; break;
            case 'processing': baseColor = { r: 1, g: 0.42, b: 0 }; break;
            case 'speaking': baseColor = { r: 0, g: 0.83, b: 1 }; break;
            default: baseColor = { r: 0, g: 0.83, b: 1 };
        }

        for (let i = 0; i < this.particleData.length; i++) {
            const p = this.particleData[i];
            
            p.angle += p.speed * speed * 0.02;
            
            const radiusPulse = Math.sin(this.time * 2 + p.offset) * 0.15 * (1 + this.audioLevel);
            const radius = p.radius + radiusPulse;
            
            positions[i * 3] = Math.cos(p.angle) * radius;
            positions[i * 3 + 2] = Math.sin(p.angle) * radius;
            positions[i * 3 + 1] = p.height + Math.sin(this.time * 3 + p.offset) * 0.1;

            colors[i * 3] = colors[i * 3] * 0.95 + baseColor.r * 0.05;
            colors[i * 3 + 1] = colors[i * 3 + 1] * 0.95 + baseColor.g * 0.05;
            colors[i * 3 + 2] = colors[i * 3 + 2] * 0.95 + baseColor.b * 0.05;
        }
        
        this.particles.geometry.attributes.position.needsUpdate = true;
        this.particles.geometry.attributes.color.needsUpdate = true;
        
        this.particles.rotation.y += 0.002 * speed;
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
